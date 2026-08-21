<script setup lang="ts">
import { computed } from 'vue';
import type { InstagramPost } from '../api/instagram';
import PhoneMediaCarousel, { type CarouselSlide } from './PhoneMediaCarousel.vue';

const props = defineProps<{ post: InstagramPost }>();

defineEmits<{ back: [] }>();

const slides = computed<CarouselSlide[]>(() => {
  if (props.post.children && props.post.children.length > 1) {
    return props.post.children.map(child => ({ id: child.id, url: child.mediaUrl, isVideo: child.mediaType === 'VIDEO' }));
  }
  return [{ id: props.post.id, url: props.post.mediaUrl, isVideo: props.post.mediaType === 'VIDEO' }];
});

const formattedDate = computed(() =>
  new Date(props.post.igTimestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
);
</script>

<template>
  <div class="ig-detail">
    <button type="button" class="ig-back" @click="$emit('back')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Volver al listado
    </button>

    <PhoneMediaCarousel :slides="slides" />

    <p v-if="post.caption" class="ig-detail-caption">{{ post.caption }}</p>
    <p class="ig-detail-date">{{ formattedDate }}</p>

    <a :href="post.permalink" target="_blank" rel="noopener noreferrer" class="ig-detail-external">Ver en Instagram ↗</a>
  </div>
</template>

<style scoped>
.ig-detail {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.ig-back {
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

.ig-back svg {
  width: 16px;
  height: 16px;
}

.ig-detail-caption {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-ink);
  white-space: pre-line;
  margin: 0;
}

.ig-detail-date {
  font-size: 0.75rem;
  color: var(--color-muted);
  margin: 0;
}

.ig-detail-external {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms var(--ease-out, ease);
}

.ig-detail-external:hover {
  border-color: var(--color-accent);
}
</style>
