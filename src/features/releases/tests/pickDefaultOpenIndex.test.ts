import { describe, expect, it } from 'vitest';

import { pickDefaultOpenIndex } from '../utils/pickDefaultOpenIndex';

// "Hoy" fijo para no depender de la fecha real del sistema. 2026-08-15 es un
// sábado dentro de agosto; viewYear/viewMonth "coincide con hoy" cuando
// valen 2026/7 (mes 0-indexado, igual que Date#getMonth()).
const TODAY = new Date(2026, 7, 15);
const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 7; // agosto, 0-indexado, igual que TODAY.getMonth()

function group(releaseDate: string) {
  return { releaseDate, discs: [] };
}

describe('pickDefaultOpenIndex', () => {
  it('returns -1 whenever the load is not the initial one, regardless of month/list', () => {
    const groups = [group('2026-08-15'), group('2026-08-20')];
    expect(pickDefaultOpenIndex(groups, false, CURRENT_YEAR, CURRENT_MONTH, TODAY)).toBe(-1);
    expect(pickDefaultOpenIndex([], false, CURRENT_YEAR, CURRENT_MONTH, TODAY)).toBe(-1);
  });

  it('returns 0 on initial load when the viewed month/year is not the current one', () => {
    const groups = [group('2026-09-01'), group('2026-09-15')];
    expect(pickDefaultOpenIndex(groups, true, 2026, 8, TODAY)).toBe(0); // septiembre ≠ agosto
    expect(pickDefaultOpenIndex(groups, true, 2027, CURRENT_MONTH, TODAY)).toBe(0); // 2027 ≠ 2026
  });

  it('returns 0 on initial load for a different month even with an empty group list', () => {
    expect(pickDefaultOpenIndex([], true, 2026, 8, TODAY)).toBe(0);
  });

  it('picks the group whose releaseDate exactly matches today, viewing the current month', () => {
    const groups = [group('2026-08-10'), group('2026-08-20'), group('2026-08-15')];
    expect(pickDefaultOpenIndex(groups, true, CURRENT_YEAR, CURRENT_MONTH, TODAY)).toBe(2);
  });

  it('picks the closest group by absolute date distance when there is no exact match', () => {
    // 2026-08-13 está a 2 días de hoy, 2026-08-19 está a 4 días — gana el más cercano.
    const groups = [group('2026-08-01'), group('2026-08-13'), group('2026-08-19')];
    expect(pickDefaultOpenIndex(groups, true, CURRENT_YEAR, CURRENT_MONTH, TODAY)).toBe(1);
  });

  it('breaks distance ties in favor of the earliest index (strict less-than comparison)', () => {
    // 2026-08-13 y 2026-08-17 están ambos a 2 días de hoy (2026-08-15).
    const groups = [group('2026-08-13'), group('2026-08-17')];
    expect(pickDefaultOpenIndex(groups, true, CURRENT_YEAR, CURRENT_MONTH, TODAY)).toBe(0);
  });

  it('returns 0 for an empty group list even when viewing the current month (existing edge case, not "fixed")', () => {
    expect(pickDefaultOpenIndex([], true, CURRENT_YEAR, CURRENT_MONTH, TODAY)).toBe(0);
  });
});
