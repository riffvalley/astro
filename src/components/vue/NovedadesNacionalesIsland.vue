<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MonthYearPicker from '../../shared/components/MonthYearPicker.vue';
import ReleaseGroup from '../../shared/components/ReleaseGroup.vue';
import NationalRow from '../../features/national-releases/components/NationalRow.vue';
import ProposalForm from '../../features/national-releases/components/ProposalForm.vue';
import { DATA_START_YEAR, fetchNationalReleases } from '../../features/national-releases/api/nationalReleasesClient';
import type { NationalRelease } from '../../features/national-releases/model/nationalRelease.types';
import { formatDateLong } from '../../shared/utils/formatDateLong';
import { groupByDay } from '../../features/national-releases/utils/releaseFormat';

const today = new Date();
const viewMonth = ref(today.getMonth()); // 0-indexado
const viewYear = ref(today.getFullYear());
const loading = ref(false);
const errored = ref(false);
const groups = ref<{ releaseDay: string; entries: NationalRelease[] }[]>([]);

async function load() {
  loading.value = true;
  errored.value = false;
  try {
    const items = await fetchNationalReleases(viewMonth.value + 1, viewYear.value);
    groups.value = groupByDay(items);
  } catch {
    errored.value = true;
    groups.value = [];
  } finally {
    loading.value = false;
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

onMounted(load);
</script>

<template>
  <MonthYearPicker :month="viewMonth" :year="viewYear" :start-year="DATA_START_YEAR" @update:month="onMonthChange" @update:year="onYearChange" />

  <div class="release-list" aria-live="polite">
    <p v-if="loading" class="release-status">Cargando novedades nacionales…</p>
    <p v-else-if="errored" class="release-status release-status--error">
      No hemos podido cargar las novedades nacionales.
      <button type="button" class="retry-link" @click="load">Reintentar</button>
    </p>
    <p v-else-if="groups.length === 0" class="release-status">No hay novedades nacionales para este mes.</p>
    <ReleaseGroup
      v-for="group in groups"
      :key="group.releaseDay"
      :label="formatDateLong(group.releaseDay)"
      :count-label="group.entries.length === 1 ? '1 novedad' : `${group.entries.length} novedades`"
    >
      <NationalRow
        v-for="(item, i) in group.entries"
        :key="`${item.artistName}-${item.discName}-${i}`"
        :item="item"
      />
    </ReleaseGroup>
  </div>

  <section class="national-form-wrap">
    <h2 class="section-subtitle">Proponer una novedad</h2>
    <p class="national-form-hint">
      Cualquiera puede proponer un lanzamiento. Queda pendiente de revisión por un administrador antes de publicarse — no aparecerá en el listado de arriba hasta entonces.
    </p>
    <ProposalForm />
  </section>
</template>

<style scoped>
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

.national-form-wrap {
  margin-top: var(--space-2xl, 4rem);
  padding-top: var(--space-xl, 2.5rem);
  border-top: 1px solid var(--color-rule);
}

.section-subtitle {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  color: var(--color-ink);
  margin: 0 0 0.4rem;
}

.national-form-hint {
  max-width: 60ch;
  font-size: 0.875rem;
  color: var(--color-ink-2);
  margin: 0 0 var(--space-lg, 1.5rem);
}
</style>
