<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { fetchTikTokVideo, type TikTokVideoSummary } from '../api/tiktok';

const props = defineProps<{ post: TikTokVideoSummary }>();

defineEmits<{ back: [] }>();

// El resumen del listado no trae la descripción del vídeo — se pide bajo
// demanda al abrir el detalle. Si falla, el detalle sigue siendo útil con
// lo que ya trae el resumen (portada, título, stats y enlace externo).
const description = ref<string | null>(null);

onMounted(async () => {
  try {
    const detail = await fetchTikTokVideo(props.post.id);
    description.value = detail.videoDescription || null;
  } catch {
    description.value = null;
  }
});

const formattedDate = computed(() =>
  new Date(props.post.createTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
);
</script>

<template>
  <div class="tt-detail">
    <button type="button" class="tt-back" @click="$emit('back')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Volver al listado
    </button>

    <img :src="post.coverImageUrl" alt="" class="tt-detail-cover" />

    <p class="tt-detail-title">{{ post.title }}</p>
    <p v-if="description" class="tt-detail-description">{{ description }}</p>

    <ul class="tt-detail-stats">
      <li>{{ post.viewCount.toLocaleString('es-ES') }} reproducciones</li>
      <li>{{ post.likeCount.toLocaleString('es-ES') }} me gusta</li>
      <li>{{ post.commentCount.toLocaleString('es-ES') }} comentarios</li>
      <li>{{ post.shareCount.toLocaleString('es-ES') }} veces compartido</li>
    </ul>

    <p class="tt-detail-date">{{ formattedDate }}</p>

    <a :href="post.permalink" target="_blank" rel="noopener noreferrer" class="tt-detail-external">Ver en TikTok ↗</a>
  </div>
</template>

<style scoped>
.tt-detail {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tt-back {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  align-self: flex-start;
  border: none;
  background: none;
  padding: 0.3rem 0;
  margin-bottom: 0.2rem;
  color: var(--color-accent);
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
}

.tt-back svg {
  width: 16px;
  height: 16px;
}

.tt-detail-cover {
  width: 100%;
  max-height: 20rem;
  object-fit: contain;
  display: block;
  border-radius: 8px;
  background: var(--color-paper-3);
}

.tt-detail-title {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--color-ink);
  margin: 0;
}

.tt-detail-description {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-ink);
  white-space: pre-line;
  margin: 0;
}

.tt-detail-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.75rem;
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-muted);
}

.tt-detail-date {
  font-size: 0.75rem;
  color: var(--color-muted);
  margin: 0;
}

.tt-detail-external {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms var(--ease-out, ease);
}

.tt-detail-external:hover {
  border-color: var(--color-accent);
}
</style>
