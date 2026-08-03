<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import MonthYearPicker from './MonthYearPicker.vue';
import SearchableCombobox from './SearchableCombobox.vue';
import ReleaseGroup from './ReleaseGroup.vue';
import DiscRow from './DiscRow.vue';
import DiscModal from './DiscModal.vue';
import { DATA_START_YEAR, fetchFilterOptions, fetchMonth, type Disc, type DiscDateGroup, type FilterOption } from '../../lib/discs';
import { formatDateLong } from '../../lib/releaseFormat';

const today = new Date();
const viewMonth = ref(today.getMonth()); // 0-indexado
const viewYear = ref(today.getFullYear());

const genreId = ref('');
const countryId = ref('');
const appliedGenreId = ref('');
const appliedCountryId = ref('');

const genres = ref<FilterOption[]>([]);
const countries = ref<FilterOption[]>([]);

const loading = ref(false);
const errored = ref(false);
const groups = ref<DiscDateGroup[]>([]);
const openIndex = ref(-1);

const selectedDisc = ref<Disc | null>(null);

const hasActiveFilters = computed(() => !!appliedGenreId.value || !!appliedCountryId.value);

function todayIso() {
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// En la carga inicial se abre el grupo de hoy (o el más cercano a hoy si hoy
// no tiene lanzamientos). Un cambio de mes o de filtros posterior deja todo
// comprimido.
function pickDefaultOpenIndex(groupList: DiscDateGroup[], isInitial: boolean) {
  if (!isInitial) return -1;
  if (viewYear.value === today.getFullYear() && viewMonth.value === today.getMonth()) {
    const todayTime = new Date(`${todayIso()}T00:00:00`).getTime();
    let closestIdx = 0;
    let closestDiff = Infinity;
    groupList.forEach((g, i) => {
      const diff = Math.abs(new Date(`${g.releaseDate}T00:00:00`).getTime() - todayTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    });
    return closestIdx;
  }
  return 0;
}

async function load(isInitial = false) {
  loading.value = true;
  errored.value = false;
  try {
    const data = await fetchMonth(viewYear.value, viewMonth.value, appliedGenreId.value, appliedCountryId.value);
    groups.value = data;
    openIndex.value = pickDefaultOpenIndex(data, isInitial);
  } catch {
    errored.value = true;
    groups.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadFilters() {
  try {
    const { genres: g, countries: c } = await fetchFilterOptions();
    genres.value = g;
    countries.value = c;
  } catch {
    // Los combobox se quedan vacíos (sin opciones que buscar) — no bloquea el resto de la página.
  }
}

function onMonthChange(month: number) {
  viewMonth.value = month;
  load();
}

function onYearChange(year: number) {
  viewYear.value = year;
  load();
}

function applyFilters() {
  appliedGenreId.value = genreId.value;
  appliedCountryId.value = countryId.value;
  load();
}

function clearFilters() {
  genreId.value = '';
  countryId.value = '';
  appliedGenreId.value = '';
  appliedCountryId.value = '';
  load();
}

function openDisc(disc: Disc) {
  selectedDisc.value = disc;
}

function closeDisc() {
  selectedDisc.value = null;
}

onMounted(() => {
  loadFilters();
  load(true);
});
</script>

<template>
  <MonthYearPicker
    :month="viewMonth"
    :year="viewYear"
    :start-year="DATA_START_YEAR"
    @update:month="onMonthChange"
    @update:year="onYearChange"
  />

  <form class="filters" @submit.prevent="applyFilters">
    <SearchableCombobox v-model="genreId" :options="genres" label="Género" placeholder="Todos los géneros" field-id="genre" />
    <SearchableCombobox v-model="countryId" :options="countries" label="País del artista" placeholder="Todos los países" field-id="country" />
    <button type="submit" class="filters-submit">Filtrar</button>
    <button v-if="hasActiveFilters" type="button" class="filters-clear" @click="clearFilters">Quitar filtros</button>
  </form>

  <div class="release-list" aria-live="polite">
    <p v-if="loading" class="release-status">Cargando lanzamientos…</p>
    <p v-else-if="errored" class="release-status release-status--error">
      No hemos podido cargar los lanzamientos.
      <button type="button" class="retry-link" @click="load()">Reintentar</button>
    </p>
    <p v-else-if="groups.length === 0" class="release-status">No hay lanzamientos para este mes con estos filtros.</p>
    <ReleaseGroup
      v-for="(group, i) in groups"
      :key="group.releaseDate"
      :label="formatDateLong(group.releaseDate)"
      :count-label="group.discs.length === 1 ? '1 disco' : `${group.discs.length} discos`"
      collapsible
      :open="i === openIndex"
    >
      <DiscRow v-for="disc in group.discs" :key="disc.id" :disc="disc" @open="openDisc" />
    </ReleaseGroup>
  </div>

  <a href="/novedades-nacionales" class="national-cta">
    Ver novedades nacionales (España) <span aria-hidden="true">→</span>
  </a>

  <DiscModal :disc="selectedDisc" @close="closeDisc" />
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: center;
  gap: 0.75rem;
  padding-bottom: var(--space-xl, 2.5rem);
  margin-bottom: var(--space-xl, 2.5rem);
  border-bottom: 1px solid var(--color-rule);
}

.filters-submit {
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid var(--color-accent);
  background: transparent;
  color: var(--color-accent);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 120ms var(--ease-out, ease);
}

.filters-submit:hover { background: color-mix(in srgb, var(--color-accent) 14%, transparent); }

.filters-clear {
  padding: 0.55rem 0.2rem;
  border: none;
  background: none;
  color: var(--color-muted);
  font-size: 0.8125rem;
  text-decoration: underline;
  cursor: pointer;
}

.release-status {
  padding: 2rem 0;
  text-align: center;
  color: var(--color-muted);
  font-size: 0.9375rem;
}

.release-status--error { color: var(--color-ink-2); }

.retry-link {
  border: none;
  background: none;
  padding: 0;
  margin-left: 0.3rem;
  color: var(--color-accent);
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

.national-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: var(--space-xl, 2.5rem);
  padding: 1.1rem 1.4rem;
  border-radius: 12px;
  border: 1px solid var(--color-rule);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  color: var(--color-ink);
  text-decoration: none;
  transition: border-color 160ms var(--ease-out, ease), color 160ms var(--ease-out, ease), background 160ms var(--ease-out, ease);
}

.national-cta:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background: color-mix(in srgb, var(--color-accent) 8%, transparent);
}

.national-cta span {
  transition: transform 160ms var(--ease-out, ease);
}

.national-cta:hover span {
  transform: translateX(3px);
}
</style>
