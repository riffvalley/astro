// Lee eventos de los calendarios públicos de Google Calendar usados por la
// agenda de conciertos. Se llama en servidor (la página es SSR bajo
// demanda, ver agenda-conciertos.astro) — la API key nunca llega al
// navegador.

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars';

export interface RegionCalendar {
  name: string;
  id: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date o date-time
  end: string;
  allDay: boolean;
  location: string | null;
  htmlLink: string;
  calendarName: string;
  calendarColor: string;
}

interface GoogleEventsResponse {
  items?: {
    id: string;
    summary?: string;
    location?: string;
    htmlLink: string;
    start: { date?: string; dateTime?: string };
    end: { date?: string; dateTime?: string };
  }[];
  error?: { message: string };
}

async function fetchOneCalendar(
  calendar: RegionCalendar,
  timeMin: string,
  timeMax: string,
  apiKey: string
): Promise<CalendarEvent[]> {
  const url = new URL(`${CALENDAR_API_BASE}/${encodeURIComponent(calendar.id)}/events`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '250');

  const res = await fetch(url);
  const data = (await res.json()) as GoogleEventsResponse;

  if (!res.ok || data.error) {
    console.warn(`[googleCalendar] Fallo leyendo "${calendar.name}": ${data.error?.message ?? res.statusText}`);
    return [];
  }

  return (data.items ?? []).map(item => ({
    id: item.id,
    title: item.summary ?? '(sin título)',
    start: item.start.dateTime ?? item.start.date ?? '',
    end: item.end.dateTime ?? item.end.date ?? '',
    allDay: !item.start.dateTime,
    location: item.location ?? null,
    htmlLink: item.htmlLink,
    calendarName: calendar.name,
    calendarColor: calendar.color,
  }));
}

// Trae los eventos de todos los calendarios en paralelo para un rango de
// fechas (normalmente un mes, con margen para completar semanas del grid).
export async function fetchRegionEvents(
  calendars: RegionCalendar[],
  timeMin: Date,
  timeMax: Date,
  apiKey: string
): Promise<CalendarEvent[]> {
  const results = await Promise.all(
    calendars.map(cal => fetchOneCalendar(cal, timeMin.toISOString(), timeMax.toISOString(), apiKey))
  );
  return results.flat().sort((a, b) => a.start.localeCompare(b.start));
}
