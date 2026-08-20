<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';

import { buildCalendarGrid } from '../../features/agenda/utils/calendarGrid';

interface RegionCalendar {
  name: string;
  id: string;
  color: string;
}

interface MapShape {
  id: string;
  calendarName: string;
  d: string;
}

interface SpainMap {
  width: number;
  height: number;
  shapes: MapShape[];
  compositionBorder: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  htmlLink: string;
  calendarName: string;
  calendarColor: string;
}

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
const filtersOpen = ref(false);
const filtersDialog = ref<HTMLDialogElement | null>(null);
const selectedDay = ref<string | null>(null);

const currentYear = ref(props.year);
const currentMonth = ref(props.month);
const currentEvents = ref<CalendarEvent[]>(props.events);
const currentSpainMap = ref<SpainMap>(props.spainMap);
const loadingEvents = ref(false);

const displayMonthLabel = computed(() =>
  new Date(currentYear.value, currentMonth.value - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
);

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

async function fetchMonthEvents() {
  loadingEvents.value = true;
  try {
    const res = await fetch(`/api/agenda-resumen.json?year=${currentYear.value}&month=${currentMonth.value}`);
    const data = await res.json();
    currentEvents.value = data.events ?? [];
  } catch {
    currentEvents.value = [];
  } finally {
    loadingEvents.value = false;
  }
}

if (props.fetchClient) {
  onMounted(async () => {
    // Si ya llegaron datos reales por props (SSR, /agenda-conciertos) no
    // hace falta repetir el fetch nada más montar — solo en la home, que
    // arranca con placeholders vacíos porque la portada sigue siendo
    // estática y no puede llamar a la API de Google en el servidor.
    if (props.spainMap.shapes.length === 0) {
      fetch('/api/spain-map.json')
        .then(r => r.json())
        .then(m => { currentSpainMap.value = m; })
        .catch(() => {});
    }
    if (props.events.length === 0) {
      await fetchMonthEvents();
    }
  });

  watch([currentYear, currentMonth], fetchMonthEvents);
}

const calendarByName = computed(() => new Map(props.calendars.map(c => [c.name, c])));

// Número de conciertos del mes cargado por comunidad, para el listado de
// filtros — sin tener en cuenta qué está marcado, es el total real.
const eventCountByCalendarName = computed(() => {
  const counts = new Map<string, number>();
  for (const ev of currentEvents.value) {
    counts.set(ev.calendarName, (counts.get(ev.calendarName) ?? 0) + 1);
  }
  return counts;
});

// Banderas oficiales (Wikimedia Commons, dominio público / uso libre como
// símbolo oficial), servidas como estáticos desde /public/flags.
const flagSlugByCalendarName: Record<string, string> = {
  'Andalucía': 'andalucia',
  'Aragón': 'aragon',
  'Asturias': 'asturias',
  'Cantabria': 'cantabria',
  'Castilla y León': 'castilla-y-leon',
  'Castilla-La Mancha': 'castilla-la-mancha',
  'Catalunya': 'catalunya',
  'Comunidad Valenciana': 'comunidad-valenciana',
  'Extremadura': 'extremadura',
  'Galicia': 'galicia',
  'Islas Baleares': 'islas-baleares',
  'Islas Canarias': 'islas-canarias',
  'La Rioja': 'la-rioja',
  'Madrid': 'madrid',
  'Murcia': 'murcia',
  'Navarra': 'navarra',
  'País Vasco': 'pais-vasco',
  'Portugal': 'portugal',
};

function flagSlugsFor(calendarName: string): string[] {
  if (calendarName === 'Ceuta y Melilla') return ['ceuta', 'melilla'];
  const slug = flagSlugByCalendarName[calendarName];
  return slug ? [slug] : [];
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

function eventDateKey(iso: string): string {
  // Para eventos de día completo, "iso" ya es YYYY-MM-DD. Para eventos con
  // hora, se usa la fecha local del navegador que ve la página.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const visibleEvents = computed(() => currentEvents.value.filter(e => checked.value.has(e.calendarName)));

const eventsByDay = computed(() => {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of visibleEvents.value) {
    const key = eventDateKey(ev.start);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return map;
});

// Días con más conciertos pintan más intenso (estilo mapa de calor) para que
// el mes no se vea todo con el mismo tono de rosa — el color transmite algo.
const maxDayCount = computed(() => Math.max(1, ...Array.from(eventsByDay.value.values(), (evs) => evs.length)));

function dayIntensity(count: number): number {
  return Math.min(1, count / maxDayCount.value);
}

// Mapa de calor real (azul -> cian/verde -> amarillo -> rojo), no una escala
// de un solo tono — el matiz (hue) recorre el espectro según la intensidad.
// Letra siempre blanca dentro del pill, independientemente del tono.
function dayHeatStyle(count: number): string {
  const intensity = dayIntensity(count);
  const hue = 232 - intensity * 232; // 232 azul -> 0 rojo
  const saturation = 80;
  const lightness = 48;
  return `--intensity:${intensity}; background:hsl(${hue.toFixed(1)} ${saturation}% ${lightness}%); color:#ffffff`;
}

// Grid de 6 semanas (42 días) empezando en lunes, cubriendo el mes con
// margen de los meses adyacentes para completar semanas.
const weeks = computed(() =>
  buildCalendarGrid(currentYear.value, currentMonth.value, eventDateKey(new Date().toISOString()))
);

const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const selectedDayEvents = computed(() => (selectedDay.value ? eventsByDay.value.get(selectedDay.value) ?? [] : []));

// Agrupados por comunidad, en el mismo orden que el listado de filtros — así
// no hace falta repetir el nombre de la comunidad en cada evento.
const selectedDayGroups = computed(() => {
  const byRegion = new Map<string, CalendarEvent[]>();
  for (const ev of selectedDayEvents.value) {
    if (!byRegion.has(ev.calendarName)) byRegion.set(ev.calendarName, []);
    byRegion.get(ev.calendarName)!.push(ev);
  }
  return props.calendars
    .filter(c => byRegion.has(c.name))
    .map(c => ({ calendarName: c.name, events: byRegion.get(c.name)! }));
});

const dayDialog = ref<HTMLDialogElement | null>(null);

function selectDay(key: string) {
  const willOpen = selectedDay.value !== key;
  selectedDay.value = willOpen ? key : null;
  if (willOpen) {
    if (!dayDialog.value?.open) dayDialog.value?.showModal();
  } else {
    dayDialog.value?.close();
  }
}

function closeDayDialog() {
  dayDialog.value?.close();
}

function onDayDialogClose() {
  selectedDay.value = null;
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
  <div class="agenda" :class="{ compact }">
    <div class="agenda-toolbar">
      <div class="agenda-nav">
        <template v-if="navigation === 'links'">
          <a :href="prevHref" class="agenda-nav-btn" aria-label="Mes anterior">←</a>
          <a :href="todayHref" class="agenda-nav-today">Hoy</a>
          <a :href="nextHref" class="agenda-nav-btn" aria-label="Mes siguiente">→</a>
          <span class="agenda-month-label">{{ displayMonthLabel }}</span>
        </template>
        <template v-else>
          <select v-model.number="currentMonth" class="agenda-nav-select" aria-label="Mes">
            <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
          <select v-model.number="currentYear" class="agenda-nav-select" aria-label="Año">
            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
          </select>
          <span v-if="loadingEvents" class="agenda-month-loading">Cargando…</span>
        </template>
      </div>

      <button type="button" class="cal-filters-toggle" :aria-expanded="filtersOpen" @click="openFilters">
        <span class="cal-filters-icon" :class="{ open: filtersOpen }" aria-hidden="true">+</span> Filtros
      </button>
    </div>

    <dialog ref="filtersDialog" class="cal-filters-dialog" @close="onFiltersDialogClose" @click="onFiltersDialogClick">
      <div class="cal-filters-dialog-inner">
        <div class="cal-filters-dialog-head">
          <h2>Filtrar por comunidad</h2>
          <div class="cal-filters-dialog-head-right">
            <div class="cal-filters-bulk">
              <button type="button" class="cal-filters-bulk-btn" @click="setAllChecked(true)">Marcar todos</button>
              <span class="cal-filters-bulk-sep" aria-hidden="true">·</span>
              <button type="button" class="cal-filters-bulk-btn" @click="setAllChecked(false)">Desactivar todos</button>
            </div>
            <button type="button" class="cal-filters-dialog-close" @click="closeFilters" aria-label="Cerrar">×</button>
          </div>
        </div>

        <div class="cal-filters-dialog-body">
          <div class="cal-map-card">
            <svg :viewBox="`0 0 ${currentSpainMap.width} ${currentSpainMap.height}`" class="cal-map" role="img" aria-label="Mapa de comunidades autónomas de España, Portugal, Ceuta y Melilla">
              <path
                v-for="shape in currentSpainMap.shapes"
                :key="shape.id"
                :d="shape.d"
                class="cal-map-region"
                :class="{ 'is-active': checked.has(shape.calendarName) }"
                :style="`--region-color:${calendarByName.get(shape.calendarName)?.color ?? '#999'}`"
                @click="toggleCalendar(shape.calendarName)"
              ><title>{{ shape.calendarName }}</title></path>

              <path :d="currentSpainMap.compositionBorder" class="cal-map-composition-border" />
            </svg>
          </div>

          <div class="cal-filters-list">
            <div class="cal-filters-grid">
              <label v-for="cal in calendars" :key="cal.id" class="cal-filter-item" :style="`--cal-color:${cal.color}`">
                <input type="checkbox" class="cal-filter-checkbox" :checked="checked.has(cal.name)" @change="toggleCalendar(cal.name)" />
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

    <div class="agenda-grid">
      <div class="agenda-weekday" v-for="wd in weekdayLabels" :key="wd">{{ wd }}</div>

      <template v-for="(week, wi) in weeks" :key="wi">
        <button
          v-for="day in week"
          :key="day.key"
          type="button"
          class="agenda-day"
          :class="{ 'is-out': !day.inMonth, 'is-today': day.isToday, 'is-selected': selectedDay === day.key }"
          @click="selectDay(day.key)"
        >
          <span class="agenda-day-num">{{ day.day }}</span>
          <span
            v-if="eventsByDay.get(day.key)?.length"
            class="agenda-day-count"
            :style="dayHeatStyle(eventsByDay.get(day.key)?.length ?? 0)"
          >
            {{ eventsByDay.get(day.key)?.length }}
            <span class="agenda-day-count-label">{{ (eventsByDay.get(day.key)?.length ?? 0) === 1 ? 'concierto' : 'conciertos' }}</span>
          </span>
        </button>
      </template>
    </div>

    <dialog ref="dayDialog" class="agenda-daypanel" @close="onDayDialogClose" @click="onDayDialogClick">
      <div class="agenda-daypanel-inner">
        <div class="agenda-daypanel-head">
          <h3>{{ selectedDay ? formatSelectedDay(selectedDay) : '' }}</h3>
          <button type="button" class="agenda-daypanel-close" @click="closeDayDialog" aria-label="Cerrar">×</button>
        </div>

        <p v-if="!selectedDayEvents.length" class="agenda-daypanel-empty">No hay conciertos este día con los filtros actuales.</p>

        <div v-else class="agenda-day-groups">
          <div v-for="group in selectedDayGroups" :key="group.calendarName" class="agenda-day-group">
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
  /* Mismo degradado que la cabecera del calendario (colores del header). */
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
  /* Mismo degradado que la cabecera del calendario (colores del header). */
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
  /* El navegador pinta el desplegable nativo (la lista de opciones) según
     esta propiedad, no según el CSS del <select> — sin esto sale con fondo
     blanco aunque el propio control esté en modo oscuro. */
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

.agenda-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
  border: 1px solid var(--color-rule);
  border-radius: 14px;
  overflow: hidden;
  padding: 3px;
  /* Mismos colores que el header (rosa/malva sobre azul noche), pero suaves
     — un lavado sutil, no un degradado saturado. Anclado a --color-rv-navy
     (no a --color-paper) para que se vea igual en claro y en oscuro, igual
     que la cabecera de la web no cambia con el toggle de tema. */
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
  /* Mapa de calor real: el matiz recorre azul -> verde/amarillo -> rojo
     según la intensidad (ver dayHeatStyle), no un único tono más o menos
     opaco — así el mes no se ve monocromático. */
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

/* Versión compacta (widget de la home) — celdas y tipografía más pequeñas,
   sin llegar al tamaño móvil (ese además oculta el mapa por completo). */
.agenda.compact .agenda-toolbar {
  margin-bottom: 0.75rem;
}

.agenda.compact .agenda-month-label {
  font-size: 0.9375rem;
}

.agenda.compact .agenda-weekday {
  padding: 0.25rem 0;
  font-size: 0.625rem;
}

.agenda.compact .agenda-day {
  min-height: 3.75rem;
  padding: 0.3rem;
  gap: 0.2rem;
}

.agenda.compact .agenda-day-num {
  width: 1.25rem;
  height: 1.25rem;
  font-size: 0.75rem;
}

.agenda.compact .agenda-day-count {
  padding: 0.1rem 0.4rem;
  font-size: calc(0.6875rem + var(--intensity) * 0.125rem);
}

.agenda.compact .agenda-day-count-label {
  display: none;
}

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
/* Regla global (no scoped): el selector :global() de Vue no compone bien
   con un combinador de descendiente + pseudo-elemento en <style scoped>. */
html.light .cal-map-card::before {
  display: none;
}

/* El degradado con los colores del header queda bien en modo oscuro, pero
   en modo claro se ve demasiado "de marca" sobre una página blanca — aquí
   se sustituye por una superficie neutra (como el resto de tarjetas del
   sitio), sin tinte de color, sólo un gris algo más oscuro que la página. */
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

html.light .agenda-nav-btn,
html.light .agenda-nav-today,
html.light .cal-filters-toggle {
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
html.light .agenda-nav-today:hover,
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
