import { describe, expect, it } from 'vitest';

import { parseAgendaMonthRequest } from '../utils/agendaMonthRequest';

const today = new Date(2026, 7, 20, 12);

function parse(query = '') {
  return parseAgendaMonthRequest(new URLSearchParams(query), today);
}

describe('parseAgendaMonthRequest', () => {
  it('uses the current year and month only when parameters are absent', () => {
    expect(parse()).toEqual({ ok: true, request: { year: 2026, month: 8 } });
    expect(parse('month=1')).toEqual({ ok: true, request: { year: 2026, month: 1 } });
    expect(parse('year=2027')).toEqual({ ok: true, request: { year: 2027, month: 8 } });
    expect(parse('year=2026&month=8')).toEqual({ ok: true, request: { year: 2026, month: 8 } });
    expect(parse('year=2026&month=1')).toEqual({ ok: true, request: { year: 2026, month: 1 } });
    expect(parse('year=2026&month=12')).toEqual({ ok: true, request: { year: 2026, month: 12 } });
  });

  it.each([
    ['month=0'],
    ['month=13'],
    ['month=-1'],
    ['month=2.5'],
    ['month=abc'],
    ['month=Infinity'],
    ['month='],
  ])('rejects an explicitly invalid month: %s', query => {
    expect(parse(query)).toEqual({ ok: false, error: 'Invalid month' });
  });

  it.each([
    ['year=0'],
    ['year=2026.5'],
    ['year=abc'],
    ['year=Infinity'],
    ['year='],
  ])('rejects an explicitly invalid year: %s', query => {
    expect(parse(query)).toEqual({ ok: false, error: 'Invalid year' });
  });

  it('rejects repeated scalar parameters as ambiguous', () => {
    expect(parse('month=8&month=9')).toEqual({ ok: false, error: 'Invalid month' });
    expect(parse('year=2026&year=2027')).toEqual({ ok: false, error: 'Invalid year' });
  });
});
