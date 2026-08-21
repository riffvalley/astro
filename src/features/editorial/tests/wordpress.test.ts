import { EventEmitter } from 'node:events';
import { request as httpsRequest } from 'node:https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// node:https se mockea porque wordpress.ts depende de wordpressClient.ts, que
// lo usa directamente (no fetch) para evitar el fetch instrumentado de
// Netlify — ver comentario en el propio archivo. node:fs se mockea como
// medida de seguridad: import.meta.env.DEV es `true` bajo Vitest (comprobado
// empíricamente), así que sin este mock readDevCache/writeDevCache tocarían
// el filesystem real (.wp-cache/).
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

// Cada test que ejerce fetchGraphQL (vía wordpressClient.ts) necesita una
// instancia fresca del módulo: getAllPosts/getCategories/getPages memoizan
// su promesa a nivel de módulo la primera vez que se llaman
// (`if (!xPromise) ...`) y esa memoización nunca se resetea sola — sin esto,
// el segundo test que llame a getAllPosts() recibiría la promesa (ya
// resuelta o rechazada) del primero. vi.resetModules() resetea el registro
// de módulos normales (incluido wordpressClient.ts, reimportado
// internamente por wordpress.ts); los mocks de node:https/node:fs
// declarados arriba con vi.mock() se mantienen activos.
async function freshWordpressModule() {
  vi.resetModules();
  return import('../api/wordpress');
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

// 1. Transporte GraphQL (retry/backoff, límite de reintentos, status no
//    transitorio, content-type, errores GraphQL, error de red, cache-hit) —
//    movido a src/lib/wordpressClient.ts junto con fetchGraphQL/postJson/
//    enqueue; sus tests viven ahora en wordpressClient.test.ts, probando
//    fetchGraphQL() directamente en vez de a través de getCategories().

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

// 5. Redactores (getRedactores/REDACTOR_REELS/postAlias/...) — movido a
//    src/features/redactores/redactores.ts; sus tests viven ahora en
//    src/features/redactores/tests/redactores.test.ts.
