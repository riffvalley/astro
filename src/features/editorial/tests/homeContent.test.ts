import { describe, expect, it } from 'vitest';
import type { Category, PostDetail } from '../../../lib/wordpress';
import { buildHomeEditorialContent } from '../homeContent';

// Todas las fechas de los fixtures son fijas: la selección editorial sólo
// compara fechas entre posts, nunca contra el reloj real.
function post(overrides: Partial<PostDetail>): PostDetail {
  return {
    id: 'post-id',
    title: 'Post title',
    slug: 'post-title',
    uri: '/post-title',
    date: '2026-01-01T00:00:00',
    excerpt: '',
    content: '',
    featuredImage: null,
    author: null,
    seo: null,
    categories: [],
    ...overrides,
  };
}

function category(uri: string, name: string): Category {
  return { id: `cat:${uri}`, name, uri, description: '', count: 0 };
}

const CRONICAS = '/cronicas/';
const REVIEWS = '/review-de-discos/';
const ARTICULOS = '/articulos/';
const ENTREVISTAS = '/entrevistas/';
const NOVEDADES = '/novedades/';
const DISCOS_DEL_MES = '/articulos/mejores-discos/discos-del-mes/';

const CATEGORIES: Category[] = [
  category(CRONICAS, 'Crónicas'),
  category(REVIEWS, 'Reviews'),
  category(ARTICULOS, 'Artículos'),
  category(ENTREVISTAS, 'Entrevistas'),
  category(NOVEDADES, 'Novedades'),
  category(DISCOS_DEL_MES, 'Mejores discos del mes'),
];

function taggedIn(...uris: string[]) {
  return uris.map(uri => ({ uri, name: uri }));
}

// La cuadrícula superior se queda con los 6 primeros posts, así que los
// fixtures que prueban rieles empiezan siempre con relleno sin categoría.
function gridFiller(count = 6): PostDetail[] {
  return Array.from({ length: count }, (_, i) => post({ id: `filler-${i}`, title: `Filler ${i}` }));
}

function inCategory(id: string, uris: string[], overrides: Partial<PostDetail> = {}): PostDetail {
  return post({ id, title: id, categories: taggedIn(...uris), ...overrides });
}

function railIds(rail: { posts: PostDetail[] } | undefined) {
  return rail?.posts.map(p => p.id);
}

