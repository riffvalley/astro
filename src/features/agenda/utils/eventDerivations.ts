import type { CalendarEvent, RegionCalendar } from '../model/agenda.types';

export type CalendarEventGroup = {
  calendarName: string;
  events: CalendarEvent[];
};

export function filterEventsByCalendarNames(
  events: CalendarEvent[],
  selectedCalendarNames: ReadonlySet<string>
): CalendarEvent[] {
  return events.filter(event => selectedCalendarNames.has(event.calendarName));
}

export function countEventsByCalendarName(events: CalendarEvent[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const event of events) {
    counts.set(event.calendarName, (counts.get(event.calendarName) ?? 0) + 1);
  }

  return counts;
}

export function groupEventsByCalendar(
  events: CalendarEvent[],
  calendars: RegionCalendar[]
): CalendarEventGroup[] {
  const eventsByCalendar = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    if (!eventsByCalendar.has(event.calendarName)) eventsByCalendar.set(event.calendarName, []);
    eventsByCalendar.get(event.calendarName)!.push(event);
  }

  return calendars
    .filter(calendar => eventsByCalendar.has(calendar.name))
    .map(calendar => ({ calendarName: calendar.name, events: eventsByCalendar.get(calendar.name)! }));
}
