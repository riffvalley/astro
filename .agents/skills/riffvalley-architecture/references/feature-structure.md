# Estructura evolutiva de features

## Empieza pequeña

No apliques Clean Architecture de forma ceremonial. Una feature pequeña usa sólo las carpetas que necesita:

```text
features/national-releases/
├── components/
│   ├── NationalReleasesIsland.vue
│   └── ProposalForm.vue
├── api/
│   └── riff-valley.ts
├── model/
│   └── national-release.ts
└── index.ts
```

La carpeta `model/` puede contener tipos de negocio, mapeos sencillos y funciones puras del dominio. `api/` contiene el proveedor, sus DTOs privados y la normalización de respuestas. `components/` se limita a presentar e interactuar con modelos de la feature.

Una feature que no necesita API, modelo ni API pública no debe crear directorios vacíos. Por ejemplo, un bloque editorial muy local podría comenzar en `features/editorial/components/`.

## Sólo crece si la complejidad lo pide

Evoluciona hacia esta forma únicamente si existen reglas complejas, varios casos de uso, varios proveedores o una frontera de infraestructura significativa:

```text
features/agenda/
├── domain/           # reglas puras y modelos sin Astro/Vue
├── application/      # casos de uso que orquestan reglas y puertos
├── infrastructure/   # Google Calendar, mapa, HTTP, DTOs
├── components/       # Astro/Vue y view models
├── composables/      # estado/interacción Vue específico de agenda
└── index.ts
```

No es obligatorio migrar las features pequeñas a esta forma. Si el adaptador y una transformación corta son comprensibles en `api/`, mantén `api/` y `model/`.

## Ejemplos de transición, sin aplicar ahora

### Agenda: infraestructura y UI hoy separadas por tipo técnico

**Antes (actual):**

```text
src/
├── components/
│   ├── GoogleCalendarSubscribe.astro
│   └── vue/AgendaCalendarIsland.vue
├── lib/
│   ├── agendaCalendars.ts
│   ├── googleCalendar.ts
│   └── spainMap.ts
└── pages/
    ├── agenda-conciertos.astro
    └── api/agenda-resumen.json.ts
```

**Después (cuando una tarea de agenda lo justifique):**

```text
src/
├── features/agenda/
│   ├── components/
│   │   ├── AgendaCalendarIsland.vue
│   │   └── GoogleCalendarSubscribe.astro
│   ├── api/google-calendar.ts
│   ├── model/{calendar.ts,event.ts,spain-map.ts}
│   └── index.ts
└── pages/
    ├── agenda-conciertos.astro
    └── api/agenda-resumen.json.ts
```

La ruta conserva `prerender = false` y el endpoint su borde HTTP; sólo importan la API pública de `agenda`. La key de Google permanece en servidor.

### Lanzamientos: dos dominios cercanos pero distintos

**Antes (actual):** `GuiaLanzamientosIsland.vue`, `NovedadesNacionalesIsland.vue`, filas, modal, formato, `discs.ts` y `nationalReleases.ts` están repartidos entre `components/vue` y `lib`.

**Después (cuando se toque cada dominio):**

```text
features/
├── releases/
│   ├── components/{GuiaLanzamientosIsland,DiscRow,DiscModal}.vue
│   ├── api/riff-valley.ts
│   └── model/{release.ts,format.ts}
└── national-releases/
    ├── components/{NovedadesNacionalesIsland,NationalRow,ProposalForm}.vue
    ├── api/riff-valley.ts
    └── model/{national-release.ts,format.ts}
```

`MonthYearPicker`, `ReleaseGroup`, `Badge`, `ColorPill`, `SpotifyButton` o `PlatformLinkButton` sólo pasarán a `shared/ui` después de confirmar una API común sin terminología de releases. Compartir una carpeta no obliga a compartir una abstracción.

### Editorial: no propagar WPGraphQL a la UI

**Antes (actual):** `src/lib/wordpress.ts` acumula cliente HTTPS/GraphQL, cache, DTOs, normalización, reglas de reviews, redactores y configuración de reels; páginas y componentes importan directamente sus tipos y funciones.

**Después (incremental, no obligatorio de una vez):**

```text
features/editorial/
├── api/wordpress.ts          # WPGraphQL, DTOs y cache de proveedor
├── model/{post.ts,category.ts,page.ts}
├── components/{PostCard,PostsGallery,CategoryRail}.astro
├── services/{reviews.ts,highlighted-bands.ts}
└── index.ts

features/redactores/
├── api/{wordpress-profile.ts,instagram-reels.ts}
├── model/redactor.ts
├── components/RedactoresGrid.astro
└── index.ts
```

Extraer `redactores` de `editorial` sólo tiene sentido si su evolución y fuentes (WordPress + backend/Instagram) justifican ese límite. En ambos casos, los componentes reciben modelos normalizados, no nodos de WPGraphQL.
