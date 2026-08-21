import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_BASE } from '../../../lib/apiBase';
import { fetchTikTokVideo, fetchTikTokVideos, type TikTokVideoSummary } from '../api/tiktok';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function video(id: string): TikTokVideoSummary {
  return {
    id,
    title: `Video ${id}`,
    coverImageUrl: `https://example.com/${id}.jpg`,
    permalink: `https://www.tiktok.com/@riffvalley/video/${id}`,
    embedLink: `https://www.tiktok.com/embed/v2/${id}`,
    duration: 30,
    viewCount: 100,
    likeCount: 10,
    commentCount: 2,
    shareCount: 1,
    createTime: '2026-01-01T00:00:00.000Z',
  };
}

describe('fetchTikTokVideos', () => {
  it('requests /tiktok/videos with limit and offset as query params', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [], totalItems: 0, hasMore: false })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTikTokVideos(12, 0);

    expect(fetchMock).toHaveBeenCalledOnce();
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(`${API_BASE}/tiktok/videos`);
    expect(requestedUrl.searchParams.get('limit')).toBe('12');
    expect(requestedUrl.searchParams.get('offset')).toBe('0');
  });

  it('advances the offset on the next page request', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [], totalItems: 0, hasMore: false })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTikTokVideos(12, 24);

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get('offset')).toBe('24');
  });

  it('returns the parsed page (data/totalItems/hasMore) on a successful response', async () => {
    const page = { data: [video('a'), video('b')], totalItems: 30, hasMore: true };
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(page))));

    await expect(fetchTikTokVideos(12, 0)).resolves.toEqual(page);
  });

  it('throws an "HTTP <status>" error on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 500 })));

    await expect(fetchTikTokVideos(12, 0)).rejects.toThrow('HTTP 500');
  });

  it('propagates a network failure as-is (no local catch/wrap)', async () => {
    const networkError = new Error('network down');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(networkError));

    await expect(fetchTikTokVideos(12, 0)).rejects.toBe(networkError);
  });
});

describe('fetchTikTokVideo', () => {
  it('requests /tiktok/videos/:id with the id in the path', async () => {
    const detail = { ...video('a'), videoDescription: 'desc', embedHtml: '<blockquote></blockquote>' };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(detail)));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTikTokVideo('a');

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/tiktok/videos/a`);
  });

  it('URL-encodes the id in the path', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({})));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTikTokVideo('a/b c');

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/tiktok/videos/${encodeURIComponent('a/b c')}`);
  });

  it('returns the parsed detail (summary fields + videoDescription/embedHtml) on a successful response', async () => {
    const detail = { ...video('a'), videoDescription: 'desc', embedHtml: '<blockquote></blockquote>' };
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(detail))));

    await expect(fetchTikTokVideo('a')).resolves.toEqual(detail);
  });

  it('throws an "HTTP 404" error on the documented not-found response', async () => {
    const notFoundBody = { statusCode: 404, message: 'Video not found', error: 'Not Found' };
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(notFoundBody), { status: 404 })));

    await expect(fetchTikTokVideo('missing')).rejects.toThrow('HTTP 404');
  });

  it('propagates a network failure as-is (no local catch/wrap)', async () => {
    const networkError = new Error('network down');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(networkError));

    await expect(fetchTikTokVideo('a')).rejects.toBe(networkError);
  });
});
