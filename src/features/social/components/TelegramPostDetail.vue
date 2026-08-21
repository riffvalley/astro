<script setup lang="ts">
import { computed } from 'vue';
import type { TelegramPost } from '../api/telegram';
import PhoneMediaCarousel, { type CarouselSlide } from './PhoneMediaCarousel.vue';

const props = defineProps<{ post: TelegramPost }>();

defineEmits<{ back: [] }>();

const slides = computed<CarouselSlide[]>(() =>
  props.post.images.map((url, i) => ({ id: `${props.post.id}-${i}`, url })),
);

const formattedDate = computed(() => {
  if (!props.post.date) return null;
  return new Date(props.post.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
});
</script>

<template>
  <div class="tg-detail">
    <button type="button" class="tg-back" @click="$emit('back')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
      Volver al listado
    </button>

    <PhoneMediaCarousel v-if="slides.length" :slides="slides" />

    <p v-if="post.text" class="tg-detail-text">{{ post.text }}</p>
    <p v-if="formattedDate" class="tg-detail-date">{{ formattedDate }}</p>

    <a :href="post.link" target="_blank" rel="noopener noreferrer" class="tg-detail-external">Ver en Telegram ↗</a>
  </div>
</template>

<style scoped>
.tg-detail {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.tg-back {
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

.tg-back svg {
  width: 16px;
  height: 16px;
}

.tg-detail-text {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--color-ink);
  white-space: pre-line;
  margin: 0;
}

.tg-detail-date {
  font-size: 0.75rem;
  color: var(--color-muted);
  margin: 0;
}

.tg-detail-external {
  align-self: flex-start;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-color 120ms var(--ease-out, ease);
}

.tg-detail-external:hover {
  border-color: var(--color-accent);
}
</style>
