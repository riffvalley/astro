# Ejemplos de módulos en Riff Valley

Estos ejemplos reflejan el código actual y describen direcciones posibles. No autorizan una migración ni imponen la estructura completa.

## Agenda

La capacidad reúne calendarios regionales de Google, eventos, mapa, grid, filtros y suscripciones. Hoy está repartida entre `src/lib/agendaCalendars.ts`, `googleCalendar.ts`, `spainMap.ts`, `AgendaCalendarIsland.vue`, `GoogleCalendarSubscribe.astro`, páginas y endpoints. Una evolución posible es:

```text
features/agenda/
├── api/
├── components/
├── composables/
├── model/
├── utils/
└── index.ts
```

`AgendaCalendarIsland.vue` es una señal de responsabilidades que pueden aislarse al tocarlo, no una orden de refactor. La ruta y el endpoint mantienen su papel de bordes Astro; la clave de Google permanece en servidor, conforme a `riffvalley-astro-vue`.

## Releases

La guía global de lanzamientos posee consulta de discos, filtros, agrupación/formato y su interfaz Vue. Hoy se reparte entre `lib/discs.ts`, `lib/releaseFormat.ts` y `GuiaLanzamientosIsland.vue` con sus componentes. Una forma posible:

```text
features/releases/
├── api/
├── components/
├── model/
├── utils/
└── index.ts
```

## National releases

Novedades nacionales incluye consulta y envío de propuestas, datos específicos y UI de listado/formulario. Puede evolucionar como `features/national-releases/`. Manténla independiente de `releases` si sigue siendo una capacidad de negocio distinta, aunque ambas puedan llegar a compartir una pieza genérica validada por uso real.

## Editorial y redactores

Editorial comprende posts, categorías, páginas y WordPress; actualmente `lib/wordpress.ts` mezcla transporte HTTPS, caché, DTOs y normalización. Por sus fuentes y reglas puede justificar, cuando una tarea lo necesite, una forma más profunda:

```text
features/editorial/
├── application/
├── infrastructure/
├── model/
├── components/
└── index.ts
```

No es obligatoria: `api/` y `model/` bastan mientras resulten claros. `redactores` puede separarse si sus perfiles curatoriales y reels (WordPress + backend/Instagram) evolucionan de forma independiente; si no, puede permanecer cerca de editorial.

## Social y search

Los feeds paginados de Instagram y Telegram forman un candidato natural a `social`, con modelos/adaptadores y sus islands. `Search.astro` representa una capacidad de búsqueda editorial; merece su propia feature sólo cuando tenga lógica, datos o evolución que supere un bloque local de composición.

## Candidatos, no decisiones definitivas

- `MonthYearPicker` y quizá una parte de `ReleaseGroup` podrían ser `shared/ui` sólo después de confirmar contratos idénticos entre consumidores.
- `ColorPill`, `Badge`, `PlatformLinkButton` o `SearchableCombobox` requieren la misma comprobación: pueden contener semántica de lanzamientos y, por tanto, seguir locales.
- `apiBase.ts` podría ser infraestructura transversal si varios dominios comparten un contrato de backend estable; no justifica por sí solo mover todo cliente de datos a `shared`.

No extraigas ninguno de estos elementos sin una tarea que lo autorice y la evidencia de reutilización requerida.
