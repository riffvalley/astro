<script setup lang="ts">
import { computed } from 'vue';
import { detectLinkPlatform } from '../../../lib/linkPlatform';
import { SPOTIFY_ICON_PATH } from '../../../lib/spotify';

const BANDCAMP_ICON_PATH = 'M0 18.75l7.437-13.5H24l-7.438 13.5H0z';
const YOUTUBE_ICON_PATH =
  'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z';

const props = defineProps<{ href: string; label: string }>();

const platform = computed(() => detectLinkPlatform(props.href));

const iconPath = computed(() => {
  switch (platform.value) {
    case 'spotify':
      return SPOTIFY_ICON_PATH;
    case 'bandcamp':
      return BANDCAMP_ICON_PATH;
    case 'youtube':
      return YOUTUBE_ICON_PATH;
    default:
      return null;
  }
});

const hoverColor = computed(() => {
  switch (platform.value) {
    case 'spotify':
      return '#1db954';
    case 'bandcamp':
      return '#408294';
    case 'youtube':
      return '#ff0000';
    default:
      return 'var(--color-accent)';
  }
});
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="link-btn"
    :style="{ '--hover-color': hoverColor }"
    :aria-label="label"
  >
    <svg v-if="iconPath" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="iconPath" /></svg>
    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M14 4h6m0 0v6m0-6L10 14M6 6h4m-4 0v12h12v-4" />
    </svg>
  </a>
</template>

<style scoped>
.link-btn {
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

.link-btn svg { width: 18px; height: 18px; }

.link-btn:hover { background: var(--color-paper); color: var(--hover-color, var(--color-accent)); }
</style>
