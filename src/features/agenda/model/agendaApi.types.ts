import type { CalendarEvent } from './agenda.types';

export interface AgendaMonthRequest {
  year: number;
  month: number;
}

export interface AgendaMonthResponse {
  events: CalendarEvent[];
}
