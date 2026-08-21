<script setup lang="ts">
import type { TikTokVideoSummary } from '../api/tiktok';

defineProps<{ post: TikTokVideoSummary }>();

defineEmits<{ select: [TikTokVideoSummary] }>();
</script>

<template>
  <button type="button" class="tt-card" :aria-label="post.title || 'Ver vídeo'" @click="$emit('select', post)">
    <img :src="post.coverImageUrl" alt="" loading="lazy" class="tt-img" />

    <span class="tt-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.tt-card {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 9 / 16;
  overflow: hidden;
  border-radius: 3px;
  background: var(--color-paper-3);
  border: none;
  padding: 0;
  cursor: pointer;
}

.tt-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 220ms var(--ease-out, ease);
}

.tt-card:hover .tt-img {
  transform: scale(1.04);
}

.tt-badge {
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

.tt-badge svg {
  width: 15px;
  height: 15px;
}
</style>
