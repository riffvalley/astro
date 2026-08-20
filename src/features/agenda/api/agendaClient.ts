import type { CalendarEvent, SpainMap } from '../model/agenda.types';
import type { AgendaMonthRequest, AgendaMonthResponse } from '../model/agendaApi.types';

interface AgendaMonthFetchOptions {
  signal?: AbortSignal;
}

export async function fetchAgendaMonth(
  { year, month }: AgendaMonthRequest,
  { signal }: AgendaMonthFetchOptions = {}
): Promise<CalendarEvent[]> {
  const url = `/api/agenda-resumen.json?year=${year}&month=${month}`;
  const response = signal ? await fetch(url, { signal }) : await fetch(url);
  const data = (await response.json()) as AgendaMonthResponse;
  return data.events ?? [];
}

export async function fetchAgendaMap(): Promise<SpainMap> {
  const response = await fetch('/api/spain-map.json');
  return (await response.json()) as SpainMap;
}
