<script setup lang="ts">
import { computed } from 'vue';
import type { TelegramPost } from '../../lib/telegram';

const props = defineProps<{ post: TelegramPost }>();

defineEmits<{ select: [TelegramPost] }>();

const likelyTruncated = computed(() => props.post.text.length === 200);
const coverImage = computed(() => props.post.images[0]);
const isAlbum = computed(() => props.post.images.length > 1);

const formattedDate = computed(() => {
  if (!props.post.date) return null;
  return new Date(props.post.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
});
</script>

<template>
  <button type="button" class="tg-card" @click="$emit('select', post)">
    <div v-if="coverImage" class="tg-img-wrap">
      <img :src="coverImage" alt="" loading="lazy" class="tg-img" />
      <span v-if="isAlbum" class="tg-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="7" y="7" width="13" height="13" rx="2" />
          <path d="M4 14V5a2 2 0 0 1 2-2h9" />
        </svg>
      </span>
    </div>
    <div class="tg-body">
      <p v-if="post.text" class="tg-text">{{ post.text }}<span v-if="likelyTruncated">…</span></p>
      <p v-if="formattedDate" class="tg-date">{{ formattedDate }}</p>
    </div>
  </button>
</template>

<style scoped>
.tg-card {
  display: block;
  width: 100%;
  text-align: left;
  border-radius: var(--radius-card, 12px);
  border: 1px solid var(--color-rule-2);
  background: var(--color-paper);
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  transition: border-color 160ms var(--ease-out, ease);
}

.tg-card:hover {
  border-color: var(--color-accent);
}

.tg-img-wrap {
  position: relative;
}

.tg-img {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  display: block;
}

.tg-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 9999px;
  background: color-mix(in srgb, black 45%, transparent);
  color: white;
}

.tg-badge svg {
  width: 15px;
  height: 15px;
}

.tg-body {
  padding: 0.6rem 0.7rem;
}

.tg-text {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--color-ink);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.tg-date {
  margin: 0.3rem 0 0;
  font-size: 0.6875rem;
  color: var(--color-muted);
}
</style>
