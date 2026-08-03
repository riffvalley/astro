<script setup lang="ts">
import { computed } from 'vue';
import type { InstagramPost } from '../../lib/instagram';

const props = defineProps<{ post: InstagramPost }>();

defineEmits<{ select: [InstagramPost] }>();

const isVideo = computed(() => props.post.mediaType === 'VIDEO');
const isReel = computed(() => props.post.mediaProductType === 'REELS');
const isAlbum = computed(() => (props.post.children?.length ?? 0) > 1);
const thumbSrc = computed(() => (isVideo.value && props.post.thumbnailUrl) || props.post.mediaUrl);
</script>

<template>
  <button
    type="button"
    class="ig-card"
    :aria-label="post.caption || 'Ver publicación'"
    @click="$emit('select', post)"
  >
    <img :src="thumbSrc" alt="" loading="lazy" class="ig-img" />

    <span v-if="isVideo" class="ig-badge" aria-hidden="true">
      <svg v-if="isReel" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2 8h20M7 3 4 8m6-5-3 5m9-5-3 5m9-5-3 5" />
        <rect x="2" y="8" width="20" height="13" rx="2" />
        <path fill="currentColor" stroke="none" d="M10.5 12.5 15 15l-4.5 2.5v-5Z" />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
    <span v-else-if="isAlbum" class="ig-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="7" y="7" width="13" height="13" rx="2" />
        <path d="M4 14V5a2 2 0 0 1 2-2h9" />
      </svg>
    </span>
  </button>
</template>

<style scoped>
.ig-card {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 3px;
  background: var(--color-paper-3);
  border: none;
  padding: 0;
  cursor: pointer;
}

.ig-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 220ms var(--ease-out, ease);
}

.ig-card:hover .ig-img {
  transform: scale(1.04);
}

.ig-badge {
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

.ig-badge svg {
  width: 15px;
  height: 15px;
}
</style>
