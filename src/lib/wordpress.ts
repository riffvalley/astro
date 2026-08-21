import { request as httpsRequest } from 'node:https';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Configurable para poder migrar WordPress a un subdominio propio
// (p.ej. wordpress.riffvalley.es) el día que riffvalley.es pase a servir
// directamente este frontend de Astro, sin tocar código.
export const WP_BASE_URL = import.meta.env.WP_BASE_URL || 'https://www.riffvalley.es';
const WP_GRAPHQL_URL = `${WP_BASE_URL}/graphql`;

// Caché en disco (solo modo dev): la paginación completa de posts tarda
// ~2 minutos, y sin esto se repite en cada reinicio de `astro dev`. Se
// guarda una vez y se reutiliza indefinidamente entre reinicios — para
// forzar una actualización, borra la carpeta .wp-cache/ (no se versiona).
const DEV_CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../.wp-cache');

export function readDevCache<T>(name: string): T | null {
  if (!import.meta.env.DEV) return null;
  const file = join(DEV_CACHE_DIR, `${name}.json`);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function writeDevCache(name: string, data: unknown): void {
  if (!import.meta.env.DEV) return;
  if (!existsSync(DEV_CACHE_DIR)) mkdirSync(DEV_CACHE_DIR, { recursive: true });
  writeFileSync(join(DEV_CACHE_DIR, `${name}.json`), JSON.stringify(data));
}

// Caché en memoria del proceso de build/dev — evita repetir peticiones idénticas
// (p.ej. getAllPosts() se llama desde index.astro y desde [...path].astro).
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface SimpleResponse {
  ok: boolean;
  status: number;
  statusText: string;
  contentType: string;
  text: string;
}

// Usamos node:https directamente en vez del fetch global: el fetch que expone
// el adaptador de Netlify durante el build está instrumentado (Blobs/sessions)
// y con muchas peticiones seguidas a un host externo termina fallando con
// "redirect count exceeded".
function postJson(url: string, body: string): Promise<SimpleResponse> {
  const { hostname, pathname, search } = new URL(url);

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname,
        path: pathname + search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const status = res.statusCode ?? 0;
          resolve({
            ok: status >= 200 && status < 300,
            status,
            statusText: res.statusMessage ?? '',
            contentType: res.headers['content-type'] ?? '',
            text: Buffer.concat(chunks).toString('utf-8'),
          });
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Serializa las peticiones a la API (1 en vuelo cada vez, con una pequeña
// pausa entre ellas). Astro llama a getAllPosts()/etc. desde varias páginas
// en paralelo durante el build; sin esto, las peticiones concurrentes con
// contenido completo disparaban un 301 intermitente (probablemente un WAF
// limitando por volumen/ritmo de peticiones).
let requestChain: Promise<unknown> = Promise.resolve();
const REQUEST_SPACING_MS = 150;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = requestChain.then(task, task);
  requestChain = result.then(
    () => new Promise((resolve) => setTimeout(resolve, REQUEST_SPACING_MS)),
    () => new Promise((resolve) => setTimeout(resolve, REQUEST_SPACING_MS))
  );
  return result;
}

function isRetryableStatus(status: number): boolean {
  // 301/302 no se reintentan aquí: en este API son deterministas (un post
  // con una redirección de Rank Math mal configurada), no un problema
  // transitorio — se gestionan con un fallback de query en fetchAllPosts.
  return status === 429 || status >= 500;
}

export async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const cacheKey = JSON.stringify({ query, variables });

  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data as T;
  }

  const body = JSON.stringify({ query, variables });
  let res: SimpleResponse;
  let attempt = 0;
  const maxRetries = 5;

  while (true) {
    res = await enqueue(() => postJson(WP_GRAPHQL_URL, body));

    // Backoff exponencial ante rate limiting / respuestas transitorias del WAF.
    if (!isRetryableStatus(res.status) || attempt >= maxRetries) break;
    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    attempt++;
  }

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  if (!res.contentType.includes('application/json')) {
    throw new Error(`GraphQL endpoint returned non-JSON response (${res.contentType}): ${res.text.slice(0, 200)}`);
  }

  const json = JSON.parse(res.text) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(json.errors.map(e => e.message).join(', '));
  }

  cache.set(cacheKey, { data: json.data, expires: Date.now() + CACHE_TTL });

  return json.data as T;
}

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
