import type { AgendaMonthRequest } from '../model/agendaApi.types';

export type AgendaMonthRequestParseResult =
  | { ok: true; request: AgendaMonthRequest }
  | { ok: false; error: 'Invalid year' | 'Invalid month' };

export function parseAgendaMonthRequest(
  searchParams: URLSearchParams,
  today: Date
): AgendaMonthRequestParseResult {
  const year = parseYear(readSingleParameter(searchParams, 'year'), today.getFullYear());
  if (year === null) return { ok: false, error: 'Invalid year' };

  const month = parseMonth(readSingleParameter(searchParams, 'month'), today.getMonth() + 1);
  if (month === null) return { ok: false, error: 'Invalid month' };

  return { ok: true, request: { year, month } };
}

function readSingleParameter(searchParams: URLSearchParams, name: string): string | null | undefined {
  const values = searchParams.getAll(name);
  if (values.length === 0) return undefined;
  return values.length === 1 ? values[0] : null;
}

function parseYear(value: string | null | undefined, fallback: number): number | null {
  if (value === undefined) return fallback;

  const year = parseInteger(value);
  // `new Date(year, ...)` normaliza 0–99 a 1900–1999. Rechazarlos evita
  // consultar silenciosamente un año distinto del solicitado.
  return year !== null && year >= 100 ? year : null;
}

function parseMonth(value: string | null | undefined, fallback: number): number | null {
  if (value === undefined) return fallback;

  const month = parseInteger(value);
  return month !== null && month >= 1 && month <= 12 ? month : null;
}

function parseInteger(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;

  const number = Number(value);
  return Number.isFinite(number) && Number.isInteger(number) ? number : null;
}
