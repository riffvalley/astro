import { EventEmitter } from 'node:events';
import { request as httpsRequest } from 'node:https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// node:https se mockea porque wordpressClient.ts lo usa directamente (no
// fetch) para evitar el fetch instrumentado de Netlify — ver comentario en
// el propio archivo. node:fs se mockea como medida de seguridad:
// import.meta.env.DEV es `true` bajo Vitest (comprobado empíricamente), así
// que sin este mock readDevCache/writeDevCache tocarían el filesystem real
// (.wp-cache/).
vi.mock('node:https', () => ({ request: vi.fn() }));
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => false),
  mkdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

type FakeReq = EventEmitter & { write: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> };
type FakeRes = EventEmitter & { statusCode: number; statusMessage: string; headers: Record<string, string> };

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
      write: vi.fn(),
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
      write: vi.fn(),
      end: vi.fn(() => { queueMicrotask(() => req.emit('error', error)); }),
    }) as FakeReq;

    return req as unknown as ReturnType<typeof httpsRequest>;
  }) as typeof httpsRequest);
}

// fetchGraphQL() tiene su propio Map de caché a nivel de módulo (además del
// requestChain de enqueue()) — cada test necesita una instancia fresca para
// no heredar entradas cacheadas ni el estado de espaciado del test anterior.
async function freshClientModule() {
  vi.resetModules();
  return import('./wordpressClient');
}

// Avanza el tiempo simulado lo suficiente para que se resuelvan tanto los
// backoffs entre reintentos (hasta 500+1000+2000+4000+8000=15500ms) como el
// espaciado de 150ms entre peticiones encoladas — ninguno de los dos usa
// tiempo real bajo fake timers.
async function flushRetries() {
  await vi.advanceTimersByTimeAsync(60_000);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.mocked(httpsRequest).mockReset();
  vi.useRealTimers();
});

describe('fetchGraphQL', () => {
  const query = 'query Test { field }';

  it('retries on 429 and eventually resolves', async () => {
    const { fetchGraphQL } = await freshClientModule();
    queueHttpsResponse(429, '');
    queueHttpsResponse(200, JSON.stringify({ data: { ok: true } }));

    const promise = fetchGraphQL(query);
    await flushRetries();

    await expect(promise).resolves.toEqual({ ok: true });
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(2);
  });

  it('retries on 5xx and eventually resolves', async () => {
    const { fetchGraphQL } = await freshClientModule();
    queueHttpsResponse(503, '');
    queueHttpsResponse(200, JSON.stringify({ data: { ok: true } }));

    const promise = fetchGraphQL(query);
    await flushRetries();

    await expect(promise).resolves.toEqual({ ok: true });
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(2);
  });

  it('exhausts the current retry limit (6 attempts total) and throws on persistent 5xx', async () => {
    const { fetchGraphQL } = await freshClientModule();
    for (let i = 0; i < 6; i++) queueHttpsResponse(500, '');

    const promise = fetchGraphQL(query);
    promise.catch(() => {}); // engancha un handler ya mismo — evita el warning de "unhandled rejection" mientras avanzan los timers
    await flushRetries();

    await expect(promise).rejects.toThrow('GraphQL request failed: 500');
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(6);
  });

  it('does not retry a non-transient status (e.g. 404) — fails on the first attempt', async () => {
    const { fetchGraphQL } = await freshClientModule();
    queueHttpsResponse(404, 'Not Found');

    const promise = fetchGraphQL(query);
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toThrow('GraphQL request failed: 404');
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(1);
  });

  it('throws when the response content-type is not JSON', async () => {
    const { fetchGraphQL } = await freshClientModule();
    queueHttpsResponse(200, '<html>WAF block page</html>', 'text/html');

    const promise = fetchGraphQL(query);
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toThrow(/non-JSON response/);
  });

  it('throws with the joined message when the GraphQL response has errors', async () => {
    const { fetchGraphQL } = await freshClientModule();
    queueHttpsResponse(200, JSON.stringify({
      errors: [{ message: 'Cannot query field "foo"' }, { message: 'Syntax error' }],
    }));

    const promise = fetchGraphQL(query);
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toThrow('Cannot query field "foo", Syntax error');
  });

  it('propagates a network-level error as-is, without retrying', async () => {
    const { fetchGraphQL } = await freshClientModule();
    const networkError = new Error('ECONNRESET');
    queueHttpsNetworkError(networkError);

    const promise = fetchGraphQL(query);
    promise.catch(() => {});
    await flushRetries();

    await expect(promise).rejects.toBe(networkError);
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(1);
  });

  it('returns the cached response on an identical second call, without a new HTTP request', async () => {
    // A diferencia de getAllPosts/getCategories/getPages/getRedactores (que
    // memoizan su propia promesa y por eso nunca piden la misma query dos
    // veces), fetchGraphQL() no memoiza nada por sí sola — llamarla dos
    // veces seguidas con la misma query+variables desde el mismo módulo sí
    // hace un cache hit real de su Map interno. Antes de esta extracción
    // esto no era observable vía la API pública (quedó documentado como
    // bloqueado); ahora que fetchGraphQL es la unidad bajo test, sí lo es.
    const { fetchGraphQL } = await freshClientModule();
    queueHttpsResponse(200, JSON.stringify({ data: { ok: true } }));

    const first = await fetchGraphQL(query, { foo: 'bar' });
    const second = await fetchGraphQL(query, { foo: 'bar' });

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(vi.mocked(httpsRequest)).toHaveBeenCalledTimes(1);
  });
});
