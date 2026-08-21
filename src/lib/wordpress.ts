import { fetchGraphQL, readDevCache, writeDevCache } from './wordpressClient';

function stripGenerator(fullHead: string): string {
  return fullHead.replace(/<meta name="generator"[^>]*>/gi, '');
}

// Algunos bloques/shortcodes de WP inyectan una página HTML completa dentro del content.
// Nos quedamos solo con lo que hay antes del primer <!DOCTYPE embebido.
function truncateAtEmbeddedDoctype(content: string): string {
  const doctypeIndex = content.indexOf('<!DOCTYPE');
  return doctypeIndex > 0 ? content.substring(0, doctypeIndex) : content;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  uri: string;
  date: string;
  excerpt: string;
  featuredImage: { node: { sourceUrl: string; fullUrl: string; altText: string } } | null;
  author: { node: { name: string; avatar: { url: string } | null } } | null;
}

export interface RankMathSeo {
  fullHead: string;
}

export interface PostDetail extends Post {
  content: string;
  seo: RankMathSeo | null;
  categories: { uri: string; name: string }[];
}

export interface Category {
  id: string;
  name: string;
  uri: string;
  description: string;
  count: number;
}

export interface Page {
  id: string;
  title: string;
  uri: string;
  content: string;
  seo: RankMathSeo | null;
}

interface RawPostDetail extends Post {
  content: string;
  seo: RankMathSeo | null;
  categories: { nodes: { uri: string; name: string }[] };
}

interface PostsPage {
  posts: {
    nodes: RawPostDetail[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

function postsPageQuery(includeSeo: boolean): string {
  return `
    query GetAllPosts($after: String) {
      posts(first: 20, after: $after) {
        nodes {
          id
          title
          slug
          uri
          date
          excerpt
          content
          featuredImage {
            node {
              sourceUrl(size: MEDIUM)
              fullUrl: sourceUrl
              altText
            }
          }
          author {
            node {
              name
              avatar(size: 64) {
                url
              }
            }
          }
          categories {
            nodes {
              uri
              name
            }
          }
          ${includeSeo ? 'seo { fullHead }' : ''}
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;
}

// Trae TODOS los posts con su contenido completo en tandas paginadas.
// Se usa tanto para la home como para generar cada ruta de post/categoría en
// build time, evitando hacer una petición individual por página (eso es lo
// que provocaba 429 Too Many Requests con >1000 posts).
async function fetchAllPosts(): Promise<PostDetail[]> {
  const all: PostDetail[] = [];
  let cursor: string | null = null;

  do {
    let data: PostsPage;
    try {
      data = await fetchGraphQL<PostsPage>(postsPageQuery(true), { after: cursor });
    } catch (err) {
      // Si algún post de esta página tiene una redirección de Rank Math mal
      // configurada, pedir su seo.fullHead tumba toda la respuesta con un
      // 301 en vez de un error GraphQL normal. Reintentamos la misma página
      // sin seo para no perder el resto de posts por culpa de uno solo.
      console.warn(`[wordpress] Fallo pidiendo SEO en una página de posts, reintentando sin seo: ${(err as Error).message}`);
      data = await fetchGraphQL<PostsPage>(postsPageQuery(false), { after: cursor });
    }

    for (const raw of data.posts.nodes) {
      all.push({
        ...raw,
        content: raw.content ? truncateAtEmbeddedDoctype(raw.content) : '',
        seo: raw.seo?.fullHead ? { fullHead: stripGenerator(raw.seo.fullHead) } : (raw.seo ?? null),
        categories: raw.categories.nodes,
      });
    }

    cursor = data.posts.pageInfo.hasNextPage ? data.posts.pageInfo.endCursor : null;
  } while (cursor);

  return all;
}

interface CategoriesPage {
  categories: {
    nodes: Category[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

async function fetchCategories(): Promise<Category[]> {
  const all: Category[] = [];
  let cursor: string | null = null;

  do {
    const data: CategoriesPage = await fetchGraphQL<CategoriesPage>(`
      query GetCategories($after: String) {
        categories(first: 100, after: $after) {
          nodes {
            id
            name
            uri
            description
            count
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `, { after: cursor });

    all.push(...data.categories.nodes);
    cursor = data.categories.pageInfo.hasNextPage ? data.categories.pageInfo.endCursor : null;
  } while (cursor);

  return all;
}

interface PagesPage {
  pages: {
    nodes: Page[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

async function fetchPages(): Promise<Page[]> {
  const all: Page[] = [];
  let cursor: string | null = null;

  do {
    const data: PagesPage = await fetchGraphQL<PagesPage>(`
      query GetPages($after: String) {
        pages(first: 100, after: $after) {
          nodes {
            id
            title
            uri
            content
            seo {
              fullHead
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `, { after: cursor });

    for (const page of data.pages.nodes) {
      all.push({
        ...page,
        content: page.content ? truncateAtEmbeddedDoctype(page.content) : '',
        seo: page.seo?.fullHead ? { fullHead: stripGenerator(page.seo.fullHead) } : page.seo,
      });
    }

    cursor = data.pages.pageInfo.hasNextPage ? data.pages.pageInfo.endCursor : null;
  } while (cursor);

  return all;
}

// Memoizados: varias páginas (home, [...path]) piden estos mismos datos en
// paralelo durante el build; sin memoizar, cada una repetiría toda la
// paginación por su cuenta. En dev, además, se comprueba antes la caché en
// disco (.wp-cache/) para no repetir la paginación completa en cada reinicio.
let allPostsPromise: Promise<PostDetail[]> | null = null;
export function getAllPosts(): Promise<PostDetail[]> {
  if (!allPostsPromise) {
    const cached = readDevCache<PostDetail[]>('posts');
    allPostsPromise = cached
      ? Promise.resolve(cached)
      : fetchAllPosts().then(data => { writeDevCache('posts', data); return data; });
  }
  return allPostsPromise;
}

let categoriesPromise: Promise<Category[]> | null = null;
export function getCategories(): Promise<Category[]> {
  if (!categoriesPromise) {
    const cached = readDevCache<Category[]>('categories');
    categoriesPromise = cached
      ? Promise.resolve(cached)
      : fetchCategories().then(data => { writeDevCache('categories', data); return data; });
  }
  return categoriesPromise;
}

let pagesPromise: Promise<Page[]> | null = null;
export function getPages(): Promise<Page[]> {
  if (!pagesPromise) {
    const cached = readDevCache<Page[]>('pages');
    pagesPromise = cached
      ? Promise.resolve(cached)
      : fetchPages().then(data => { writeDevCache('pages', data); return data; });
  }
  return pagesPromise;
}
