import type { Category, PostDetail } from '../../lib/wordpress';
import { extractHighlightedBands, extractReviewScore } from '../../lib/editorialParsing';

export interface HomeCategoryRail {
  name: string;
  href: string;
  posts: PostDetail[];
}

export interface HomeReviewItem {
  post: PostDetail;
  score: number | null;
}

export interface HomeReviewsRail {
  href: string;
  items: HomeReviewItem[];
}

export interface HomeMonthlyAlbums {
  post: PostDetail;
  bands: string[];
  href: string;
}

export interface HomeEditorialContent {
  gridPosts: PostDetail[];
  cronicas?: HomeCategoryRail;
  reviews?: HomeReviewsRail;
  articulos?: HomeCategoryRail;
  entrevistas?: HomeCategoryRail;
  novedades?: HomeCategoryRail;
  monthlyAlbums?: HomeMonthlyAlbums;
}

// Selección editorial de la home: qué posts entran, en qué sección y en qué
// orden. Recibe los datos ya obtenidos (la página sigue siendo quien hace el
// fetch) y no conoce ni componentes ni marcado.
export function buildHomeEditorialContent(posts: PostDetail[], categories: Category[]): HomeEditorialContent {
  const gridPosts = posts.slice(0, 6);

  const usedIds = new Set(gridPosts.map(p => p.id));

  function findTopCategory(path: string) {
    return categories.find(c => c.uri.replace(/\/+$/, '') === path);
  }

  // El post de "Mejores discos del mes" también está tagueado bajo /articulos,
  // así que se reserva su id ANTES de armar el riel de Artículos para que no
  // aparezca duplicado ahí y en su propia sección destacada.
  const discosDelMesCategory = findTopCategory('/articulos/mejores-discos/discos-del-mes');
  const discosDelMesPost = discosDelMesCategory
    ? posts
        .filter(p => p.categories.some(c => c.uri === discosDelMesCategory.uri))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : undefined;
  if (discosDelMesPost) usedIds.add(discosDelMesPost.id);
  const discosDelMesBands = discosDelMesPost ? extractHighlightedBands(discosDelMesPost.content) : [];

  // Cada riel debe aportar contenido que no se haya visto ya arriba en la
  // página — se van marcando los posts usados a medida que se arma cada
  // riel, en el mismo orden en que aparecen dentro de la tarjeta "Actualidad".
  function railPosts(category: Category | undefined, limit = 4) {
    if (!category) return [];
    const fresh = posts.filter(p => p.categories.some(c => c.uri === category.uri) && !usedIds.has(p.id)).slice(0, limit);
    fresh.forEach(p => usedIds.add(p.id));
    return fresh;
  }

  // "Actualidad" agrupa un orden fijo de secciones (no las N categorías con
  // más posts, como antes) — Crónicas, Reviews, Artículos, Entrevistas y
  // Novedades, en ese orden. El nº de tarjetas de cada una varía a propósito
  // (3 / 2 / 4 / 1 / 4) para que la tarjeta no se lea como la misma
  // cuadrícula de 4 repetida cinco veces.
  const cronicasCategory = findTopCategory('/cronicas');
  const cronicasPosts = railPosts(cronicasCategory, 3);

  const reviewsCategory = categories.find(c => c.uri.includes('review-de-discos'));
  const reviewItems = reviewsCategory
    ? posts
        .filter(p => p.categories.some(c => c.uri === reviewsCategory.uri) && !usedIds.has(p.id))
        .slice(0, 2)
        .map(post => ({ post, score: extractReviewScore(post.content) }))
    : [];
  reviewItems.forEach(({ post }) => usedIds.add(post.id));

  const articulosCategory = findTopCategory('/articulos');
  const articulosPosts = railPosts(articulosCategory, 4);

  // Entrevistas va destacada a 2 columnas, no como grid de 4.
  const entrevistasCategory = findTopCategory('/entrevistas');
  const entrevistasPosts = railPosts(entrevistasCategory, 2);

  const novedadesCategory = findTopCategory('/novedades');
  const novedadesPosts = railPosts(novedadesCategory, 4);

  return {
    gridPosts,
    cronicas: cronicasCategory && { name: cronicasCategory.name, href: cronicasCategory.uri, posts: cronicasPosts },
    reviews: reviewsCategory && { href: reviewsCategory.uri, items: reviewItems },
    articulos: articulosCategory && { name: articulosCategory.name, href: articulosCategory.uri, posts: articulosPosts },
    entrevistas: entrevistasCategory && {
      name: entrevistasCategory.name,
      href: entrevistasCategory.uri,
      posts: entrevistasPosts,
    },
    novedades: novedadesCategory && { name: novedadesCategory.name, href: novedadesCategory.uri, posts: novedadesPosts },
    monthlyAlbums: discosDelMesPost &&
      discosDelMesCategory && { post: discosDelMesPost, bands: discosDelMesBands, href: discosDelMesCategory.uri },
  };
}
