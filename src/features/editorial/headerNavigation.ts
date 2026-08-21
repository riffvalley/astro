import type { PostDetail } from '../../lib/wordpress';
import { extractReviewScore } from '../../lib/editorialParsing';

const PREVIEW_COUNT = 3;

interface HeaderNavigationLink {
  label: string;
  href: string;
}

export interface HeaderNavigationPreview {
  href: string;
  title: string;
  imageUrl: string | null;
  score: number | null;
}

interface HeaderNavigationChild extends HeaderNavigationLink {
  previewPosts: HeaderNavigationPreview[];
}

export interface HeaderNavigationItem extends HeaderNavigationLink {
  children?: HeaderNavigationChild[];
  previewPosts?: HeaderNavigationPreview[];
}

function previewPostsFor(posts: PostDetail[], categoryHref: string): HeaderNavigationPreview[] {
  return posts
    .filter(post => post.categories.some(category => category.uri === categoryHref))
    .slice(0, PREVIEW_COUNT)
    .map(post => ({
      href: post.uri,
      title: post.title,
      imageUrl: post.featuredImage?.node.sourceUrl ?? null,
      score: extractReviewScore(post.content),
    }));
}

function withPreviews(posts: PostDetail[], children: HeaderNavigationLink[]): HeaderNavigationChild[] {
  return children.map(child => ({
    ...child,
    previewPosts: previewPostsFor(posts, child.href),
  }));
}

export function buildHeaderNavigation(posts: PostDetail[]): HeaderNavigationItem[] {
  return [
    {
      label: 'Artículos',
      href: '/articulos',
      children: withPreviews(posts, [
        { label: 'Análisis de festivales', href: '/articulos/analisis' },
        { label: 'Artículos generales', href: '/articulos/articulos-generales' },
        { label: 'Bandas', href: '/articulos/bandas-articulos-2' },
        { label: 'Discográficas', href: '/articulos/discograficas' },
        { label: 'Géneros', href: '/articulos/generos' },
        { label: 'Historia', href: '/articulos/historia' },
        { label: 'Mejores discos del año', href: '/articulos/mejores-discos/discos-del-ano' },
        { label: 'Mejores discos del mes', href: '/articulos/mejores-discos/discos-del-mes' },
        { label: 'Portadas de álbumes', href: '/articulos/portadas-de-albumes' },
      ]),
    },
    {
      label: 'Novedades',
      href: '/novedades',
      children: withPreviews(posts, [
        { label: 'Noticias', href: '/novedades/noticias' },
        { label: 'La Lupa', href: '/novedades/la-lupa' },
      ]),
    },
    {
      label: 'Reviews',
      href: '/review-de-discos',
      previewPosts: previewPostsFor(posts, '/review-de-discos'),
    },
    {
      label: 'Crónicas',
      href: '/cronicas',
      children: withPreviews(posts, [
        { label: 'Conciertos', href: '/cronicas/conciertos' },
        { label: 'Festivales', href: '/cronicas/festivales-cronicas' },
      ]),
    },
    {
      label: 'Entrevistas',
      href: '/entrevistas',
      previewPosts: previewPostsFor(posts, '/entrevistas'),
    },
  ];
}
