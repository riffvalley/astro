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

export const GET: APIRoute = async () => {
  const bySlug: Record<string, { mediaUrl: string; thumbnailUrl: string | null }> = {};

  const pending = new Map(
    Object.entries(REDACTOR_REELS)
      .map(([slug, reelUrl]) => [slug, shortcodeOf(reelUrl)] as const)
      .filter((entry): entry is [string, string] => !!entry[1])
  );

  const limit = 50;
  let offset = 0;
  let hasMore = true;
  let pages = 0;

  // Los reels que nos interesan son publicaciones recientes, así que deberían
  // salir en las primeras páginas — con 6 páginas (300 posts) de margen de
  // sobra sin tener que traer todo el histórico de la cuenta.
  while (pending.size > 0 && hasMore && pages < 6) {
    let page: InstagramApiPage;
    try {
      const res = await fetch(`${API_BASE}/instagram/posts?limit=${limit}&offset=${offset}`);
      if (!res.ok) break;
      page = await res.json();
    } catch {
      break;
    }

    for (const post of page.data) {
      for (const [slug, shortcode] of pending) {
        if (post.permalink?.includes(shortcode)) {
          bySlug[slug] = { mediaUrl: post.mediaUrl, thumbnailUrl: post.thumbnailUrl };
          pending.delete(slug);
        }
      }
    }

    hasMore = page.hasMore;
    offset += limit;
    pages++;
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
