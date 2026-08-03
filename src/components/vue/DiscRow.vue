<script setup lang="ts">
import { computed } from 'vue';
import type { Disc } from '../../lib/discs';
import { readableTextColor } from '../../lib/colorContrast';
import ColorPill from './ColorPill.vue';
import Badge from './Badge.vue';
import SpotifyButton from './SpotifyButton.vue';

const props = defineProps<{ disc: Disc }>();
const emit = defineEmits<{ (e: 'open', disc: Disc): void }>();

const genreColor = computed(() => props.disc.genre?.color || 'var(--color-accent)');
const genreTextColor = computed(() => readableTextColor(genreColor.value));
const countryName = computed(() => props.disc.artist?.country?.name || '');

function handleOpen() {
  emit('open', props.disc);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  handleOpen();
}
</script>

<template>
  <li class="disc-row" tabindex="0" role="button" aria-haspopup="dialog" @click="handleOpen" @keydown="handleKeydown">
    <img v-if="disc.image" :src="disc.image" alt="" loading="lazy" width="56" height="56" class="disc-img" />
    <img v-else src="/disc-placeholder.png" alt="" loading="lazy" width="56" height="56" class="disc-img disc-placeholder" />
    <div class="disc-body">
      <p class="disc-name">{{ disc.name }}</p>
      <p class="disc-artist">{{ disc.artist?.name || 'Artista desconocido' }}{{ countryName ? ` · ${countryName}` : '' }}</p>
    </div>
    <div class="disc-meta">
      <ColorPill v-if="disc.genre" :label="disc.genre.name" :color="genreColor" :text-color="genreTextColor" />
      <Badge v-if="disc.debut" label="Debut" variant="accent" />
      <Badge v-if="disc.ep" label="EP" />
    </div>
    <SpotifyButton :artist-name="disc.artist?.name" :disc-name="disc.name" variant="row" />
  </li>
</template>

<style scoped>
.disc-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.6rem 0.6rem;
  border-radius: 10px;
  border-top: 1px solid var(--color-rule-2);
  cursor: pointer;
  transition: background 140ms var(--ease-out, ease);
}

.disc-row:first-child { border-top: none; }
.disc-row:hover { background: var(--color-paper-3); }
.disc-row:focus-visible { outline: 2px solid var(--color-focus); outline-offset: -2px; }

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
