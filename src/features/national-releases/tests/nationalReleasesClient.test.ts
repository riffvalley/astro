import { afterEach, describe, expect, it, vi } from 'vitest';

import { API_BASE } from '../../../lib/apiBase';
import { fetchNationalReleases, submitNationalReleases } from '../api/nationalReleasesClient';
import type { NationalReleaseProposal } from '../model/nationalRelease.types';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('fetchNationalReleases', () => {
  it('requests the public endpoint with month and year as query params', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([])));
    vi.stubGlobal('fetch', fetchMock);

    await fetchNationalReleases(8, 2026);

    expect(fetchMock).toHaveBeenCalledOnce();
    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(`${API_BASE}/national-releases/public`);
    expect(requestedUrl.searchParams.get('month')).toBe('8');
    expect(requestedUrl.searchParams.get('year')).toBe('2026');
  });

  it('returns the parsed array on a successful response', async () => {
    const items = [{ artistName: 'Band', discName: 'Album', discType: 'album', genre: 'Metal', releaseDay: '2026-08-15' }];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(items))));

    await expect(fetchNationalReleases(8, 2026)).resolves.toEqual(items);
  });

  it('falls back to an empty array when the response body is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ not: 'an array' }))));

    await expect(fetchNationalReleases(8, 2026)).resolves.toEqual([]);
  });

  it('falls back to an empty array when the response body is null', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('null')));

    await expect(fetchNationalReleases(8, 2026)).resolves.toEqual([]);
  });

  it('throws an "HTTP <status>" error on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 500 })));

    await expect(fetchNationalReleases(8, 2026)).rejects.toThrow('HTTP 500');
  });

  it('propagates a network failure as-is (no local catch/wrap)', async () => {
    const networkError = new Error('network down');
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(networkError));

    await expect(fetchNationalReleases(8, 2026)).rejects.toBe(networkError);
  });
});

describe('submitNationalReleases', () => {
  const payload: NationalReleaseProposal[] = [
    { artistName: 'Band', discName: 'Album', discType: 'album', genre: 'Metal', releaseDay: '2026-08-15' },
  ];

  it('POSTs the payload as JSON to the write endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);

    await submitNationalReleases(payload);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE}/national-releases`);
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init?.body).toBe(JSON.stringify(payload));
  });

  it('resolves without throwing on a successful (ok) response', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 201 })));

    await expect(submitNationalReleases(payload)).resolves.toBeUndefined();
  });

  it('throws Error("THROTTLED") on a 429, ignoring any response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ message: 'slow down' }), { status: 429 }))
    );

    await expect(submitNationalReleases(payload)).rejects.toThrow('THROTTLED');
  });

  it('throws the backend message when it is a single string', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ message: 'Invalid releaseDay' }), { status: 400 }))
    );

    await expect(submitNationalReleases(payload)).rejects.toThrow('Invalid releaseDay');
  });

  it('joins the backend message with spaces when it is an array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ message: ['artistName should not be empty', 'genre is required'] }), { status: 400 })
      )
    );

    await expect(submitNationalReleases(payload)).rejects.toThrow('artistName should not be empty genre is required');
  });

  it('falls back to "HTTP <status>" when the body has no message', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({}), { status: 400 })));

    await expect(submitNationalReleases(payload)).rejects.toThrow('HTTP 400');
  });

  it('falls back to "HTTP <status>" when the error body is not valid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('not json', { status: 502 })));

    await expect(submitNationalReleases(payload)).rejects.toThrow('HTTP 502');
  });
});
