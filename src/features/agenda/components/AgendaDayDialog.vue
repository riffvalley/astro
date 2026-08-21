<script setup lang="ts">
import { ref, watch } from 'vue';

import type { CalendarEventGroup } from '../utils/eventDerivations';
import { flagSlugsFor } from '../utils/flagSlugs';
import type { CalendarEvent } from '../model/agenda.types';

const props = defineProps<{
  selectedDay: string | null;
  dayGroups: CalendarEventGroup[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const dayDialog = ref<HTMLDialogElement | null>(null);

// La Island decide qué día está seleccionado (y por tanto si el diálogo debe
// estar abierto); este watcher solo traduce esa decisión a las llamadas
// nativas showModal()/close(), preservando el mismo guard contra reabrir un
// <dialog> ya abierto que tenía selectDay() antes de la extracción.
watch(
  () => props.selectedDay,
  day => {
    if (day) {
      if (!dayDialog.value?.open) dayDialog.value?.showModal();
    } else {
      dayDialog.value?.close();
    }
  }
);

function closeDayDialog() {
  dayDialog.value?.close();
}

function onDayDialogClose() {
  emit('close');
}

function onDayDialogClick(e: MouseEvent) {
  if (e.target === dayDialog.value) closeDayDialog();
}

function formatSelectedDay(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatEventTime(ev: CalendarEvent): string | null {
  if (ev.allDay) return null;
  const d = new Date(ev.start);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
</script>

<template>
  <dialog ref="dayDialog" class="agenda-daypanel" @close="onDayDialogClose" @click="onDayDialogClick">
    <div class="agenda-daypanel-inner">
      <div class="agenda-daypanel-head">
        <h3>{{ selectedDay ? formatSelectedDay(selectedDay) : '' }}</h3>
        <button type="button" class="agenda-daypanel-close" @click="closeDayDialog" aria-label="Cerrar">×</button>
      </div>

      <p v-if="!dayGroups.length" class="agenda-daypanel-empty">No hay conciertos este día con los filtros actuales.</p>

      <div v-else class="agenda-day-groups">
        <div v-for="group in dayGroups" :key="group.calendarName" class="agenda-day-group">
          <div class="agenda-day-group-head">
            <img v-for="slug in flagSlugsFor(group.calendarName)" :key="slug" :src="`/flags/${slug}.svg`" alt="" class="agenda-day-group-flag" />
            <h4>{{ group.calendarName }}</h4>
          </div>

          <ul class="agenda-daypanel-list">
            <li v-for="ev in group.events" :key="ev.id" class="agenda-event-card">
              <a :href="ev.htmlLink" target="_blank" rel="noopener" class="agenda-event-title">
                {{ ev.title }}
                <svg class="agenda-event-link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>

              <div class="agenda-event-meta-row">
                <span class="agenda-event-meta-item" v-if="formatEventTime(ev)">
                  <svg class="agenda-event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {{ formatEventTime(ev) }}
                </span>
                <span class="agenda-event-meta-item" v-if="ev.location">
                  <svg class="agenda-event-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {{ ev.location }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
.agenda-daypanel {
  border: none;
  border-radius: 16px;
  padding: 0;
  width: min(96vw, 60rem);
  max-width: 60rem;
  max-height: min(94vh, 68rem);
  margin: auto;
  inset: 0;
  background: var(--color-paper-2);
  color: var(--color-ink);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-accent) transparent;
}

.agenda-daypanel::-webkit-scrollbar {
  width: 10px;
}

.agenda-daypanel::-webkit-scrollbar-track {
  background: transparent;
}

.agenda-daypanel::-webkit-scrollbar-thumb {
  background-color: color-mix(in srgb, var(--color-accent) 55%, transparent);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.agenda-daypanel::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-accent);
  background-clip: padding-box;
}

.agenda-daypanel::backdrop {
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.agenda-daypanel-inner {
  padding: 1.7rem 1.9rem 2rem;
}

.agenda-daypanel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.4rem;
}

.agenda-daypanel-head h3 {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.4375rem;
  color: var(--color-ink);
  margin: 0;
  text-transform: capitalize;
}

.agenda-daypanel-close {
  border: none;
  background: none;
  font-size: 1.7rem;
  line-height: 1;
  color: var(--color-muted);
  cursor: pointer;
  padding: 0 0.2rem;
}

.agenda-daypanel-empty {
  color: var(--color-muted);
  font-size: 0.9375rem;
  margin: 0;
}

.agenda-day-groups {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.agenda-day-group-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.9rem;
}

.agenda-day-group-flag {
  width: 1.75rem;
  height: 1.2rem;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid var(--color-rule);
  flex-shrink: 0;
}

.agenda-day-group-head h4 {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.0625rem;
  color: var(--color-ink);
  margin: 0;
}

.agenda-daypanel-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.agenda-event-card {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  border: 1px solid var(--color-rule);
  border-radius: 12px;
  background: var(--color-paper);
  padding: 1rem 1.1rem;
  transition: border-color 160ms ease, background 160ms ease;
}

.agenda-event-card:has(.agenda-event-title:hover) {
  border-color: var(--color-accent);
}

.agenda-event-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.0625rem;
  color: var(--color-ink);
  text-decoration: none;
  line-height: 1.3;
}

.agenda-event-title:hover {
  color: var(--color-accent);
}

.agenda-event-link-icon {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  opacity: 0.6;
}

.agenda-event-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 1.1rem;
}

.agenda-event-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.875rem;
  color: var(--color-ink-2);
}

.agenda-event-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-accent);
}
</style>
