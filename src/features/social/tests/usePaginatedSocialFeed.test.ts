import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePaginatedSocialFeed, type SocialFeedPage } from '../composables/usePaginatedSocialFeed';

interface Post {
  id: string;
}

function post(id: string): Post {
  return { id };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('usePaginatedSocialFeed', () => {
  it('performs the initial load using the initial cursor and exposes the loaded posts', async () => {
    const fetchPage = vi.fn<(cursor: number) => Promise<SocialFeedPage<Post, number>>>().mockResolvedValueOnce({
      data: [post('a'), post('b')],
      hasMore: true,
      nextCursor: 12,
    });
    const feed = usePaginatedSocialFeed(fetchPage, 0);

    const load = feed.loadMore();
    expect(feed.loading.value).toBe(true);
    expect(feed.errored.value).toBe(false);

    await load;

    expect(fetchPage).toHaveBeenCalledWith(0);
    expect(feed.posts.value.map(p => p.id)).toEqual(['a', 'b']);
    expect(feed.loading.value).toBe(false);
    expect(feed.hasMore.value).toBe(true);
  });

  it('loads the next page with the advanced cursor and appends results in order', async () => {
    const fetchPage = vi
      .fn<(cursor: number) => Promise<SocialFeedPage<Post, number>>>()
      .mockResolvedValueOnce({ data: [post('a'), post('b')], hasMore: true, nextCursor: 12 })
      .mockResolvedValueOnce({ data: [post('c'), post('d')], hasMore: true, nextCursor: 24 });
    const feed = usePaginatedSocialFeed(fetchPage, 0);

    await feed.loadMore();
    await feed.loadMore();

    expect(fetchPage).toHaveBeenNthCalledWith(1, 0);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 12);
    expect(feed.posts.value.map(p => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(feed.cursor.value).toBe(24);
  });

  it('guards against concurrent loads: a second call while one is in flight is a no-op', async () => {
    const pending = deferred<SocialFeedPage<Post, number>>();
    const fetchPage = vi.fn<(cursor: number) => Promise<SocialFeedPage<Post, number>>>().mockReturnValueOnce(pending.promise);
    const feed = usePaginatedSocialFeed(fetchPage, 0);

    const first = feed.loadMore();
    const second = feed.loadMore();

    expect(await second).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(1);

    pending.resolve({ data: [post('a')], hasMore: true, nextCursor: 12 });
    expect(await first).toBe(true);
    expect(feed.posts.value.map(p => p.id)).toEqual(['a']);
  });

  it('stops requesting once pagination is exhausted', async () => {
    const fetchPage = vi
      .fn<(cursor: number) => Promise<SocialFeedPage<Post, number>>>()
      .mockResolvedValueOnce({ data: [post('a')], hasMore: false, nextCursor: 12 });
    const feed = usePaginatedSocialFeed(fetchPage, 0);

    await feed.loadMore();
    expect(feed.hasMore.value).toBe(false);

    const loadedAgain = await feed.loadMore();

    expect(loadedAgain).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('surfaces a fetch failure as errored without touching posts or hasMore', async () => {
    const fetchPage = vi.fn<(cursor: number) => Promise<SocialFeedPage<Post, number>>>().mockRejectedValueOnce(new Error('HTTP 500'));
    const feed = usePaginatedSocialFeed(fetchPage, 0);

    await feed.loadMore();

    expect(feed.errored.value).toBe(true);
    expect(feed.loading.value).toBe(false);
    expect(feed.posts.value).toEqual([]);
    expect(feed.hasMore.value).toBe(true);
  });

  it('recovers on retry after an error, since hasMore is left untouched', async () => {
    const fetchPage = vi
      .fn<(cursor: number) => Promise<SocialFeedPage<Post, number>>>()
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce({ data: [post('a')], hasMore: true, nextCursor: 12 });
    const feed = usePaginatedSocialFeed(fetchPage, 0);

    await feed.loadMore();
    expect(feed.errored.value).toBe(true);

    const retried = await feed.loadMore();

    expect(retried).toBe(true);
    expect(feed.errored.value).toBe(false);
    expect(feed.posts.value.map(p => p.id)).toEqual(['a']);
    // El reintento reusa el mismo cursor: la página fallida no avanzó nada.
    expect(fetchPage).toHaveBeenNthCalledWith(2, 0);
  });

  it('selects a post for the detail view and closes it back to the grid', () => {
    const fetchPage = vi.fn<(cursor: number) => Promise<SocialFeedPage<Post, number>>>();
    const feed = usePaginatedSocialFeed(fetchPage, 0);
    const selected = post('a');

    feed.selectPost(selected);
    // Vue envuelve los objetos asignados a un ref en un reactive proxy, así
    // que comparamos por valor en vez de por identidad de referencia.
    expect(feed.selectedPost.value).toEqual(selected);

    feed.closeDetail();
    expect(feed.selectedPost.value).toBeNull();
  });

  it('evolves a numeric offset cursor the way Instagram pagination does', async () => {
    const LIMIT = 12;
    const fetchPage = vi
      .fn<(offset: number) => Promise<SocialFeedPage<Post, number>>>()
      .mockImplementation(async offset => ({
        data: [post(`ig-${offset}`)],
        hasMore: offset < 24,
        nextCursor: offset + LIMIT,
      }));
    const feed = usePaginatedSocialFeed(fetchPage, 0);

    await feed.loadMore();
    await feed.loadMore();
    await feed.loadMore();

    expect(fetchPage.mock.calls.map(([offset]) => offset)).toEqual([0, 12, 24]);
    expect(feed.posts.value.map(p => p.id)).toEqual(['ig-0', 'ig-12', 'ig-24']);
    expect(feed.hasMore.value).toBe(false);
    expect(feed.cursor.value).toBe(36);

    // Paginación agotada: no se hace ninguna llamada adicional.
    expect(await feed.loadMore()).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('evolves a nullable "before" cursor from the response the way Telegram pagination does', async () => {
    const fetchPage = vi
      .fn<(before: string | undefined) => Promise<SocialFeedPage<Post, string | undefined>>>()
      .mockResolvedValueOnce({ data: [post('tg-1')], hasMore: true, nextCursor: 'msg-1' })
      .mockResolvedValueOnce({ data: [post('tg-2')], hasMore: false, nextCursor: undefined });
    const feed = usePaginatedSocialFeed<Post, string | undefined>(fetchPage, undefined);

    await feed.loadMore();
    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined);
    expect(feed.cursor.value).toBe('msg-1');

    await feed.loadMore();
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'msg-1');
    expect(feed.posts.value.map(p => p.id)).toEqual(['tg-1', 'tg-2']);
    expect(feed.hasMore.value).toBe(false);
    expect(feed.cursor.value).toBeUndefined();
  });
});
