import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_BASE } from '../../../lib/apiBase';
import { fetchFilterOptions, fetchMonth } from '../api/discsClient';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchFilterOptions', () => {
  it('requests the public filters endpoint with no query params', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ genres: [], countries: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchFilterOptions();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE}/discs/date/public/filters`);
  });

  it('returns the genres/countries arrays as-is on a successful response', async () => {
    const genres = [{ id: 'g1', name: 'Death Metal' }];
    const countries = [{ id: 'c1', name: 'España' }];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ genres, countries }))));

    await expect(fetchFilterOptions()).resolves.toEqual({ genres, countries });
  });

  it('falls back to empty arrays when genres/countries are missing from the response', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({}))));

    await expect(fetchFilterOptions()).resolves.toEqual({ genres: [], countries: [] });
  });

  it('falls back to empty arrays when genres/countries are explicitly null', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ genres: null, countries: null }))));

    await expect(fetchFilterOptions()).resolves.toEqual({ genres: [], countries: [] });
  });

  it('throws an "HTTP <status>" error on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 500 })));

    await expect(fetchFilterOptions()).rejects.toThrow('HTTP 500');
  });

  it('propagates a network failure as-is (no local catch/wrap)', async () => {
    const networkError = new Error('network down');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(networkError));

    await expect(fetchFilterOptions()).rejects.toBe(networkError);
  });
});

describe('fetchMonth', () => {
  it('requests the month range with limit=1000 and no genre/country when both are empty', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchMonth(2026, 7, '', '');

    expect(fetchMock).toHaveBeenCalledOnce();
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(`${API_BASE}/discs/date/public`);
    expect(requestedUrl.searchParams.getAll('dateRange[]')).toEqual(['2026-08-01', '2026-08-31']);
    expect(requestedUrl.searchParams.get('limit')).toBe('1000');
    expect(requestedUrl.searchParams.has('genre')).toBe(false);
    expect(requestedUrl.searchParams.has('country')).toBe(false);
  });

  it('adds genre/country query params only when provided', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await fetchMonth(2026, 7, 'death-metal', 'es');

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get('genre')).toBe('death-metal');
    expect(requestedUrl.searchParams.get('country')).toBe('es');
  });

  it('returns the parsed data array on a successful response', async () => {
    const data = [{ releaseDate: '2026-08-15', discs: [] }];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ data }))));

    await expect(fetchMonth(2026, 7, '', '')).resolves.toEqual(data);
  });

  it('falls back to an empty array when data is missing from the response', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({}))));

    await expect(fetchMonth(2026, 7, '', '')).resolves.toEqual([]);
  });

  it('throws an "HTTP <status>" error on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 503 })));

    await expect(fetchMonth(2026, 7, '', '')).rejects.toThrow('HTTP 503');
  });

  it('propagates a network failure as-is (no local catch/wrap)', async () => {
    const networkError = new Error('network down');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(networkError));

    await expect(fetchMonth(2026, 7, '', '')).rejects.toBe(networkError);
  });
});
