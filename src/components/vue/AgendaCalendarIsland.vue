<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';

import AgendaCalendarGrid from '../../features/agenda/components/AgendaCalendarGrid.vue';
import AgendaCalendarToolbar from '../../features/agenda/components/AgendaCalendarToolbar.vue';
import AgendaDayDialog from '../../features/agenda/components/AgendaDayDialog.vue';
import AgendaFilterDialog from '../../features/agenda/components/AgendaFilterDialog.vue';
import type {
  CalendarEvent,
  RegionCalendar,
  SpainMap,
} from '../../features/agenda/model/agenda.types';
import { fetchAgendaMap } from '../../features/agenda/api/agendaClient';
import { useAgendaMonthEvents } from '../../features/agenda/composables/useAgendaMonthEvents';
import { buildCalendarGrid } from '../../features/agenda/utils/calendarGrid';
import {
  filterEventsByCalendarNames,
  groupEventsByCalendar,
} from '../../features/agenda/utils/eventDerivations';
import { eventDateKey } from '../../features/agenda/utils/eventDateKey';
import { groupEventsByDay } from '../../features/agenda/utils/eventGrouping';

const props = withDefaults(
  defineProps<{
    events: CalendarEvent[];
    calendars: RegionCalendar[];
    year: number;
    month: number; // 1-12
    prevHref?: string;
    nextHref?: string;
    todayHref?: string;
    spainMap: SpainMap;
    /** 'links' (por defecto, /agenda-conciertos: navegación por URL, SSR) o
     * 'selects' (embebido en la home: selects de mes/año, sin recarga). */
    navigation?: 'links' | 'selects';
    /** Si es true, el propio componente pide sus datos (eventos + mapa) por
     * fetch al montarse y al cambiar de mes/año, en vez de recibirlos ya
     * calculados por props desde el servidor. */
    fetchClient?: boolean;
    /** Versión reducida (celdas, tipografía y espaciados más pequeños) para
     * el widget embebido en la home — el mapa y los diálogos no cambian. */
    compact?: boolean;
  }>(),
  { navigation: 'links', fetchClient: false, compact: false }
);

const checked = ref(new Set(props.calendars.map(c => c.name)));
const selectedDay = ref<string | null>(null);

const currentYear = ref(props.year);
const currentMonth = ref(props.month);
const currentSpainMap = ref<SpainMap>(props.spainMap);
const {
  events: currentEvents,
  loading: loadingEvents,
  loadMonth,
} = useAgendaMonthEvents(props.events);

if (props.fetchClient) {
  onMounted(async () => {
    // Si ya llegaron datos reales por props (SSR, /agenda-conciertos) no
    // hace falta repetir el fetch nada más montar — solo en la home, que
    // arranca con placeholders vacíos porque la portada sigue siendo
    // estática y no puede llamar a la API de Google en el servidor.
    if (props.spainMap.shapes.length === 0) {
      fetchAgendaMap()
        .then(m => { currentSpainMap.value = m; })
        .catch(() => {});
    }
    if (props.events.length === 0) {
      await loadMonth({ year: currentYear.value, month: currentMonth.value });
    }
  });

  watch([currentYear, currentMonth], ([year, month]) => loadMonth({ year, month }));
}

function toggleCalendar(name: string) {
  const next = new Set(checked.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  checked.value = next;
}

function setAllChecked(value: boolean) {
  checked.value = value ? new Set(props.calendars.map(c => c.name)) : new Set();
}

const visibleEvents = computed(() => filterEventsByCalendarNames(currentEvents.value, checked.value));

const eventsByDay = computed(() => groupEventsByDay(visibleEvents.value));

// Días con más conciertos pintan más intenso (estilo mapa de calor) para que
// el mes no se vea todo con el mismo tono de rosa — el color transmite algo.
const maxDayCount = computed(() => Math.max(1, ...Array.from(eventsByDay.value.values(), (evs) => evs.length)));

// Grid de 6 semanas (42 días) empezando en lunes, cubriendo el mes con
// margen de los meses adyacentes para completar semanas.
const weeks = computed(() =>
  buildCalendarGrid(currentYear.value, currentMonth.value, eventDateKey(new Date().toISOString()))
);

const selectedDayEvents = computed(() => (selectedDay.value ? eventsByDay.value.get(selectedDay.value) ?? [] : []));

// Agrupados por comunidad, en el mismo orden que el listado de filtros — así
// no hace falta repetir el nombre de la comunidad en cada evento.
const selectedDayGroups = computed(() => groupEventsByCalendar(selectedDayEvents.value, props.calendars));

function selectDay(key: string) {
  selectedDay.value = selectedDay.value === key ? null : key;
}

function closeDayDialog() {
  selectedDay.value = null;
}
</script>

<template>
  <div class="agenda" :class="{ compact }">
    <div class="agenda-toolbar">
      <AgendaCalendarToolbar
        :navigation="navigation"
        :prev-href="prevHref"
        :next-href="nextHref"
        :today-href="todayHref"
        :month="currentMonth"
        :year="currentYear"
        :loading="loadingEvents"
        :compact="compact"
        @update-month="currentMonth = $event"
        @update-year="currentYear = $event"
      />

      <AgendaFilterDialog
        :calendars="calendars"
        :checked="checked"
        :events="currentEvents"
        :spain-map="currentSpainMap"
        @toggle-calendar="toggleCalendar"
        @set-all-checked="setAllChecked"
      />
    </div>

    <AgendaCalendarGrid
      :weeks="weeks"
      :events-by-day="eventsByDay"
      :selected-day="selectedDay"
      :max-day-count="maxDayCount"
      :compact="compact"
      @select-day="selectDay"
    />

    <AgendaDayDialog :selected-day="selectedDay" :day-groups="selectedDayGroups" @close="closeDayDialog" />
  </div>
</template>

<style scoped>
.agenda-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

/* Versión compacta (widget de la home) — celdas y tipografía más pequeñas,
   sin llegar al tamaño móvil (ese además oculta el mapa por completo). */
.agenda.compact .agenda-toolbar {
  margin-bottom: 0.75rem;
}

</style>
