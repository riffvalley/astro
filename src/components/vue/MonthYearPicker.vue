<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  month: number; // 0-indexado
  year: number;
  startYear: number;
}>();

const emit = defineEmits<{
  (e: 'update:month', value: number): void;
  (e: 'update:year', value: number): void;
}>();

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Sin datos futuros más allá del año en curso — no tiene sentido ofrecer
// 2027 en adelante cuando la fuente solo cubre hasta el año actual.
const years = computed(() => {
  const maxYear = new Date().getFullYear();
  const list: number[] = [];
  for (let y = props.startYear; y <= maxYear; y++) list.push(y);
  return list;
});

function onMonthChange(e: Event) {
  emit('update:month', Number((e.target as HTMLSelectElement).value));
}

function onYearChange(e: Event) {
  emit('update:year', Number((e.target as HTMLSelectElement).value));
}
</script>

<template>
  <div class="month-nav">
    <label for="month-select" class="sr-only">Mes</label>
    <select id="month-select" class="month-select" :value="month" @change="onMonthChange">
      <option v-for="(name, i) in MONTH_NAMES" :key="i" :value="i">{{ name }}</option>
    </select>
    <label for="year-select" class="sr-only">Año</label>
    <select id="year-select" class="month-select" :value="year" @change="onYearChange">
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>
  </div>
</template>

<style scoped>
.month-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-bottom: var(--space-xl, 2.5rem);
}

.month-select {
  appearance: none;
  padding: 0.6rem 2.1rem 0.6rem 1rem;
  border-radius: 9999px;
  border: 1px solid var(--color-rule);
  background:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3E%3C/svg%3E")
    no-repeat right 0.75rem center / 16px 16px,
    var(--color-paper-2);
  color: var(--color-ink);
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: border-color 120ms var(--ease-out, ease), background-color 120ms var(--ease-out, ease);
}

.month-select:hover { border-color: var(--color-accent); }
.month-select:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
</style>
