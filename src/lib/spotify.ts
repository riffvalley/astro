import { API_BASE } from './apiBase';

export const SPOTIFY_ICON_PATH =
  'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.161-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.322-1.32 9.721-.66 13.441 1.62.361.181.54.78.3 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z';

export interface RandomPlaylist {
  id: string;
  name: string;
  status: string;
  link: string;
  type: 'genero' | 'especial' | 'otras';
  updateDate: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchRandomPlaylist(): Promise<RandomPlaylist> {
  const res = await fetch(`${API_BASE}/spotify/genres/random`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// El link real es del tipo "https://open.spotify.com/playlist/<id>?si=..." —
// el embed reproducible en la web solo necesita el <id> en su propia URL.
export function spotifyEmbedUrl(playlistLink: string): string | null {
  const id = playlistLink.match(/\/playlist\/([a-zA-Z0-9]+)/)?.[1];
  return id ? `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0` : null;
}

// Sin un campo de URL de Spotify en la API, se enlaza a una búsqueda por
// artista + título — no es un enlace directo verificado al disco exacto,
// pero es honesto (no inventa una URL que no existe) y funciona siempre.
export function spotifySearchUrl(artistName: string | undefined, discName: string): string {
  const q = `${artistName || ''} ${discName}`.trim();
  return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
}
