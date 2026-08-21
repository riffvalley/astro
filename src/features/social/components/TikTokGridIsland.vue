<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { fetchTikTokVideos, type TikTokVideoSummary } from '../api/tiktok';
import { usePaginatedSocialFeed } from '../composables/usePaginatedSocialFeed';
import TikTokVideoCard from './TikTokVideoCard.vue';
import TikTokVideoDetail from './TikTokVideoDetail.vue';
import PhoneFrame from './PhoneFrame.vue';

const LIMIT = 12;

const {
  posts,
  hasMore,
  loading,
  errored,
  selectedPost,
  loadMore: loadFeedPage,
  selectPost: selectFeedPost,
  closeDetail: closeFeedDetail,
} = usePaginatedSocialFeed<TikTokVideoSummary, number>(async offset => {
  const page = await fetchTikTokVideos(LIMIT, offset);
  return { data: page.data, hasMore: page.hasMore, nextCursor: offset + LIMIT };
}, 0);

const viewportEl = ref<HTMLElement | null>(null);
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

function selectPost(post: TikTokVideoSummary) {
  selectFeedPost(post);
  if (viewportEl.value) viewportEl.value.scrollTop = 0;
}

function closeDetail() {
  closeFeedDetail();
  if (viewportEl.value) viewportEl.value.scrollTop = 0;
}

// El grid (y su sentinel) se desmonta con v-if mientras se ve el detalle de
// un post — al volver hay que re-observar el sentinel nuevo, ya que el nodo
// DOM anterior ya no existe.
watch(selectedPost, async value => {
  if (value) return;
  await nextTick();
  if (observer && sentinel.value) observer.observe(sentinel.value);
});

async function loadMore() {
  const loaded = await loadFeedPage();
  if (!loaded) return;

  // Si la página cargada no llega a desbordar el contenedor, el sentinel
  // nunca "entra" en vista y el IntersectionObserver no dispara solo — seguir
  // pidiendo páginas hasta que haya overflow real o no quede más contenido.
  await nextTick();
  if (hasMore.value && viewportEl.value && viewportEl.value.scrollHeight <= viewportEl.value.clientHeight) {
    loadMore();
  }
}

function onPhoneReady(viewport: HTMLElement) {
  viewportEl.value = viewport;
  if (observer) return;
  observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting) loadMore();
    },
    { root: viewport },
  );
  if (sentinel.value) observer.observe(sentinel.value);
}

onMounted(loadMore);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <PhoneFrame
    title="TikTok"
    subtitle="@riffvalley"
    subtitle-href="https://www.tiktok.com/@riffvalley"
    platform-icon="tiktok"
    :can-go-back="!!selectedPost"
    @ready="onPhoneReady"
    @back="closeDetail"
  >
    <TikTokVideoDetail v-if="selectedPost" :post="selectedPost" @back="closeDetail" />

    <template v-else>
      <div class="tt-grid" :aria-busy="loading">
        <TikTokVideoCard v-for="post in posts" :key="post.id" :post="post" @select="selectPost" />
      </div>

      <p v-if="errored" class="tt-status tt-status--error">
        No hemos podido cargar los vídeos de TikTok.
        <button type="button" class="tt-retry" @click="loadMore">Reintentar</button>
      </p>
      <p v-else-if="loading" class="tt-status">Cargando…</p>

      <div ref="sentinel" class="tt-sentinel" aria-hidden="true"></div>
    </template>
  </PhoneFrame>
</template>

<style scoped>
.tt-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
}

.tt-status {
  padding: 1.25rem 0;
  text-align: center;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.tt-status--error { color: var(--color-ink-2); }

.tt-retry {
  border: none;
  background: none;
  padding: 0;
  margin-left: 0.3rem;
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.tt-sentinel {
  height: 1px;
}
</style>
