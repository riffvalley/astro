import type { CalendarEvent } from '../model/agenda.types';
import { eventDateKey } from './eventDateKey';

export function groupEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const eventsByDay = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const key = eventDateKey(event.start);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(event);
  }

  return eventsByDay;
}
