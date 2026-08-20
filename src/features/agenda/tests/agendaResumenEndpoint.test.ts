import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../lib/googleCalendar', () => ({
  fetchRegionEvents: vi.fn(),
}));

import { fetchRegionEvents } from '../../../lib/googleCalendar';
import { GET } from '../../../pages/api/agenda-resumen.json';
import type { CalendarEvent } from '../model/agenda.types';

function endpointContext(query: string) {
  return {
    url: new URL(`/api/agenda-resumen.json?${query}`, 'https://riffvalley.test'),
  } as Parameters<typeof GET>[0];
}

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('GET /api/agenda-resumen.json', () => {
  it('keeps the successful events response contract for valid parameters', async () => {
    const events: CalendarEvent[] = [{
      id: 'event-1',
      title: 'Concert',
      start: '2026-08-20',
      end: '2026-08-21',
      allDay: true,
      location: null,
      htmlLink: 'https://example.com/event-1',
      calendarName: 'Cantabria',
      calendarColor: '#DDCC77',
    }];
    vi.stubEnv('GOOGLE_CALENDAR_API_KEY', 'server-only-key');
    vi.mocked(fetchRegionEvents).mockResolvedValue(events);

    const response = await GET(endpointContext('year=2026&month=8'));

    await expect(response.json()).resolves.toEqual({ events });
    expect(response.status).toBe(200);
    expect(fetchRegionEvents).toHaveBeenCalledOnce();
  });

  it('rejects invalid query parameters before calling Google Calendar', async () => {
    vi.stubEnv('GOOGLE_CALENDAR_API_KEY', 'server-only-key');

    const response = await GET(endpointContext('year=2026&month=13'));

    await expect(response.json()).resolves.toEqual({ error: 'Invalid month' });
    expect(response.status).toBe(400);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(fetchRegionEvents).not.toHaveBeenCalled();
  });
});
