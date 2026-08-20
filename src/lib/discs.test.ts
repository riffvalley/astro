import { describe, expect, it } from 'vitest';

import { monthBounds } from './discs';

describe('monthBounds', () => {
  it('returns inclusive bounds for leap February and a year boundary', () => {
    expect(monthBounds(2024, 1)).toEqual(['2024-02-01', '2024-02-29']);
    expect(monthBounds(2025, 11)).toEqual(['2025-12-01', '2025-12-31']);
  });
});
