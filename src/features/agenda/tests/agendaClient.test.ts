import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CalendarEvent, SpainMap } from '../model/agenda.types';
import { fetchAgendaMap, fetchAgendaMonth } from '../api/agendaClient';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAgendaMonth', () => {
  it('requests the current endpoint with year and month and returns its events', async () => {
    const events: CalendarEvent[] = [
      {
        id: 'event-1',
        title: 'Concert',
        start: '2026-08-20',
        end: '2026-08-21',
        allDay: true,
        location: null,
        htmlLink: 'https://example.com/event-1',
        calendarName: 'Cantabria',
        calendarColor: '#DDCC77',
      },
    ];
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ events }), {
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAgendaMonth({ year: 2026, month: 8 })).resolves.toEqual(events);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/agenda-resumen.json?year=2026&month=8');
  });

  it('keeps the current empty fallback when the response has no events', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(new Response('{}')));

    await expect(fetchAgendaMonth({ year: 2026, month: 8 })).resolves.toEqual([]);
  });

  it('leaves request errors for the Vue coordinator to handle', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('network failure')));

    await expect(fetchAgendaMonth({ year: 2026, month: 8 })).rejects.toThrow('network failure');
  });
});

describe('fetchAgendaMap', () => {
  it('requests the existing map endpoint and returns its payload', async () => {
    const map: SpainMap = {
      width: 613,
      height: 544,
      shapes: [],
      compositionBorder: '',
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(map)));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAgendaMap()).resolves.toEqual(map);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('/api/spain-map.json');
  });

  it('leaves map request errors for the Vue coordinator to ignore as before', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('network failure')));

    await expect(fetchAgendaMap()).rejects.toThrow('network failure');
  });
});
