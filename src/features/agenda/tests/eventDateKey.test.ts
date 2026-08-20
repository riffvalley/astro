import { describe, expect, it } from 'vitest';

import { eventDateKey } from '../utils/eventDateKey';

describe('eventDateKey', () => {
  it('keeps all-day event dates unchanged', () => {
    expect(eventDateKey('2024-02-29')).toBe('2024-02-29');
  });

  it('uses the local calendar date for timed events', () => {
    const localEventDate = new Date(2024, 0, 1, 0, 30);

    expect(eventDateKey(localEventDate.toISOString())).toBe('2024-01-01');
  });
});
