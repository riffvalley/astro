import { describe, expect, it } from 'vitest';

import type { CalendarEvent, RegionCalendar } from '../model/agenda.types';
import {
  countEventsByCalendarName,
  filterEventsByCalendarNames,
  groupEventsByCalendar,
} from '../utils/eventDerivations';

function createEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'event-1',
    title: 'Concert',
    start: '2024-05-01',
    end: '2024-05-01',
    allDay: true,
    location: null,
    htmlLink: 'https://example.com/event-1',
    calendarName: 'Cantabria',
    calendarColor: '#DDCC77',
    ...overrides,
  };
}

const calendars: RegionCalendar[] = [
  { name: 'Asturias', id: 'asturias', color: '#88CCEE' },
  { name: 'Cantabria', id: 'cantabria', color: '#DDCC77' },
  { name: 'Galicia', id: 'galicia', color: '#CCBB44' },
];

describe('filterEventsByCalendarNames', () => {
  it('keeps the original event order for selected calendars', () => {
    const first = createEvent({ id: 'first', calendarName: 'Cantabria' });
    const hidden = createEvent({ id: 'hidden', calendarName: 'Asturias' });
    const last = createEvent({ id: 'last', calendarName: 'Cantabria' });

    expect(filterEventsByCalendarNames([first, hidden, last], new Set(['Cantabria']))).toEqual([first, last]);
  });

  it('returns all events when every calendar represented by the events is selected', () => {
    const cantabria = createEvent({ id: 'cantabria', calendarName: 'Cantabria' });
    const asturias = createEvent({ id: 'asturias', calendarName: 'Asturias' });

    expect(filterEventsByCalendarNames([cantabria, asturias], new Set(['Cantabria', 'Asturias']))).toEqual([
      cantabria,
      asturias,
    ]);
  });

  it('returns an empty list for no selection or no events', () => {
    const event = createEvent({ id: 'cantabria' });

    expect(filterEventsByCalendarNames([event], new Set())).toEqual([]);
    expect(filterEventsByCalendarNames([], new Set(['Cantabria']))).toEqual([]);
  });
});

describe('countEventsByCalendarName', () => {
  it('counts events by calendar and keeps an empty input empty', () => {
    const cantabriaFirst = createEvent({ id: 'cantabria-first', calendarName: 'Cantabria' });
    const asturias = createEvent({ id: 'asturias', calendarName: 'Asturias' });
    const cantabriaLast = createEvent({ id: 'cantabria-last', calendarName: 'Cantabria' });

    expect(countEventsByCalendarName([])).toEqual(new Map());
    expect(countEventsByCalendarName([cantabriaFirst, asturias, cantabriaLast])).toEqual(
      new Map([
        ['Cantabria', 2],
        ['Asturias', 1],
      ])
    );
  });
});

describe('groupEventsByCalendar', () => {
  it('follows calendar order, excludes empty calendars, and preserves event order', () => {
    const cantabriaFirst = createEvent({ id: 'cantabria-first', calendarName: 'Cantabria' });
    const asturias = createEvent({ id: 'asturias', calendarName: 'Asturias' });
    const cantabriaLast = createEvent({ id: 'cantabria-last', calendarName: 'Cantabria' });

    expect(groupEventsByCalendar([cantabriaFirst, asturias, cantabriaLast], calendars)).toEqual([
      { calendarName: 'Asturias', events: [asturias] },
      { calendarName: 'Cantabria', events: [cantabriaFirst, cantabriaLast] },
    ]);
  });

  it('returns no groups for an empty event list', () => {
    expect(groupEventsByCalendar([], calendars)).toEqual([]);
  });
});
