<script setup lang="ts">
import { computed, ref } from 'vue';

import type { CalendarEvent, RegionCalendar, SpainMap } from '../model/agenda.types';
import { countEventsByCalendarName } from '../utils/eventDerivations';
import { flagSlugsFor } from '../utils/flagSlugs';

const props = defineProps<{
  calendars: RegionCalendar[];
  checked: ReadonlySet<string>;
  events: CalendarEvent[];
  spainMap: SpainMap;
}>();

const emit = defineEmits<{
  toggleCalendar: [name: string];
  setAllChecked: [value: boolean];
}>();

const filtersOpen = ref(false);
const filtersDialog = ref<HTMLDialogElement | null>(null);

const calendarByName = computed(() => new Map(props.calendars.map(c => [c.name, c])));

// Número de conciertos del mes cargado por comunidad, para el listado de
// filtros — sin tener en cuenta qué está marcado, es el total real.
const eventCountByCalendarName = computed(() => countEventsByCalendarName(props.events));

function openFilters() {
  filtersOpen.value = true;
  filtersDialog.value?.showModal();
}

function closeFilters() {
  filtersDialog.value?.close();
}

function onFiltersDialogClose() {
  filtersOpen.value = false;
}

function onFiltersDialogClick(e: MouseEvent) {
  if (e.target === filtersDialog.value) closeFilters();
}
</script>

<template>
  <button type="button" class="cal-filters-toggle" :aria-expanded="filtersOpen" @click="openFilters">
    <span class="cal-filters-icon" :class="{ open: filtersOpen }" aria-hidden="true">+</span> Filtros
  </button>

  <dialog ref="filtersDialog" class="cal-filters-dialog" @close="onFiltersDialogClose" @click="onFiltersDialogClick">
    <div class="cal-filters-dialog-inner">
      <div class="cal-filters-dialog-head">
        <h2>Filtrar por comunidad</h2>
        <div class="cal-filters-dialog-head-right">
          <div class="cal-filters-bulk">
            <button type="button" class="cal-filters-bulk-btn" @click="emit('setAllChecked', true)">Marcar todos</button>
            <span class="cal-filters-bulk-sep" aria-hidden="true">·</span>
            <button type="button" class="cal-filters-bulk-btn" @click="emit('setAllChecked', false)">Desactivar todos</button>
          </div>
          <button type="button" class="cal-filters-dialog-close" @click="closeFilters" aria-label="Cerrar">×</button>
        </div>
      </div>

      <div class="cal-filters-dialog-body">
        <div class="cal-map-card">
          <svg :viewBox="`0 0 ${spainMap.width} ${spainMap.height}`" class="cal-map" role="img" aria-label="Mapa de comunidades autónomas de España, Portugal, Ceuta y Melilla">
            <path
              v-for="shape in spainMap.shapes"
              :key="shape.id"
              :d="shape.d"
              class="cal-map-region"
              :class="{ 'is-active': checked.has(shape.calendarName) }"
              :style="`--region-color:${calendarByName.get(shape.calendarName)?.color ?? '#999'}`"
              @click="emit('toggleCalendar', shape.calendarName)"
            ><title>{{ shape.calendarName }}</title></path>

            <path :d="spainMap.compositionBorder" class="cal-map-composition-border" />
          </svg>
        </div>

        <div class="cal-filters-list">
          <div class="cal-filters-grid">
            <label v-for="cal in calendars" :key="cal.id" class="cal-filter-item" :style="`--cal-color:${cal.color}`">
              <input type="checkbox" class="cal-filter-checkbox" :checked="checked.has(cal.name)" @change="emit('toggleCalendar', cal.name)" />
              <span class="cal-filter-flags" aria-hidden="true">
                <img v-for="slug in flagSlugsFor(cal.name)" :key="slug" :src="`/flags/${slug}.svg`" alt="" class="cal-filter-flag" loading="lazy" />
              </span>
              <span class="cal-filter-swatch" aria-hidden="true"></span>
              <span class="cal-filter-name">{{ cal.name }}</span>
              <span class="cal-filter-count">{{ eventCountByCalendarName.get(cal.name) ?? 0 }}</span>
            </label>
          </div>
        </div>
      </div>

      <p class="cal-map-credit">
        Mapa: <a href="https://github.com/martgnz/es-atlas" target="_blank" rel="noopener">es-atlas</a> (IGN, CC-BY 4.0) + <a href="https://github.com/topojson/world-atlas" target="_blank" rel="noopener">world-atlas</a> (Natural Earth)
      </p>
    </div>
  </dialog>
</template>

<style scoped>
.cal-filters-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  border: none;
  /* Mismo degradado que la cabecera del calendario (colores del header). */
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 26%, var(--color-rv-navy)),
    color-mix(in srgb, var(--color-accent-2) 26%, var(--color-rv-navy))
  );
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8125rem;
  color: #ffffff;
  cursor: pointer;
  transition: filter 160ms ease;
}

.cal-filters-toggle:hover {
  filter: brightness(1.18);
}

