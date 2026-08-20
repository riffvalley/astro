import type { CalendarEvent, SpainMap } from '../model/agenda.types';
import type { AgendaMonthRequest, AgendaMonthResponse } from '../model/agendaApi.types';

export async function fetchAgendaMonth({ year, month }: AgendaMonthRequest): Promise<CalendarEvent[]> {
  const response = await fetch(`/api/agenda-resumen.json?year=${year}&month=${month}`);
  const data = (await response.json()) as AgendaMonthResponse;
  return data.events ?? [];
}

export async function fetchAgendaMap(): Promise<SpainMap> {
  const response = await fetch('/api/spain-map.json');
  return (await response.json()) as SpainMap;
}
