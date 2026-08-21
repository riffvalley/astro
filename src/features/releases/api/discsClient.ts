import { API_BASE } from '../../../lib/apiBase';
import { monthBounds } from '../utils/monthBounds';
import type { DiscDateGroup, FilterOption } from '../model/disc.types';

export const DATA_START_YEAR = 2025; // enero de 2025 — no hay discos antes

export async function fetchFilterOptions(): Promise<{ genres: FilterOption[]; countries: FilterOption[] }> {
  const res = await fetch(`${API_BASE}/discs/date/public/filters`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return { genres: json.genres || [], countries: json.countries || [] };
}

export async function fetchMonth(
  year: number,
  month: number,
  genreId: string,
  countryId: string,
): Promise<DiscDateGroup[]> {
  const [start, end] = monthBounds(year, month);
  const params = new URLSearchParams();
  params.append('dateRange[]', start);
  params.append('dateRange[]', end);
  params.set('limit', '1000');
  if (genreId) params.set('genre', genreId);
  if (countryId) params.set('country', countryId);

  const res = await fetch(`${API_BASE}/discs/date/public?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data || [];
}
