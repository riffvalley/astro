<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(
  defineProps<{
    navigation?: 'links' | 'selects';
    prevHref?: string;
    nextHref?: string;
    todayHref?: string;
    month: number;
    year: number;
    loading?: boolean;
    compact?: boolean;
  }>(),
  { navigation: 'links', loading: false, compact: false }
);

const emit = defineEmits<{
  updateMonth: [month: number];
  updateYear: [year: number];
}>();

const yearOptions = [2025, 2026, 2027];
const monthOptions = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const displayMonthLabel = computed(() =>
  new Date(props.year, props.month - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
);

function updateMonth(event: Event) {
  emit('updateMonth', Number((event.target as HTMLSelectElement).value));
}

function updateYear(event: Event) {
  emit('updateYear', Number((event.target as HTMLSelectElement).value));
}
</script>

<template>
  <div class="agenda-nav" :class="{ compact }">
    <template v-if="navigation === 'links'">
      <a :href="prevHref" class="agenda-nav-btn" aria-label="Mes anterior">←</a>
      <a :href="todayHref" class="agenda-nav-today">Hoy</a>
      <a :href="nextHref" class="agenda-nav-btn" aria-label="Mes siguiente">→</a>
      <span class="agenda-month-label">{{ displayMonthLabel }}</span>
    </template>
    <template v-else>
      <select :value="month" class="agenda-nav-select" aria-label="Mes" @change="updateMonth">
        <option v-for="option in monthOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <select :value="year" class="agenda-nav-select" aria-label="Año" @change="updateYear">
        <option v-for="option in yearOptions" :key="option" :value="option">{{ option }}</option>
      </select>
      <span v-if="loading" class="agenda-month-loading">Cargando…</span>
    </template>
  </div>
</template>

<style scoped>
.agenda-nav {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.agenda-nav-btn,
.agenda-nav-today {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  border: none;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 26%, var(--color-rv-navy)),
    color-mix(in srgb, var(--color-accent-2) 26%, var(--color-rv-navy))
  );
  color: #ffffff;
  text-decoration: none;
  font-size: 0.875rem;
  transition: filter 160ms ease;
}

.agenda-nav-btn:hover,
.agenda-nav-today:hover {
  filter: brightness(1.18);
}

.agenda-month-label {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.0625rem;
  color: var(--color-ink);
  text-transform: capitalize;
  margin-left: 0.2rem;
}

.agenda-nav-select {
  padding: 0.35rem 1.6rem 0.35rem 0.6rem;
  border-radius: 8px;
  border: none;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-accent) 26%, var(--color-rv-navy)),
      color-mix(in srgb, var(--color-accent-2) 26%, var(--color-rv-navy))
    ),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 0.45rem center / 0.8rem;
  background-blend-mode: normal;
  color: #ffffff;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: capitalize;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  color-scheme: dark;
}

.agenda-nav-select option {
  background: var(--color-rv-navy);
  color: #ffffff;
}

.agenda-month-loading {
  font-size: 0.8125rem;
  color: var(--color-muted);
}

.agenda-nav.compact .agenda-month-label {
  font-size: 0.9375rem;
}
</style>

<style>
html.light .agenda-nav-btn,
html.light .agenda-nav-today {
  background: var(--color-paper-2);
  border: 1px solid var(--color-rule);
  color: var(--color-ink);
}

html.light .agenda-nav-select {
  background-color: var(--color-paper-2);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2300021f' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.45rem center;
  background-size: 0.8rem;
  border: 1px solid var(--color-rule);
  color: var(--color-ink);
  color-scheme: light;
}

html.light .agenda-nav-select option {
  background: var(--color-paper);
  color: var(--color-ink);
}

html.light .agenda-nav-btn:hover,
html.light .agenda-nav-today:hover {
  filter: none;
  border-color: var(--color-accent);
  color: var(--color-accent);
}
</style>
