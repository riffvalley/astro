<script setup lang="ts">
import { computed } from 'vue';
import { SPOTIFY_ICON_PATH, spotifySearchUrl } from '../../../lib/spotify';

const props = withDefaults(defineProps<{
  artistName?: string;
  discName: string;
  variant?: 'row' | 'modal';
}>(), {
  variant: 'row',
});

const url = computed(() => spotifySearchUrl(props.artistName, props.discName));
</script>

<template>
  <a
    :href="url"
    target="_blank"
    rel="noopener noreferrer"
    :class="variant === 'modal' ? 'disc-modal-spotify' : 'disc-spotify'"
    :aria-label="`Escuchar «${discName}» en Spotify`"
    @click.stop
  >
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="SPOTIFY_ICON_PATH" /></svg>
    <template v-if="variant === 'modal'"> Escuchar en Spotify</template>
  </a>
</template>

<style scoped>
.disc-spotify {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  color: var(--color-muted);
  transition: background 120ms var(--ease-out, ease), color 120ms var(--ease-out, ease);
}

.disc-spotify svg { width: 18px; height: 18px; }

.disc-spotify:hover { background: var(--color-paper); color: #1db954; }

.disc-modal-spotify {
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  background: #1db954;
  color: #04150a;
  font-size: 0.9375rem;
  font-weight: 700;
  text-decoration: none;
  transition: transform 120ms var(--ease-out, ease), filter 120ms var(--ease-out, ease);
}

.disc-modal-spotify svg { width: 20px; height: 20px; }

.disc-modal-spotify:hover { filter: brightness(1.08); transform: translateY(-1px); }
</style>
