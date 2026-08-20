import { describe, expect, it } from 'vitest';

import type { CalendarEvent } from '../model/agenda.types';
import { groupEventsByDay } from '../utils/eventGrouping';

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

describe('groupEventsByDay', () => {
  it('returns an empty map for an empty event list', () => {
    expect(groupEventsByDay([])).toEqual(new Map());
  });

  it('groups all-day and timed events using their existing date-key semantics', () => {
    const timedDate = new Date(2024, 4, 1, 20, 30);
    const allDay = createEvent({ id: 'all-day', start: '2024-05-01' });
    const timed = createEvent({ id: 'timed', start: timedDate.toISOString(), allDay: false });
    const otherDay = createEvent({ id: 'other-day', start: '2024-05-02' });

    const grouped = groupEventsByDay([allDay, timed, otherDay]);

    expect([...grouped.keys()]).toEqual(['2024-05-01', '2024-05-02']);
    expect(grouped.get('2024-05-01')).toEqual([allDay, timed]);
    expect(grouped.get('2024-05-02')).toEqual([otherDay]);
  });

  it('preserves the original event order within each day', () => {
    const first = createEvent({ id: 'first', start: '2024-05-01' });
    const otherDay = createEvent({ id: 'other-day', start: '2024-05-02' });
    const last = createEvent({ id: 'last', start: '2024-05-01' });

    expect(groupEventsByDay([first, otherDay, last]).get('2024-05-01')).toEqual([first, last]);
  });
});
