import { API_BASE } from './apiBase';

export const DATA_START_YEAR = 2025; // enero de 2025 — no hay discos antes

export interface DiscGenre {
  id: string;
  name: string;
  color?: string;
}

export interface DiscCountry {
  id: string;
  name: string;
}

export interface DiscArtist {
  name?: string;
  country?: DiscCountry;
}

export interface Disc {
  id: string;
  name: string;
  image?: string;
  link?: string;
  debut?: boolean;
  ep?: boolean;
  releaseDate: string;
  artist?: DiscArtist;
  genre?: DiscGenre;
}

export interface DiscDateGroup {
  releaseDate: string;
  discs: Disc[];
}

export interface FilterOption {
  id: string;
  name: string;
}

export async function fetchFilterOptions(): Promise<{ genres: FilterOption[]; countries: FilterOption[] }> {
  const res = await fetch(`${API_BASE}/discs/date/public/filters`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return { genres: json.genres || [], countries: json.countries || [] };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function monthBounds(year: number, month: number): [string, string] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return [ymd(first), ymd(last)];
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
