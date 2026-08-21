import { describe, expect, it } from 'vitest';

import { groupByDay } from '../utils/releaseFormat';

describe('groupByDay', () => {
  it('returns an empty array for an empty list', () => {
    expect(groupByDay([])).toEqual([]);
  });

  it('groups items by releaseDay, preserving insertion order within a group', () => {
    const items = [
      { releaseDay: '2026-01-02', id: 'a' },
      { releaseDay: '2026-01-01', id: 'b' },
      { releaseDay: '2026-01-02', id: 'c' },
    ];

    expect(groupByDay(items)).toEqual([
      { releaseDay: '2026-01-01', entries: [{ releaseDay: '2026-01-01', id: 'b' }] },
      {
        releaseDay: '2026-01-02',
        entries: [
          { releaseDay: '2026-01-02', id: 'a' },
          { releaseDay: '2026-01-02', id: 'c' },
        ],
      },
    ]);
  });

  it('sorts groups ascending by releaseDay via string comparison (localeCompare)', () => {
    const items = [
      { releaseDay: '2026-03-01' },
      { releaseDay: '2026-01-15' },
      { releaseDay: '2026-02-10' },
    ];

    expect(groupByDay(items).map(g => g.releaseDay)).toEqual([
      '2026-01-15',
      '2026-02-10',
      '2026-03-01',
    ]);
  });
});
