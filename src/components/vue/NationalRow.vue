<script setup lang="ts">
import { computed } from 'vue';
import type { NationalRelease } from '../../lib/nationalReleases';
import { TYPE_COLORS, TYPE_LABELS, GENRE_COLOR } from '../../lib/releaseFormat';
import ColorPill from './ColorPill.vue';
import PlatformLinkButton from './PlatformLinkButton.vue';

const props = defineProps<{ item: NationalRelease }>();

const name = computed(() => props.item.disc?.name || props.item.discName);
const artistName = computed(() => props.item.disc?.artist?.name || props.item.artistName);
const image = computed(() => props.item.disc?.image);
const genreName = computed(() => props.item.disc?.genre?.name || props.item.genre);
const typeLabel = computed(() => TYPE_LABELS[props.item.discType] || props.item.discType);
const typeColor = computed(() => TYPE_COLORS[props.item.discType] || '#5b5c72');
const link = computed(() => props.item.link || props.item.disc?.link);
</script>

<template>
  <li class="disc-row disc-row--static">
    <img
      v-if="image"
      :src="image"
      alt=""
      loading="lazy"
      width="56"
      height="56"
      class="disc-img"
    />
    <img
      v-else
      src="/disc-placeholder.png"
      alt=""
      loading="lazy"
      width="56"
      height="56"
      class="disc-img disc-placeholder"
    />
    <div class="disc-body">
      <p class="disc-name">{{ name }}</p>
      <p class="disc-artist">{{ artistName }}</p>
    </div>
    <div class="disc-meta">
      <ColorPill :label="genreName" :color="GENRE_COLOR" />
      <ColorPill :label="typeLabel" :color="typeColor" />
    </div>
    <PlatformLinkButton v-if="link" :href="link" :label="`Escuchar «${name}»`" />
  </li>
</template>

<style scoped>
.disc-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.7rem 0.8rem;
  border-top: 1px solid var(--color-rule-2);
}

.disc-row:first-child { border-top: none; }

.disc-row--static { cursor: default; }

.disc-img {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
}

.disc-placeholder { background: var(--color-paper-3); }

.disc-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.disc-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  line-height: 1.3;
  margin: 0;
  color: var(--color-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.disc-artist {
  font-size: 0.8125rem;
  color: var(--color-ink-2);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.disc-meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

@media (max-width: 30rem) {
  .disc-meta { display: none; }
}
</style>
