// Endpoint SSR bajo demanda (no prerenderizado): resuelve el mediaUrl real
// de cada reel de "Redactores" contra la API de Instagram del backend
// propio. No se puede prerenderizar — el CDN de Instagram firma esas URLs
// con un token que caduca (horas/días), así que hay que pedirlas frescas en
// cada visita en vez de guardarlas en el build estático.
export const prerender = false;

import type { APIRoute } from 'astro';
import { API_BASE } from '../../lib/apiBase';
import { REDACTOR_REELS } from '../../lib/wordpress';

interface InstagramApiPost {
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
}

interface InstagramApiPage {
  data: InstagramApiPost[];
  hasMore: boolean;
}

function shortcodeOf(reelUrl: string): string | null {
  return reelUrl.match(/\/reels?\/([^/]+)\/?/)?.[1] ?? null;
}

const LIMIT = 50;
// Los reels van quedando más atrás en el feed con el tiempo (ya se ha visto
// que a los pocos días de publicados superan las primeras 50-300
// publicaciones) — se lanzan en paralelo hasta esta profundidad en vez de
// paginar secuencialmente, para no acumular la latencia de ~20 peticiones
// seguidas en cada visita a la home.
const MAX_PAGES = 20; // hasta 1000 posts de profundidad

async function fetchPage(offset: number): Promise<InstagramApiPost[]> {
  try {
    const res = await fetch(`${API_BASE}/instagram/posts?limit=${LIMIT}&offset=${offset}`);
    if (!res.ok) return [];
    const page: InstagramApiPage = await res.json();
    return page.data;
  } catch {
    return [];
  }
}

export const GET: APIRoute = async () => {
  const bySlug: Record<string, { mediaUrl: string; thumbnailUrl: string | null }> = {};

  const targets = Object.entries(REDACTOR_REELS)
    .map(([slug, reelUrl]) => [slug, shortcodeOf(reelUrl)] as const)
    .filter((entry): entry is [string, string] => !!entry[1]);

  const offsets = Array.from({ length: MAX_PAGES }, (_, i) => i * LIMIT);
  const pages = await Promise.all(offsets.map(fetchPage));

  for (const post of pages.flat()) {
    for (const [slug, shortcode] of targets) {
      if (bySlug[slug]) continue;
      if (post.permalink?.includes(shortcode)) {
        bySlug[slug] = { mediaUrl: post.mediaUrl, thumbnailUrl: post.thumbnailUrl };
      }
    }
  }

  return new Response(JSON.stringify(bySlug), {
    headers: {
      'content-type': 'application/json',
      // Corta vida: el mediaUrl es una URL firmada de Instagram con caducidad
      // propia, así que no interesa cachearla mucho tiempo.
      'cache-control': 'public, max-age=1800, s-maxage=1800',
    },
  });
};
