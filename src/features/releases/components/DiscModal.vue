<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Disc } from '../model/disc.types';
import { readableTextColor } from '../../../lib/colorContrast';
import ColorPill from '../../../shared/components/ColorPill.vue';
import Badge from './Badge.vue';
import SpotifyButton from './SpotifyButton.vue';

const props = defineProps<{ disc: Disc | null }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const dialogRef = ref<HTMLDialogElement | null>(null);

watch(
  () => props.disc,
  (disc) => {
    const dialog = dialogRef.value;
    if (!dialog) return;
    if (disc) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (dialog.open) {
      dialog.close();
    }
  },
);

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) emit('close');
}

function formatDateFull(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  const label = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const genreColor = computed(() => props.disc?.genre?.color || 'var(--color-accent)');
const genreTextColor = computed(() => readableTextColor(genreColor.value));
const countryName = computed(() => props.disc?.artist?.country?.name || '');

const metaRows = computed<[string, string][]>(() => {
  if (!props.disc) return [];
  const rows: [string, string][] = [['Artista', props.disc.artist?.name || 'Artista desconocido']];
  if (countryName.value) rows.push(['País', countryName.value]);
  if (props.disc.genre) rows.push(['Género', props.disc.genre.name]);
  rows.push(['Lanzamiento', formatDateFull(props.disc.releaseDate)]);
  return rows;
});
</script>

<template>
  <dialog ref="dialogRef" class="disc-modal" @click="onBackdropClick" @close="emit('close')">
    <button type="button" class="disc-modal-close" aria-label="Cerrar" @click="emit('close')">×</button>
    <div v-if="disc" class="disc-modal-body">
      <div class="disc-modal-media">
        <img :src="disc.image || '/disc-placeholder.png'" alt="" class="disc-modal-img" />
      </div>
      <div class="disc-modal-info">
        <div class="disc-modal-header">
          <div class="disc-modal-tags">
            <ColorPill v-if="disc.genre" :label="disc.genre.name" :color="genreColor" :text-color="genreTextColor" />
            <Badge v-if="disc.debut" label="Debut" variant="accent" />
            <Badge v-if="disc.ep" label="EP" />
          </div>
          <h2 class="disc-modal-title">{{ disc.name }}</h2>
        </div>
        <dl class="disc-modal-meta">
          <div v-for="[label, value] in metaRows" :key="label" class="disc-modal-meta-row">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
        <SpotifyButton :artist-name="disc.artist?.name" :disc-name="disc.name" variant="modal" />
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.disc-modal {
  position: fixed;
  inset: 0;
  margin: auto;
  width: min(46rem, calc(100vw - 2rem));
  max-height: min(46rem, calc(100vh - 2.5rem));
  padding: 0;
  border: none;
  border-radius: 20px;
  background: var(--color-paper);
  color: var(--color-ink);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55);
}

.disc-modal::backdrop {
  background: rgba(0, 2, 31, 0.78);
  backdrop-filter: blur(4px);
}

.disc-modal:not([open]) { display: none; }

.disc-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 9999px;
  border: none;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
  transition: background 120ms var(--ease-out, ease);
}

.disc-modal-close:hover { background: rgba(0, 0, 0, 0.75); }

.disc-modal-body {
  display: flex;
  flex-direction: column;
  max-height: min(46rem, calc(100vh - 2.5rem));
  overflow-y: auto;
  scrollbar-gutter: stable;
  border-radius: 20px;
}

.disc-modal-media {
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 1 / 1;
  max-height: 18rem;
  background: var(--color-paper-3);
}

.disc-modal-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.disc-modal-info {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  min-width: 0;
  padding: 1.6rem 1.75rem 2rem;
  background: var(--color-paper-2);
}

.disc-modal-header {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.disc-modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.disc-modal-title {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(1.5rem, 3vw + 1rem, 2.25rem);
  line-height: 1.15;
  letter-spacing: -0.015em;
  color: var(--color-ink);
  margin: 0;
}

.disc-modal-meta {
  display: flex;
  flex-direction: column;
  margin: 0;
  border-top: 1px solid var(--color-rule);
}

.disc-modal-meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--color-rule-2);
}

.disc-modal-meta-row dt {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.disc-modal-meta-row dd {
  margin: 0;
  text-align: right;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-ink);
}

@media (min-width: 40rem) {
  .disc-modal-body { flex-direction: row; }
  .disc-modal-media { width: 42%; max-height: none; aspect-ratio: auto; }
  .disc-modal-info { flex: 1; justify-content: center; }
}
</style>
