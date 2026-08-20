<script setup lang="ts">
import type { CalendarEvent } from '../model/agenda.types';
import type { CalendarGridDay } from '../utils/calendarGrid';

const props = withDefaults(
  defineProps<{
    weeks: CalendarGridDay[][];
    eventsByDay: ReadonlyMap<string, CalendarEvent[]>;
    selectedDay: string | null;
    maxDayCount: number;
    compact?: boolean;
  }>(),
  { compact: false }
);

const emit = defineEmits<{
  selectDay: [key: string];
}>();

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function eventCount(key: string): number {
  return props.eventsByDay.get(key)?.length ?? 0;
}

function dayHeatStyle(count: number): string {
  const intensity = Math.min(1, count / props.maxDayCount);
  const hue = 232 - intensity * 232;
  return `--intensity:${intensity}; background:hsl(${hue.toFixed(1)} 80% 48%); color:#ffffff`;
}
</script>

<template>
  <div class="agenda-grid" :class="{ compact }">
    <div v-for="weekday in weekdayLabels" :key="weekday" class="agenda-weekday">{{ weekday }}</div>

    <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
      <button
        v-for="day in week"
        :key="day.key"
        type="button"
        class="agenda-day"
        :class="{ 'is-out': !day.inMonth, 'is-today': day.isToday, 'is-selected': selectedDay === day.key }"
        @click="emit('selectDay', day.key)"
      >
        <span class="agenda-day-num">{{ day.day }}</span>
        <span v-if="eventCount(day.key)" class="agenda-day-count" :style="dayHeatStyle(eventCount(day.key))">
          {{ eventCount(day.key) }}
          <span class="agenda-day-count-label">{{ eventCount(day.key) === 1 ? 'concierto' : 'conciertos' }}</span>
        </span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.agenda-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  border: 1px solid var(--color-rule);
  border-radius: 14px;
  overflow: hidden;
  padding: 3px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-accent) 26%, var(--color-rv-navy)),
    color-mix(in srgb, var(--color-accent-2) 26%, var(--color-rv-navy))
  );
}

.agenda-weekday {
  text-align: center;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.82);
  padding: 0.4rem 0;
  background: transparent;
}

.agenda-day {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.3rem;
  min-height: 5.5rem;
  padding: 0.4rem;
  border: none;
  background: color-mix(in srgb, var(--color-rv-navy) 42%, transparent);
  color: #ffffff;
  cursor: pointer;
  transition: background 160ms ease;
  font-family: inherit;
}

.agenda-day:hover {
  background: color-mix(in srgb, var(--color-rv-navy) 24%, transparent);
}

.agenda-day.is-out {
  color: rgba(255, 255, 255, 0.45);
  background: color-mix(in srgb, var(--color-rv-navy) 68%, transparent);
}

.agenda-day.is-today .agenda-day-num {
  color: #ffffff;
  background: var(--color-accent);
  border-radius: 50%;
}

.agenda-day.is-selected {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.agenda-day-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.agenda-day-count {
  --intensity: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: calc(0.75rem + var(--intensity) * 0.1875rem);
  transition: background 200ms ease, color 200ms ease;
}

.agenda-day-count-label {
  font-family: inherit;
  font-weight: 600;
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  opacity: 0.85;
}

.agenda-grid.compact .agenda-weekday {
  padding: 0.25rem 0;
  font-size: 0.625rem;
}

.agenda-grid.compact .agenda-day {
  min-height: 3.75rem;
  padding: 0.3rem;
  gap: 0.2rem;
}

.agenda-grid.compact .agenda-day-num {
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.75rem;
}

.agenda-grid.compact .agenda-day-count {
  padding: 0.1rem 0.4rem;
  font-size: calc(0.6875rem + var(--intensity) * 0.125rem);
}

.agenda-grid.compact .agenda-day-count-label {
  display: none;
}

@media (max-width: 40rem) {
  .agenda-day {
    min-height: 3.5rem;
  }

  .agenda-weekday {
    font-size: 0.5625rem;
  }

  .agenda-day-count {
    padding: 0.1rem 0.4rem;
  }

  .agenda-day-count-label {
    display: none;
  }
}
</style>

<style>
html.light .agenda-grid {
  background: var(--color-rule-2);
}

html.light .agenda-weekday {
  color: var(--color-ink-2);
  background: var(--color-paper-3);
}

html.light .agenda-day {
  background: var(--color-paper-2);
  color: var(--color-ink);
}

html.light .agenda-day:hover {
  background: var(--color-paper-3);
}

html.light .agenda-day.is-out {
  color: var(--color-muted);
  background: var(--color-paper);
}
</style>
