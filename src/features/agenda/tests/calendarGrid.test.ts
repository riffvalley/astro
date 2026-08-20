import { describe, expect, it } from 'vitest';

import { buildCalendarGrid } from '../utils/calendarGrid';

describe('buildCalendarGrid', () => {
  it('builds six Monday-first weeks with the adjacent days needed to complete the grid', () => {
    const grid = buildCalendarGrid(2024, 5, '2024-05-15');
    const days = grid.flat();

    expect(grid).toHaveLength(6);
    expect(grid.every(week => week.length === 7)).toBe(true);
    expect(days).toHaveLength(42);
    expect(days.slice(0, 3)).toMatchObject([
      { key: '2024-04-29', day: 29, inMonth: false },
      { key: '2024-04-30', day: 30, inMonth: false },
      { key: '2024-05-01', day: 1, inMonth: true },
    ]);
    expect(days.at(-1)).toMatchObject({ key: '2024-06-09', day: 9, inMonth: false });
  });

  it('continues across December and includes the previous December for January', () => {
    const december = buildCalendarGrid(2024, 12, '2024-12-15').flat();
    const january = buildCalendarGrid(2025, 1, '2025-01-15').flat();

    expect(december[0]).toMatchObject({ key: '2024-11-25', inMonth: false });
    expect(december.at(-1)).toMatchObject({ key: '2025-01-05', inMonth: false });
    expect(january[0]).toMatchObject({ key: '2024-12-30', inMonth: false });
    expect(january.at(-1)).toMatchObject({ key: '2025-02-09', inMonth: false });
  });

  it('handles regular and leap February month boundaries', () => {
    const regularFebruary = buildCalendarGrid(2023, 2, '2023-02-14').flat();
    const leapFebruary = buildCalendarGrid(2024, 2, '2024-02-29').flat();

    expect(regularFebruary.find(day => day.key === '2023-02-28')).toMatchObject({ day: 28, inMonth: true });
    expect(regularFebruary.some(day => day.key === '2023-02-29')).toBe(false);
    expect(leapFebruary.find(day => day.key === '2024-02-29')).toMatchObject({ day: 29, inMonth: true, isToday: true });
  });

  it('marks only the supplied local date key as today', () => {
    const days = buildCalendarGrid(2024, 2, '2024-02-29').flat();

    expect(days.filter(day => day.isToday)).toEqual([
      expect.objectContaining({ key: '2024-02-29', isToday: true }),
    ]);
  });
});
