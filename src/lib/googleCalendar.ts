// Lee eventos de los calendarios públicos de Google Calendar usados por la
// agenda de conciertos. Se llama en servidor (la página es SSR bajo
// demanda, ver agenda-conciertos.astro) — la API key nunca llega al
// navegador.

import type { CalendarEvent, RegionCalendar } from '../features/agenda/model/agenda.types';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars';
// Las 19 fuentes se consultan en paralelo: este límite acota la espera total
// de Agenda sin multiplicarse por el número de calendarios.
export const GOOGLE_CALENDAR_REQUEST_TIMEOUT_MS = 5_000;

export type { CalendarEvent, RegionCalendar } from '../features/agenda/model/agenda.types';

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

type CalendarFetchResult =
  | { status: 'success'; events: CalendarEvent[] }
  | { status: 'failed' };

async function fetchOneCalendar(
  calendar: RegionCalendar,
  timeMin: string,
  timeMax: string,
  apiKey: string
): Promise<CalendarFetchResult> {
  const url = new URL(`${CALENDAR_API_BASE}/${encodeURIComponent(calendar.id)}/events`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '250');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GOOGLE_CALENDAR_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    const data = (await res.json()) as GoogleEventsResponse;

    if (!res.ok || data.error) {
      console.warn(`[googleCalendar] Fallo leyendo "${calendar.name}": ${data.error?.message ?? res.statusText}`);
      return { status: 'failed' };
    }

    return {
      status: 'success',
      events: (data.items ?? []).map(item => ({
        id: item.id,
        title: item.summary ?? '(sin título)',
        start: item.start.dateTime ?? item.start.date ?? '',
        end: item.end.dateTime ?? item.end.date ?? '',
        allDay: !item.start.dateTime,
        location: item.location ?? null,
        htmlLink: item.htmlLink,
        calendarName: calendar.name,
        calendarColor: calendar.color,
      })),
    };
  } catch (error) {
    const reason = controller.signal.aborted
      ? `timeout tras ${GOOGLE_CALENDAR_REQUEST_TIMEOUT_MS} ms`
      : error instanceof Error ? error.message : 'error desconocido';
    console.warn(`[googleCalendar] Fallo leyendo "${calendar.name}": ${reason}`);
    return { status: 'failed' };
  } finally {
    clearTimeout(timeout);
  }
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
    calendars.map(cal => fetchOneCalendar(
      cal,
      timeMin.toISOString(),
      timeMax.toISOString(),
      apiKey
    ))
  );
  const successfulResults = results.filter(
    (result): result is Extract<CalendarFetchResult, { status: 'success' }> => result.status === 'success'
  );

  // Una respuesta válida sin eventos cuenta como éxito. Si ninguna fuente
  // respondió correctamente, no presentamos un vacío como si fuese válido.
  if (calendars.length > 0 && successfulResults.length === 0) {
    throw new Error('No se pudo obtener ningún calendario de Agenda');
  }

  return successfulResults.flatMap(result => result.events).sort((a, b) => a.start.localeCompare(b.start));
}
