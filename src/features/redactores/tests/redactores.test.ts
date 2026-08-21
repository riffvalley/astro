import { EventEmitter } from 'node:events';
import { request as httpsRequest } from 'node:https';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { WP_BASE_URL } from '../../../lib/wordpressClient';

// node:https/node:fs se mockean porque redactores.ts depende de
// fetchGraphQL/readDevCache/writeDevCache de wordpress.ts, que a su vez usan
// node:https directamente (no fetch) y node:fs para la caché de disco en
// dev — mismo motivo y mismo mock que en wordpress.test.ts.
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

// getRedactores() memoiza su promesa a nivel de módulo la primera vez que se
// llama — sin resetear el módulo, el segundo test recibiría la promesa ya
// resuelta del primero. Mismo motivo/mecanismo que freshWordpressModule() en
// wordpress.test.ts.
async function freshRedactoresModule() {
  vi.resetModules();
  return import('../redactores');
}

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

describe('getRedactores', () => {
  it('sanitizes hyphenated slugs into GraphQL-safe aliases (postAlias) in the request body', async () => {
    const { getRedactores } = await freshRedactoresModule();
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
    const { getRedactores, REDACTOR_REELS } = await freshRedactoresModule();
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
    const { getRedactores } = await freshRedactoresModule();
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
