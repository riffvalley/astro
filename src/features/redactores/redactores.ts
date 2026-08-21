import { WP_BASE_URL, fetchGraphQL, readDevCache, writeDevCache } from '../../lib/wordpressClient';

export interface Redactor {
  name: string;
  slug: string;
  avatarUrl: string | null;
  post: { title: string; uri: string; featuredImage: { sourceUrl: string } | null } | null;
  reelUrl: string | null;
  /** true = hueco vacío sin icono/texto ("Reel próximamente"), para entradas
   * que a propósito no tienen reel (p.ej. la tarjeta de la app). */
  blankReel?: boolean;
}

// Lista curada a mano (no "todos los usuarios de WP") — son los perfiles
// concretos que pidió mostrar en la sección "Redactores" de la home, cada
// uno con su artículo "Top 10 discos 2025" como post destacado.
const REDACTOR_POSTS: Record<string, string> = {
  yerca: '/articulos/top-10-discos-2025-yerca',
  kelevra: '/articulos/top-10-discos-2025-kelevra',
  'fucking-stone': '/articulos/top-10-discos-2025-fuckingstone',
  martuky: '/articulos/top-10-discos-2025-martuky',
  tottibero: '/articulos/top-10-discos-2025-tottibero',
  ildkraft: '/articulos/top-10-discos-2025-ildkraft',
  danetduo: '/articulos/top-10-discos-2025-danae',
  carcassvet: '/articulos/top-10-discos-2025-carcassvet',
};
const REDACTOR_SLUGS = Object.keys(REDACTOR_POSTS);

// Fallback manual para posts cuya imagen destacada está rota en WP (el
// adjunto referenciado no resuelve por GraphQL, visto en fucking-stone) —
// quitar la entrada en cuanto se resuelva del lado de WordPress.
const REDACTOR_POST_IMAGE_OVERRIDES: Record<string, string> = {
  'fucking-stone': `${WP_BASE_URL}/wp-content/uploads/2025/04/Wrath-of-Logarius-Crown-Of-Mortis.jpg`,
};

// Reels de Instagram por redactor (mismo criterio de slugs que arriba) —
// exportado porque /api/redactor-reels.json.ts también lo necesita para
// resolver el mediaUrl real (CDN firmado, no vale cachearlo en build).
export const REDACTOR_REELS: Record<string, string> = {
  yerca: 'https://www.instagram.com/reels/DSlDT_gjZhH/',
  'fucking-stone': 'https://www.instagram.com/reels/DSnaWQmDXX9/',
  kelevra: 'https://www.instagram.com/reels/DSu18EMjX7-/',
  martuky: 'https://www.instagram.com/reels/DSxvcZmjWYx/',
  tottibero: 'https://www.instagram.com/reels/DS2xK1QjdWc/',
  ildkraft: 'https://www.instagram.com/reels/DS5YdVcDdpc/',
  danetduo: 'https://www.instagram.com/reels/DTBDhbwDRdM/',
  carcassvet: 'https://www.instagram.com/reels/DTDiKcqDU9G/',
};

interface UsersPage {
  users: {
    nodes: {
      name: string;
      slug: string;
      avatar: { url: string } | null;
    }[];
  };
}

interface RawRedactorPost {
  title: string;
  uri: string;
  featuredImage: { node: { sourceUrl: string } } | null;
}

// Los slugs de WP pueden traer guiones ("fucking-stone"), que no son válidos
// en un alias/nombre de campo GraphQL — se sanean a "_" solo para el alias.
function postAlias(slug: string): string {
  return `post_${slug.replace(/-/g, '_')}`;
}

// No es un redactor real de WP, sino una tarjeta fija para la propia Riff
// Valley App (logo local en vez de gravatar, sin reel).
const APP_ENTRY_SLUG = 'riffvalley-app';
const APP_ENTRY_POST_URI = '/articulos/mejores-discos-2025-riffvalley-web-app';

async function fetchRedactores(): Promise<Redactor[]> {
  const allSlugs = [...REDACTOR_SLUGS, APP_ENTRY_SLUG];
  const allPostUris: Record<string, string> = { ...REDACTOR_POSTS, [APP_ENTRY_SLUG]: APP_ENTRY_POST_URI };

  const postFields = allSlugs.map(slug => `
    ${postAlias(slug)}: postBy(uri: "${allPostUris[slug]}") {
      title
      uri
      featuredImage {
        node {
          sourceUrl(size: MEDIUM)
        }
      }
    }
  `).join('\n');

  const data = await fetchGraphQL<UsersPage & Record<string, RawRedactorPost | null>>(`
    query GetRedactores {
      users(first: 50) {
        nodes {
          name
          slug
          avatar(size: 96) {
            url
          }
        }
      }
      ${postFields}
    }
  `);

  const bySlug = new Map(data.users.nodes.map(user => [user.slug, user]));

  const redactores: Redactor[] = REDACTOR_SLUGS.map(slug => bySlug.get(slug))
    .filter((user): user is NonNullable<typeof user> => !!user)
    .map(user => {
      const post = data[postAlias(user.slug)];
      const overrideImage = REDACTOR_POST_IMAGE_OVERRIDES[user.slug];
      const featuredImage = post?.featuredImage?.node
        ?? (overrideImage ? { sourceUrl: overrideImage } : null);
      return {
        name: user.name,
        slug: user.slug,
        avatarUrl: user.avatar?.url ?? null,
        post: post ? { title: post.title, uri: post.uri, featuredImage } : null,
        reelUrl: REDACTOR_REELS[user.slug] ?? null,
      };
    });

  const appPost = data[postAlias(APP_ENTRY_SLUG)];
  redactores.push({
    name: 'Riff Valley App',
    slug: APP_ENTRY_SLUG,
    avatarUrl: '/LOGO-RIFF-VALLEY.svg',
    post: appPost
      ? { title: appPost.title, uri: appPost.uri, featuredImage: appPost.featuredImage?.node ?? null }
      : null,
    reelUrl: null,
    blankReel: true,
  });

  return redactores;
}

let redactoresPromise: Promise<Redactor[]> | null = null;
export function getRedactores(): Promise<Redactor[]> {
  if (!redactoresPromise) {
    const cached = readDevCache<Redactor[]>('redactores');
    redactoresPromise = cached
      ? Promise.resolve(cached)
      : fetchRedactores().then(data => { writeDevCache('redactores', data); return data; });
  }
  return redactoresPromise;
}
