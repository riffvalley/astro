import { API_BASE } from '../../../lib/apiBase';
import type { NationalRelease, NationalReleaseProposal } from '../model/nationalRelease.types';

export const DATA_START_YEAR = 2025;

export async function fetchNationalReleases(month: number, year: number): Promise<NationalRelease[]> {
  const params = new URLSearchParams();
  params.set('month', String(month));
  params.set('year', String(year));
  const res = await fetch(`${API_BASE}/national-releases/public?${params.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

// Sin auth, limitado a 5 peticiones/min por IP en el backend, así que nunca
// reintenta solo. El mismo artista puede proponer varios lanzamientos a la
// vez (el backend acepta un objeto o un array de objetos), así que se envía
// siempre como array.
export async function submitNationalReleases(payload: NationalReleaseProposal[]): Promise<void> {
  const res = await fetch(`${API_BASE}/national-releases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.status === 429) throw new Error('THROTTLED');

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = Array.isArray(errJson.message) ? errJson.message.join(' ') : errJson.message || '';
    } catch {
      // sin cuerpo JSON legible — se usa el mensaje genérico en el llamador
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
}