.cal-filters-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
  color: #ffffff;
  transition: transform 200ms ease;
}

.cal-filters-icon.open {
  transform: rotate(45deg);
}

.cal-filters-dialog {
  border: none;
  border-radius: 16px;
  padding: 0;
  width: min(96vw, 82rem);
  max-width: 82rem;
  max-height: min(94vh, 58rem);
  margin: auto;
  inset: 0;
  background: var(--color-paper-2);
  color: var(--color-ink);
  overflow-y: auto;
}

.cal-filters-dialog::backdrop {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.cal-filters-dialog-inner {
  padding: 1.6rem 1.8rem 1.8rem;
}

.cal-filters-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.cal-filters-dialog-head h2 {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.125rem;
  color: var(--color-ink);
  margin: 0;
}

.cal-filters-dialog-head-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cal-filters-bulk {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cal-filters-bulk-btn {
  border: none;
  background: none;
  padding: 0;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8125rem;
  color: var(--color-muted);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cal-filters-bulk-btn:hover {
  color: var(--color-accent);
}

.cal-filters-bulk-sep {
  color: var(--color-rule);
}

.cal-filters-dialog-close {
  border: none;
  background: none;
  font-size: 1.6rem;
  line-height: 1;
  color: var(--color-muted);
  cursor: pointer;
  padding: 0 0.2rem;
}

.cal-filters-dialog-close:hover {
  color: var(--color-accent);
}

.cal-filters-dialog-body {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 2rem;
  align-items: center;
}

.cal-map-card {
  border: 1px solid var(--color-rule);
  border-radius: var(--radius-card, 12px);
  background: var(--color-paper);
  padding: 0.9rem;
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.cal-map-card::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(24rem 16rem at 15% -10%, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 60%),
    radial-gradient(20rem 15rem at 100% 110%, color-mix(in srgb, var(--color-accent-2) 12%, transparent), transparent 65%);
}

.cal-map {
  width: 100%;
  height: auto;
  display: block;
}

.cal-map-region {
  fill: var(--color-paper-3);
  stroke: var(--color-rule);
  stroke-width: 1;
  stroke-linejoin: round;
  cursor: pointer;
  transition: fill 200ms ease, stroke 200ms ease, filter 200ms ease;
}

.cal-map-region:hover {
  stroke: var(--color-accent);
  filter: brightness(1.08);
}

.cal-map-region.is-active {
  fill: var(--region-color);
  stroke: color-mix(in srgb, var(--region-color) 60%, var(--color-ink) 40%);
}

.cal-map-composition-border {
  fill: none;
  stroke: var(--color-muted);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  pointer-events: none;
}

.cal-filters-list {
  max-height: 40rem;
  overflow-y: auto;
}

.cal-filter-flags {
  display: inline-flex;
  gap: 0.3rem;
  flex-shrink: 0;
}

.cal-filter-flag {
  width: 1.75rem;
  height: 1.2rem;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid var(--color-rule);
  flex-shrink: 0;
}

.cal-map-credit {
  margin: 1rem 0 0;
  font-size: 0.6875rem;
  color: var(--color-muted);
}

.cal-map-credit a {
  color: inherit;
}

.cal-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1rem 1.5rem;
}

@media (max-width: 40rem) {
  .cal-filters-dialog-body {
    grid-template-columns: 1fr;
  }

  /* En móvil el mapa ocupa demasiado espacio frente al listado — sólo se
     muestra el listado de checkboxes, que ya cubre toda la funcionalidad. */
  .cal-map-card,
  .cal-map-credit {
    display: none;
  }

  .cal-filters-list {
    max-height: none;
  }
}

.cal-filter-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1.1875rem;
  font-weight: 600;
  color: var(--color-ink-2);
  cursor: pointer;
}

.cal-filter-name {
  flex: 1;
  min-width: 0;
}

.cal-filter-count {
  flex-shrink: 0;
  min-width: 1.6rem;
  padding: 0.1rem 0.5rem;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--cal-color) 30%, transparent);
  color: var(--color-ink);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 0.75rem;
  text-align: center;
}

.cal-filter-checkbox {
  accent-color: var(--cal-color);
  width: 1.4rem;
  height: 1.4rem;
  flex-shrink: 0;
}

.cal-filter-swatch {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  background: var(--cal-color);
  flex-shrink: 0;
}
</style>

<style>
/* Regla global (no scoped): el selector :global() de Vue no compone bien
   con un combinador de descendiente + pseudo-elemento en <style scoped>. */
html.light .cal-map-card::before {
  display: none;
}

html.light .cal-filters-toggle {
  background: var(--color-paper-2);
  border: 1px solid var(--color-rule);
  color: var(--color-ink);
}

html.light .cal-filters-toggle:hover {
  filter: none;
  border-color: var(--color-accent);
  color: var(--color-accent);
}

html.light .cal-filters-icon {
  background: color-mix(in oklch, var(--color-accent) 16%, transparent);
  color: var(--color-accent);
}
</style>
