import { describe, expect, it } from 'vitest';

import { formatDateLong } from '../utils/formatDateLong';

describe('formatDateLong', () => {
  it('formats an ISO date as "<Weekday>, <day> de <month>" in es-ES, capitalizing only the weekday', () => {
    expect(formatDateLong('2026-01-01')).toBe('Jueves, 1 de enero');
    expect(formatDateLong('2026-03-08')).toBe('Domingo, 8 de marzo');
    expect(formatDateLong('2026-12-25')).toBe('Viernes, 25 de diciembre');
  });

  it('handles a leap-year February date', () => {
    expect(formatDateLong('2024-02-29')).toBe('Jueves, 29 de febrero');
  });
});