describe('buildHomeEditorialContent', () => {
  it('takes the first six posts, in order, for the grid', () => {
    const posts = Array.from({ length: 8 }, (_, i) => post({ id: `p${i}`, title: `Post ${i}` }));

    const { gridPosts } = buildHomeEditorialContent(posts, CATEGORIES);

    expect(gridPosts.map(p => p.id)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('keeps the current per-rail limits (3 / 2 / 4 / 2 / 4)', () => {
    const posts = [
      ...gridFiller(),
      ...Array.from({ length: 5 }, (_, i) => inCategory(`cronica-${i}`, [CRONICAS])),
      ...Array.from({ length: 4 }, (_, i) => inCategory(`review-${i}`, [REVIEWS])),
      ...Array.from({ length: 6 }, (_, i) => inCategory(`articulo-${i}`, [ARTICULOS])),
      ...Array.from({ length: 4 }, (_, i) => inCategory(`entrevista-${i}`, [ENTREVISTAS])),
      ...Array.from({ length: 6 }, (_, i) => inCategory(`novedad-${i}`, [NOVEDADES])),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(railIds(content.cronicas)).toEqual(['cronica-0', 'cronica-1', 'cronica-2']);
    expect(content.reviews?.items.map(item => item.post.id)).toEqual(['review-0', 'review-1']);
    expect(railIds(content.articulos)).toEqual(['articulo-0', 'articulo-1', 'articulo-2', 'articulo-3']);
    expect(railIds(content.entrevistas)).toEqual(['entrevista-0', 'entrevista-1']);
    expect(railIds(content.novedades)).toEqual(['novedad-0', 'novedad-1', 'novedad-2', 'novedad-3']);
  });

  it('matches the category uri exactly, so child categories do not leak into a rail', () => {
    const posts = [
      ...gridFiller(),
      inCategory('conciertos', ['/cronicas/conciertos/']),
      inCategory('cronica', [CRONICAS]),
      inCategory('noticias', ['/novedades/noticias/']),
      inCategory('novedad', [NOVEDADES]),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(railIds(content.cronicas)).toEqual(['cronica']);
    expect(railIds(content.novedades)).toEqual(['novedad']);
  });

  it('resolves top-level categories whether or not their uri has a trailing slash', () => {
    const posts = [...gridFiller(), inCategory('cronica', ['/cronicas'])];

    const content = buildHomeEditorialContent(posts, [category('/cronicas', 'Crónicas')]);

    expect(content.cronicas).toEqual({ name: 'Crónicas', href: '/cronicas', posts: [posts[6]] });
  });

  it('deduplicates across rails in order: Crónicas → Reviews → Artículos → Entrevistas → Novedades', () => {
    const posts = [
      ...gridFiller(),
      inCategory('all-five', [CRONICAS, REVIEWS, ARTICULOS, ENTREVISTAS, NOVEDADES]),
      inCategory('from-reviews', [REVIEWS, ARTICULOS, ENTREVISTAS, NOVEDADES]),
      inCategory('from-articulos', [ARTICULOS, ENTREVISTAS, NOVEDADES]),
      inCategory('from-entrevistas', [ENTREVISTAS, NOVEDADES]),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(railIds(content.cronicas)).toEqual(['all-five']);
    expect(content.reviews?.items.map(item => item.post.id)).toEqual(['from-reviews']);
    expect(railIds(content.articulos)).toEqual(['from-articulos']);
    expect(railIds(content.entrevistas)).toEqual(['from-entrevistas']);
    expect(railIds(content.novedades)).toEqual([]);
  });

  it('never repeats a post already shown in the grid', () => {
    const posts = [
      inCategory('in-grid', [CRONICAS]),
      ...gridFiller(5),
      inCategory('below-grid', [CRONICAS]),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(content.gridPosts.map(p => p.id)).toContain('in-grid');
    expect(railIds(content.cronicas)).toEqual(['below-grid']);
  });

  it('reserves the monthly albums post before building the Artículos rail', () => {
    const posts = [
      ...gridFiller(),
      inCategory('mensual', [DISCOS_DEL_MES, ARTICULOS]),
      inCategory('articulo', [ARTICULOS]),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(content.monthlyAlbums?.post.id).toBe('mensual');
    expect(content.monthlyAlbums?.href).toBe(DISCOS_DEL_MES);
    expect(railIds(content.articulos)).toEqual(['articulo']);
  });

  it('picks the most recent monthly albums post by date, not by input position', () => {
    const posts = [
      ...gridFiller(),
      inCategory('enero', [DISCOS_DEL_MES], { date: '2026-01-31T10:00:00' }),
      inCategory('marzo', [DISCOS_DEL_MES], { date: '2026-03-31T10:00:00' }),
      inCategory('febrero', [DISCOS_DEL_MES], { date: '2026-02-28T10:00:00' }),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(content.monthlyAlbums?.post.id).toBe('marzo');
  });

  it('extracts the highlighted bands of the monthly albums post', () => {
    const posts = [
      ...gridFiller(),
      inCategory('mensual', [DISCOS_DEL_MES], {
        content: '<p>Os hablaremos de los nuevos trabajos de Converge, Deftones y Dagger Threat.</p>',
      }),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(content.monthlyAlbums?.bands).toEqual(['Converge', 'Deftones', 'Dagger Threat']);
  });

  it('projects reviews with their score, or null when the post has none', () => {
    const posts = [
      ...gridFiller(),
      inCategory('scored', [REVIEWS], {
        content: '<div class="score__wrap" style="--c:#fff"><div class="score">8.8</div></div>',
      }),
      inCategory('unscored', [REVIEWS]),
    ];

    const content = buildHomeEditorialContent(posts, CATEGORIES);

    expect(content.reviews?.href).toBe(REVIEWS);
    expect(content.reviews?.items).toEqual([
      { post: posts[6], score: 8.8 },
      { post: posts[7], score: null },
    ]);
  });

  it('omits a rail entirely when its category does not exist', () => {
    const posts = [...gridFiller(), inCategory('cronica', [CRONICAS])];

    const content = buildHomeEditorialContent(posts, []);

    expect(content.gridPosts).toHaveLength(6);
    expect(content.cronicas).toBeUndefined();
    expect(content.reviews).toBeUndefined();
    expect(content.articulos).toBeUndefined();
    expect(content.entrevistas).toBeUndefined();
    expect(content.novedades).toBeUndefined();
    expect(content.monthlyAlbums).toBeUndefined();
  });

  it('returns empty rails, and no monthly spotlight, when there are no candidate posts', () => {
    const content = buildHomeEditorialContent([], CATEGORIES);

    expect(content.gridPosts).toEqual([]);
    expect(railIds(content.cronicas)).toEqual([]);
    expect(content.reviews?.items).toEqual([]);
    expect(railIds(content.articulos)).toEqual([]);
    expect(railIds(content.entrevistas)).toEqual([]);
    expect(railIds(content.novedades)).toEqual([]);
    expect(content.monthlyAlbums).toBeUndefined();
  });
});
