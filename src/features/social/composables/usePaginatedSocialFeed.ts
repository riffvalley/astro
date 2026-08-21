import { ref, type Ref } from 'vue';

/** Una página de resultados de un feed social paginado por cursor. */
export interface SocialFeedPage<TPost, TCursor> {
  data: TPost[];
  hasMore: boolean;
  /** Cursor a usar en la siguiente llamada a `fetchPage`. */
  nextCursor: TCursor;
}

export type FetchSocialFeedPage<TPost, TCursor> = (cursor: TCursor) => Promise<SocialFeedPage<TPost, TCursor>>;

/**
 * Coordinación de paginación común a los feeds de Instagram y Telegram:
 * estado de carga/error, protección contra cargas concurrentes, avance de
 * cursor y selección de post para el detalle.
 *
 * Es agnóstico de la plataforma — `fetchPage` decide los parámetros de la
 * petición y cómo evoluciona el cursor (offset numérico, `before` de
 * Telegram, etc.); el composable solo orquesta cuándo se llama y qué hacer
 * con el resultado.
 *
 * No gestiona nada del DOM (scroll, IntersectionObserver): eso sigue vivo en
 * cada Island, que es quien conoce el viewport real.
 */
export function usePaginatedSocialFeed<TPost, TCursor>(
  fetchPage: FetchSocialFeedPage<TPost, TCursor>,
  initialCursor: TCursor
) {
  const posts = ref([]) as Ref<TPost[]>;
  const cursor = ref(initialCursor) as Ref<TCursor>;
  const hasMore = ref(true);
  const loading = ref(false);
  const errored = ref(false);
  const selectedPost = ref(null) as Ref<TPost | null>;

  /**
   * Pide la siguiente página. Devuelve `false` sin hacer nada si ya hay una
   * carga en curso o no queda más contenido (misma guarda que antes existía
   * duplicada en cada Island) — el llamador puede usar ese resultado para
   * decidir si le corresponde encadenar lógica adicional (p. ej. el
   * relleno de overflow del viewport).
   */
  async function loadMore(): Promise<boolean> {
    if (loading.value || !hasMore.value) return false;
    loading.value = true;
    errored.value = false;
    try {
      const page = await fetchPage(cursor.value);
      posts.value.push(...page.data);
      cursor.value = page.nextCursor;
      hasMore.value = page.hasMore;
    } catch {
      errored.value = true;
    } finally {
      loading.value = false;
    }
    return true;
  }

  function selectPost(post: TPost): void {
    selectedPost.value = post;
  }

  function closeDetail(): void {
    selectedPost.value = null;
  }

  return { posts, cursor, hasMore, loading, errored, selectedPost, loadMore, selectPost, closeDetail };
}
