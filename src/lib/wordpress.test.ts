import { EventEmitter } from 'node:events';
import { request as httpsRequest } from 'node:https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// node:https se mockea porque wordpress.ts lo usa directamente (no fetch) para
// evitar el fetch instrumentado de Netlify — ver comentario en el propio
// archivo. node:fs se mockea como medida de seguridad: import.meta.env.DEV es
// `true` bajo Vitest (comprobado empíricamente), así que sin este mock
// readDevCache/writeDevCache tocarían el filesystem real (.wp-cache/).
vi.mock('node:https', () => ({ request: vi.fn() }));
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

type FakeReq = EventEmitter & { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
type FakeRes = EventEmitter & { statusCode: number; statusMessage: string; headers: Record<string, string> };

let capturedBodies: string[] = [];

// Encola la siguiente respuesta que devolverá la próxima llamada a
// httpsRequest(). La entrega de datos ocurre en un microtask (no un timer),
// así que no depende de fake timers para llegar — solo el backoff entre
// reintentos y el espaciado de enqueue() son timers reales que sí hace falta
// avanzar explícitamente.
function queueHttpsResponse(status: number, body: string, contentType = 'application/json') {
  vi.mocked(httpsRequest).mockImplementationOnce(((_options: unknown, callback: (res: FakeRes) => void) => {
    const res = Object.assign(new EventEmitter(), {
      statusCode: status,
      statusMessage: '',
      headers: { 'content-type': contentType },
    }) as FakeRes;

    const req = Object.assign(new EventEmitter(), {
      write: vi.fn((chunk: string) => { capturedBodies.push(chunk); }),
      end: vi.fn(() => {
        callback(res);
        queueMicrotask(() => {
          res.emit('data', Buffer.from(body));
          res.emit('end');
        });
      }),
    }) as FakeReq;

    return req as unknown as ReturnType<typeof httpsRequest>;
  }) as typeof httpsRequest);
}

function queueHttpsNetworkError(error: Error) {
  vi.mocked(httpsRequest).mockImplementationOnce((() => {
    const req = Object.assign(new EventEmitter(), {
      write: vi.fn((chunk: string) => { capturedBodies.push(chunk); }),
      end: vi.fn(() => { queueMicrotask(() => req.emit('error', error)); }),
    }) as FakeReq;

    return req as unknown as ReturnType<typeof httpsRequest>;
  }) as typeof httpsRequest);
}

// Cada test que ejerce fetchGraphQL necesita una instancia fresca del módulo:
// getAllPosts/getCategories/getPages/getRedactores memoizan su promesa a
// nivel de módulo la primera vez que se llaman (`if (!xPromise) ...`) y esa
// memoización nunca se resetea sola — sin esto, el segundo test que llame a
// getCategories() recibiría la promesa (ya resuelta o rechazada) del primero.
// vi.resetModules() resetea el registro de módulos normales; los mocks de
// node:https/node:fs declarados arriba con vi.mock() se mantienen activos.
async function freshWordpressModule() {
  vi.resetModules();
  return import('./wordpress');
}

// Avanza el tiempo simulado lo suficiente para que se resuelvan tanto los
// backoffs entre reintentos (hasta 500+1000+2000+4000+8000=15500ms) como el
// espaciado de 150ms entre peticiones encoladas — ninguno de los dos usa
// tiempo real bajo fake timers.
async function flushRetries() {
  await vi.advanceTimersByTimeAsync(60_000);
}

beforeEach(() => {
  capturedBodies = [];
  vi.useFakeTimers();
});

afterEach(() => {
  vi.mocked(httpsRequest).mockReset();
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. Transporte GraphQL — caracterizado a través de getCategories(), la
//    entrada pública con la query/respuesta más simple (sin normalización
//    adicional aplicada al resultado).
// ---------------------------------------------------------------------------
describe('GraphQL transport (via getCategories)', () => {
  it('retries on 429 and eventually resolves', async () => {
    const { getCategories } = await freshWordpressModule();
    queueHttpsResponse(429, '');
    queueHttpsResponse(200, JSON.stringify({ data: { categories: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } ));

    const promise = getCategories();
    await flushRetries();

    await expect(promise).resolves.toEqual([]);
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(2);
  });

  it('retries on 5xx and eventually resolves', async () => {
    const { getCategories } = await freshWordpressModule();
    queueHttpsResponse(503, '');
    queueHttpsResponse(200, JSON.stringify({ data: { categories: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } }));

    const promise = getCategories();
    await flushRetries();

    await expect(promise).resolves.toEqual([]);
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(2);
  });

  it('exhausts the current retry limit (6 attempts total) and throws on persistent 5xx', async () => {
    const { getCategories } = await freshWordpressModule();
    for (let i = 0; i < 6; i++) queueHttpsResponse(500, '');

    const promise = getCategories();
    promise.catch(() => {}); // engancha un handler ya mismo — evita el warning de "unhandled rejection" mientras avanzan los timers
    await flushRetries();

    await expect(promise).rejects.toThrow('GraphQL request failed: 500');
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(6);
  });

  it('does not retry a non-transient status (e.g. 404) — fails on the first attempt', async () => {
    const { getCategories } = await freshWordpressModule();
    queueHttpsResponse(404, 'Not Found');

    const promise = getCategories();
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toThrow('GraphQL request failed: 404');
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(1);
  });

  it('throws when the response content-type is not JSON', async () => {
    const { getCategories } = await freshWordpressModule();
    queueHttpsResponse(200, '<html>WAF block page</html>', 'text/html');

    const promise = getCategories();
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toThrow(/non-JSON response/);
  });

  it('throws with the joined message when the GraphQL response has errors', async () => {
    const { getCategories } = await freshWordpressModule();
    queueHttpsResponse(200, JSON.stringify({
      errors: [{ message: 'Cannot query field "foo"' }, { message: 'Syntax error' }],
    }));

    const promise = getCategories();
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toThrow('Cannot query field "foo", Syntax error');
  });

  it('propagates a network-level error as-is, without retrying', async () => {
    const { getCategories } = await freshWordpressModule();
    const networkError = new Error('ECONNRESET');
    queueHttpsNetworkError(networkError);

    const promise = getCategories();
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toBe(networkError);
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(1);
  });

  // BLOQUEADO — ver informe final: fetchGraphQL() y su Map de caché en
  // memoria son privados, y las 4 puertas públicas que lo usan
  // (getAllPosts/getCategories/getPages/getRedactores) memoizan su propia
  // promesa nada más llamarse la primera vez, así que ninguna de ellas puede
  // volver a pedir la MISMA query+variables dos veces dentro de la vida de
  // una instancia de módulo. No hay ninguna combinación de API pública que
  // provoque un cache hit real de fetchGraphQL sin exportar algo solo para
  // testearlo, lo cual está fuera de alcance.
});

// ---------------------------------------------------------------------------
// 2. Posts / paginación / normalización — vía getAllPosts(), incluyendo
//    stripGenerator/truncateAtEmbeddedDoctype (3) sobre el resultado público.
// ---------------------------------------------------------------------------
describe('getAllPosts / pagination', () => {
  function postNode(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: '1', title: 'T', slug: 's', uri: '/articulos/s', date: '2026-01-01',
      excerpt: '', content: '<p>hola</p>', featuredImage: null, author: null,
      categories: { nodes: [] }, seo: { fullHead: '<title>T</title>' },
      ...overrides,
    };
  }

  it('paginates via hasNextPage/endCursor and concatenates pages in order', async () => {
    const { getAllPosts } = await freshWordpressModule();
    queueHttpsResponse(200, JSON.stringify({
      data: { posts: { nodes: [postNode({ id: 'p1' })], pageInfo: { hasNextPage: true, endCursor: 'CURSOR1' } } },
    }));
    queueHttpsResponse(200, JSON.stringify({
      data: { posts: { nodes: [postNode({ id: 'p2' })], pageInfo: { hasNextPage: false, endCursor: null } } },
    }));

    const promise = getAllPosts();
    await flushRetries();
    const posts = await promise;

    expect(posts.map(p => p.id)).toEqual(['p1', 'p2']);
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(2);
  });

  it('falls back to the no-seo query for a page when the with-seo request fails, and omits seo in the retry body', async () => {
    const { getAllPosts } = await freshWordpressModule();
    // 301: no es transitorio (isRetryableStatus), así que falla al primer
    // intento y fetchAllPosts() cae al catch → reintenta sin seo.
    queueHttpsResponse(301, '');
    queueHttpsResponse(200, JSON.stringify({
      data: { posts: { nodes: [postNode({ id: 'p1' })], pageInfo: { hasNextPage: false, endCursor: null } } },
    }));

    const promise = getAllPosts();
    await flushRetries();
    const posts = await promise;

    expect(posts.map(p => p.id)).toEqual(['p1']);
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(2);
    expect(capturedBodies[0]).toContain('seo');
    expect(capturedBodies[1]).not.toContain('seo');
  });

  it('rejects the whole getAllPosts() call if a page fails both with and without seo (no partial results)', async () => {
    const { getAllPosts } = await freshWordpressModule();
    queueHttpsResponse(301, ''); // falla con seo
    queueHttpsResponse(301, ''); // falla también sin seo — sin más fallback

    const promise = getAllPosts();
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toThrow('GraphQL request failed: 301');
  });

  it('memoizes the rejection: a second call after a failure rejects again without any new HTTP request', async () => {
    const { getAllPosts } = await freshWordpressModule();
    queueHttpsResponse(301, '');
    queueHttpsResponse(301, '');

    const first = getAllPosts();
    first.catch(() => {});
    await flushRetries();
    await expect(first).rejects.toThrow();

    const callsAfterFirst = vi.mocked(httpsRequest).mock.calls.length;
    const second = getAllPosts();
    second.catch(() => {});
    await expect(second).rejects.toThrow();
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(callsAfterFirst);
  });

  it('truncates content at an embedded <!DOCTYPE, and leaves content without one unchanged', async () => {
    const { getAllPosts } = await freshWordpressModule();
    queueHttpsResponse(200, JSON.stringify({
      data: {
        posts: {
          nodes: [
            postNode({ id: 'with-doctype', content: '<p>real</p><!DOCTYPE html><html>injected</html>' }),
            postNode({ id: 'without-doctype', content: '<p>plain content</p>' }),
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    }));

    const promise = getAllPosts();
    await flushRetries();
    const posts = await promise;

    expect(posts.find(p => p.id === 'with-doctype')!.content).toBe('<p>real</p>');
    expect(posts.find(p => p.id === 'without-doctype')!.content).toBe('<p>plain content</p>');
  });

  it('does NOT truncate when <!DOCTYPE is at index 0 (existing behavior, not "fixed")', async () => {
    const { getAllPosts } = await freshWordpressModule();
    const content = '<!DOCTYPE html><html>whole doc</html>';
    queueHttpsResponse(200, JSON.stringify({
      data: { posts: { nodes: [postNode({ id: 'p1', content })], pageInfo: { hasNextPage: false, endCursor: null } } },
    }));

    const promise = getAllPosts();
    await flushRetries();
    const posts = await promise;

    expect(posts[0].content).toBe(content);
  });

  it('strips the generator meta tag from seo.fullHead when present', async () => {
    const { getAllPosts } = await freshWordpressModule();
    queueHttpsResponse(200, JSON.stringify({
      data: {
        posts: {
          nodes: [postNode({ id: 'p1', seo: { fullHead: '<meta name="generator" content="WordPress 6.4" /><title>T</title>' } })],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    }));

    const promise = getAllPosts();
    await flushRetries();
    const posts = await promise;

    expect(posts[0].seo?.fullHead).toBe('<title>T</title>');
  });

  it('leaves seo as null when the post has no seo object at all', async () => {
    const { getAllPosts } = await freshWordpressModule();
    queueHttpsResponse(200, JSON.stringify({
      data: { posts: { nodes: [postNode({ id: 'p1', seo: null })], pageInfo: { hasNextPage: false, endCursor: null } } },
    }));

    const promise = getAllPosts();
    await flushRetries();
    const posts = await promise;

    expect(posts[0].seo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. Normalización — cubierta arriba mediante getAllPosts() (stripGenerator,
//    truncateAtEmbeddedDoctype), tal como pedía la caracterización "mediante
//    API pública cuando sea posible".
// ---------------------------------------------------------------------------

// 4. Parsing editorial (extractReviewScore/extractHighlightedBands) — movido
//    a src/lib/editorialParsing.ts junto con el resto de la extracción de
//    ese archivo; sus tests viven ahora en editorialParsing.test.ts.

// ---------------------------------------------------------------------------
// 5. Redactores — ensamblado y postAlias, caracterizados vía getRedactores(),
//    la única puerta pública de este clúster.
// ---------------------------------------------------------------------------
describe('getRedactores', () => {
  it('sanitizes hyphenated slugs into GraphQL-safe aliases (postAlias) in the request body', async () => {
    const { getRedactores } = await freshWordpressModule();
    queueHttpsResponse(200, JSON.stringify({ data: { users: { nodes: [] } } }));

    const promise = getRedactores();
    await flushRetries();
    await promise;

    // 'fucking-stone' es el único slug curado con guion — su alias saneado
    // debe llevar guion bajo, nunca el guion original (inválido en GraphQL).
    expect(capturedBodies[0]).toContain('post_fucking_stone');
    expect(capturedBodies[0]).not.toContain('post_fucking-stone');
  });

  it('orders redactores by the curated slug list, drops slugs without a matching WP user, and always appends the app entry last', async () => {
    const { getRedactores, REDACTOR_REELS } = await freshWordpressModule();
    // users.nodes en orden distinto al curado, y sin 'yerca' (que sí está
    // curado) — debe desaparecer del resultado sin romper nada.
    queueHttpsResponse(200, JSON.stringify({
      data: {
        users: {
          nodes: [
            { name: 'Fucking Stone', slug: 'fucking-stone', avatar: { url: 'https://example.com/fs.png' } },
            { name: 'Kelevra', slug: 'kelevra', avatar: null },
          ],
        },
        post_kelevra: { title: 'Top 10 Kelevra', uri: '/articulos/top-10-discos-2025-kelevra', featuredImage: { node: { sourceUrl: 'https://example.com/k.jpg' } } },
        post_fucking_stone: { title: 'Top 10 FS', uri: '/articulos/top-10-discos-2025-fuckingstone', featuredImage: null },
      },
    }));

    const promise = getRedactores();
    await flushRetries();
    const redactores = await promise;

    // Orden real de REDACTOR_SLUGS: yerca, kelevra, fucking-stone, ... —
    // yerca se cae por no tener user; kelevra precede a fucking-stone.
    expect(redactores.map(r => r.slug)).toEqual(['kelevra', 'fucking-stone', 'riffvalley-app']);

    const app = redactores[redactores.length - 1];
    expect(app).toMatchObject({ name: 'Riff Valley App', slug: 'riffvalley-app', reelUrl: null, blankReel: true });

    const kelevra = redactores.find(r => r.slug === 'kelevra')!;
    expect(kelevra.reelUrl).toBe(REDACTOR_REELS.kelevra);
  });

  it('falls back to the manual image override when the featured image is missing (fucking-stone)', async () => {
    const { getRedactores, WP_BASE_URL } = await freshWordpressModule();
    queueHttpsResponse(200, JSON.stringify({
      data: {
        users: { nodes: [{ name: 'Fucking Stone', slug: 'fucking-stone', avatar: null }] },
        post_fucking_stone: { title: 'Top 10 FS', uri: '/articulos/top-10-discos-2025-fuckingstone', featuredImage: null },
      },
    }));

    const promise = getRedactores();
    await flushRetries();
    const redactores = await promise;

    const fuckingStone = redactores.find(r => r.slug === 'fucking-stone')!;
    expect(fuckingStone.post?.featuredImage).toEqual({
      sourceUrl: `${WP_BASE_URL}/wp-content/uploads/2025/04/Wrath-of-Logarius-Crown-Of-Mortis.jpg`,
    });
  });
});
