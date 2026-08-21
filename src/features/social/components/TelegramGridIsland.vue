<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { fetchTelegramPosts, type TelegramPost } from '../api/telegram';
import { usePaginatedSocialFeed } from '../composables/usePaginatedSocialFeed';
import TelegramPostCard from './TelegramPostCard.vue';
import TelegramPostDetail from './TelegramPostDetail.vue';
import PhoneFrame from './PhoneFrame.vue';

const CHANNEL = 'conciertosrockmetal';
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
} = usePaginatedSocialFeed<TelegramPost, string | undefined>(async before => {
  const page = await fetchTelegramPosts(CHANNEL, LIMIT, before);
  return { data: page.data, hasMore: page.hasMore, nextCursor: page.nextBefore ?? undefined };
}, undefined);

const viewportEl = ref<HTMLElement | null>(null);
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

function selectPost(post: TelegramPost) {
  selectFeedPost(post);
  if (viewportEl.value) viewportEl.value.scrollTop = 0;
}

function closeDetail() {
  closeFeedDetail();
  if (viewportEl.value) viewportEl.value.scrollTop = 0;
}

// La lista (y su sentinel) se desmonta con v-if mientras se ve el detalle de
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
    title="Telegram"
    subtitle="@conciertosrockmetal"
    subtitle-href="https://t.me/conciertosrockmetal"
    platform-icon="telegram"
    :can-go-back="!!selectedPost"
    @ready="onPhoneReady"
    @back="closeDetail"
  >
    <TelegramPostDetail v-if="selectedPost" :post="selectedPost" @back="closeDetail" />

    <template v-else>
      <div class="tg-list" :aria-busy="loading">
        <TelegramPostCard v-for="post in posts" :key="post.id" :post="post" @select="selectPost" />
      </div>

      <p v-if="errored" class="tg-status tg-status--error">
        No hemos podido cargar el canal de Telegram.
        <button type="button" class="tg-retry" @click="loadMore">Reintentar</button>
      </p>
      <p v-else-if="loading" class="tg-status">Cargando…</p>

      <div ref="sentinel" class="tg-sentinel" aria-hidden="true"></div>
    </template>
  </PhoneFrame>
</template>

<style scoped>
.tg-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tg-status {
  padding: 1.25rem 0;
  text-align: center;
  color: var(--color-muted);
  font-size: 0.8125rem;
}

.tg-status--error { color: var(--color-ink-2); }

.tg-retry {
  border: none;
  background: none;
  padding: 0;
  margin-left: 0.3rem;
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.tg-sentinel {
  height: 1px;
}
</style>
