import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RegionCalendar } from '../model/agenda.types';
import {
  fetchRegionEvents,
  GOOGLE_CALENDAR_REQUEST_TIMEOUT_MS,
} from '../../../lib/googleCalendar';

const timeMin = new Date('2026-08-01T00:00:00.000Z');
const timeMax = new Date('2026-09-01T00:00:00.000Z');

const calendars: RegionCalendar[] = [
  { name: 'Cantabria', id: 'cantabria', color: '#DDCC77' },
  { name: 'Asturias', id: 'asturias', color: '#88CCEE' },
  { name: 'Galicia', id: 'galicia', color: '#CCBB44' },
];

function calendarId(input: string | URL | Request): string {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  return decodeURIComponent(url.pathname.split('/').at(-2) ?? '');
}

function eventsResponse(id: string, start: string): Response {
  return new Response(JSON.stringify({
    items: [{
      id,
      summary: id,
      htmlLink: `https://example.com/${id}`,
      start: { dateTime: start },
      end: { dateTime: start },
    }],
  }));
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchRegionEvents', () => {
  it('combines successful calendars and preserves global start ordering', async () => {
    const starts: Record<string, string> = {
      cantabria: '2026-08-20T20:00:00+02:00',
      asturias: '2026-08-10T20:00:00+02:00',
      galicia: '2026-08-15T20:00:00+02:00',
    };
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async input => {
      const id = calendarId(input);
      return eventsResponse(id, starts[id]);
    }));

    const events = await fetchRegionEvents(calendars, timeMin, timeMax, 'server-only-key');

    expect(events.map(({ id }) => id)).toEqual(['asturias', 'galicia', 'cantabria']);
  });

  it('normalizes valid all-day and timed events and preserves optional fallbacks', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [
        {
          id: 'all-day',
          htmlLink: 'https://example.com/all-day',
          start: { date: '2026-08-20' },
          end: { date: '2026-08-21' },
        },
        {
          id: 'timed',
          summary: 'Timed concert',
          location: 'Venue',
          htmlLink: 'https://example.com/timed',
          start: { dateTime: '2026-08-20T20:00:00+02:00' },
          end: { dateTime: '2026-08-20T22:00:00+02:00' },
        },
      ],
    })));

    const events = await fetchRegionEvents([calendars[0]], timeMin, timeMax, 'server-only-key');

    expect(events).toEqual([
      {
        id: 'all-day',
        title: '(sin título)',
        start: '2026-08-20',
        end: '2026-08-21',
        allDay: true,
        location: null,
        htmlLink: 'https://example.com/all-day',
        calendarName: 'Cantabria',
        calendarColor: '#DDCC77',
      },
      {
        id: 'timed',
        title: 'Timed concert',
        start: '2026-08-20T20:00:00+02:00',
        end: '2026-08-20T22:00:00+02:00',
        allDay: false,
        location: 'Venue',
        htmlLink: 'https://example.com/timed',
        calendarName: 'Cantabria',
        calendarColor: '#DDCC77',
      },
    ]);
  });

  it.each([
    ['null', null],
    ['string', 'unexpected'],
    ['object without items', {}],
    ['non-array items', { items: 'unexpected' }],
  ])('rejects a malformed response root: %s', async (_case, payload) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(payload)));

    await expect(fetchRegionEvents([calendars[0]], timeMin, timeMax, 'server-only-key'))
      .rejects.toThrow('No se pudo obtener ningún calendario de Agenda');
    expect(console.warn).toHaveBeenCalledWith(
      '[googleCalendar] Fallo leyendo "Cantabria": respuesta malformada'
    );
  });

  it('keeps valid calendars when another source returns a malformed response', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async input => {
      const id = calendarId(input);
      if (id === 'asturias') return jsonResponse({ items: 'unexpected' });
      return eventsResponse(id, id === 'cantabria'
        ? '2026-08-20T20:00:00+02:00'
        : '2026-08-15T20:00:00+02:00');
    }));

    const events = await fetchRegionEvents(calendars, timeMin, timeMax, 'server-only-key');

    expect(events.map(({ id }) => id)).toEqual(['galicia', 'cantabria']);
    expect(console.warn).toHaveBeenCalledWith(
      '[googleCalendar] Fallo leyendo "Asturias": respuesta malformada'
    );
  });

  it('rejects the complete source when one event is malformed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async input => {
      const id = calendarId(input);
      if (id === 'cantabria') {
        return jsonResponse({
          items: [
            {
              id: 'valid-but-same-source',
              htmlLink: 'https://example.com/valid-but-same-source',
              start: { date: '2026-08-20' },
              end: { date: '2026-08-21' },
            },
            {
              id: 'missing-link',
              start: { date: '2026-08-22' },
              end: { date: '2026-08-23' },
            },
          ],
        });
      }
      return eventsResponse(id, '2026-08-15T20:00:00+02:00');
    }));

    const events = await fetchRegionEvents(calendars.slice(0, 2), timeMin, timeMax, 'server-only-key');

    expect(events.map(({ id }) => id)).toEqual(['asturias']);
    expect(console.warn).toHaveBeenCalledWith(
      '[googleCalendar] Fallo leyendo "Cantabria": respuesta malformada'
    );
  });

  it('preserves total failure when every source fails or is malformed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async input => {
      const id = calendarId(input);
      if (id === 'cantabria') return jsonResponse({});
      if (id === 'asturias') throw new TypeError('network failure');
      return jsonResponse({ items: [{ id: 'missing-required-fields' }] });
    }));

    await expect(fetchRegionEvents(calendars, timeMin, timeMax, 'server-only-key'))
      .rejects.toThrow('No se pudo obtener ningún calendario de Agenda');
    expect(console.warn).toHaveBeenCalledTimes(calendars.length);
  });

  it('keeps successful calendars when an independent source fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async input => {
      const id = calendarId(input);
      if (id === 'asturias') throw new TypeError('network failure');
      return eventsResponse(id, id === 'cantabria'
        ? '2026-08-20T20:00:00+02:00'
        : '2026-08-15T20:00:00+02:00');
    }));

    const events = await fetchRegionEvents(calendars, timeMin, timeMax, 'server-only-key');

    expect(events.map(({ id }) => id)).toEqual(['galicia', 'cantabria']);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('times out one slow calendar without blocking successful sources', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const abortedCalendars: string[] = [];
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation((input, init) => {
      const id = calendarId(input);
      if (id !== 'asturias') {
        return Promise.resolve(eventsResponse(id, id === 'cantabria'
          ? '2026-08-20T20:00:00+02:00'
          : '2026-08-15T20:00:00+02:00'));
      }

      const signal = init?.signal;
      if (!signal) return Promise.reject(new Error('missing AbortSignal'));

      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          abortedCalendars.push(id);
          reject(signal.reason);
        }, { once: true });
      });
    }));

    const result = fetchRegionEvents(
      calendars,
      timeMin,
      timeMax,
      'server-only-key'
    );

    await vi.advanceTimersByTimeAsync(GOOGLE_CALENDAR_REQUEST_TIMEOUT_MS);

    await expect(result).resolves.toMatchObject([
      { id: 'galicia' },
      { id: 'cantabria' },
    ]);
    expect(abortedCalendars).toEqual(['asturias']);
    expect(console.warn).toHaveBeenCalledWith(
      `[googleCalendar] Fallo leyendo "Asturias": timeout tras ${GOOGLE_CALENDAR_REQUEST_TIMEOUT_MS} ms`
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects when every configured calendar fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('network failure')));

    await expect(fetchRegionEvents(calendars, timeMin, timeMax, 'server-only-key'))
      .rejects.toThrow('No se pudo obtener ningún calendario de Agenda');
    expect(console.warn).toHaveBeenCalledTimes(calendars.length);
  });

  it('treats valid empty responses as successful calendars', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockImplementation(async () =>
      new Response(JSON.stringify({ items: [] }))
    ));

    await expect(fetchRegionEvents(calendars, timeMin, timeMax, 'server-only-key'))
      .resolves.toEqual([]);
  });
});
