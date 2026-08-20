# Reglas de dependencia y encapsulación

## Dirección permitida

```text
pages ──→ app / features / shared
app   ──→ features / shared
features ──→ shared
shared ──→ (nada de app, features o pages)
```

Las flechas indican imports de código. Las rutas pueden coordinar varias features; no conceden a las features acceso inverso a páginas ni layouts.

Nunca permitas:

- `shared → feature`, `shared → app` o `shared → pages`;
- feature A → internals de feature B;
- `domain`/`model` → componentes, Astro o Vue.

Una feature puede depender de la **API pública** de otra sólo cuando exista una relación de producto explícita y sea preferible a componer ambas desde `pages/` o `app/`. En ese caso, importa exclusivamente desde `features/<feature>/index.ts`. No accedas a `components/`, `api/`, `model/` o `infrastructure/` internos de otra feature.

## API pública de una feature

`index.ts` es opcional, pero aporta valor cuando una feature expone más de una pieza, tiene consumidores externos o necesita proteger sus internals. Exporta sólo el contrato que los consumidores necesitan: un componente raíz, una función de consulta, un tipo de modelo o un adaptador.

```text
features/agenda/
├── components/AgendaCalendarIsland.vue
├── api/google-calendar.ts
├── model/event.ts
└── index.ts
```

```ts
// features/agenda/index.ts
export { default as AgendaCalendarIsland } from './components/AgendaCalendarIsland.vue';
export { fetchAgendaEvents } from './api/google-calendar';
export type { AgendaEvent } from './model/event';
```

No añadas `index.ts` a una feature diminuta que sólo se usa de forma local si añade una capa sin proteger nada. Cuando exista, evita los barrels gigantes: no reexportes dependencias de proveedores ni todos los internals.

## Modelo de dominio frente a DTO

Un DTO refleja una API externa y puede cambiar con ella. Pertenece cerca del adaptador que la consume, por ejemplo:

- tipos de respuesta WPGraphQL dentro de `features/editorial/api/wordpress.ts`;
- respuesta de Google Calendar dentro de `features/agenda/api/google-calendar.ts`;
- respuesta HTTP del backend propio dentro de `features/releases/api/riff-valley.ts`.

El modelo representa los conceptos que usa Riff Valley: `EditorialPost`, `AgendaEvent`, `Release`, `NationalRelease`. El adaptador traduce DTO → modelo antes de devolver datos al resto de la feature. Componentes Astro/Vue reciben modelos o view models, nunca DTOs de proveedor.

```ts
// Mal: el componente aprende la forma de WPGraphQL
defineProps<{ post: { featuredImage: { node: { sourceUrl: string } } | null } }>();

// Bien: el adaptador de editorial ya normalizó el dato
defineProps<{ post: { title: string; imageUrl: string | null } }>();
```

La función de mapeo no exige una capa llamada `application`: puede vivir junto al cliente API en una feature pequeña. Crea capas explícitas sólo cuando haya reglas de negocio ricas, varios adaptadores o flujos que las hagan útiles.

## Runtime y dependencias

- Código que usa `node:*`, secretos o `GOOGLE_CALENDAR_API_KEY` es sólo de servidor. Una isla Vue no debe importarlo.
- Código de una isla se empaqueta para navegador: sólo puede depender de contratos y clientes seguros para cliente. `HOST_API` está expuesto deliberadamente en Vite; otras variables no.
- El endpoint SSR de `src/pages/api/*.ts` es borde HTTP de Astro. Delega en la feature y limita allí parsing de query, status y headers.
- Las rutas estáticas pueden obtener datos en build; las rutas y endpoints con `prerender = false` pueden obtenerlos bajo demanda. Mantén esa decisión visible en `pages/`.

## Composición frente a negocio

Componer es elegir qué se muestra, en qué orden y con qué APIs públicas: la home ensambla editorial, agenda, redactores y social; `Layout` ofrece shell global.

Es lógica de negocio: calcular/normalizar eventos de agenda, agrupar lanzamientos, mapear respuestas de WordPress, resolver un reel, seleccionar contenido editorial por reglas y validar una propuesta. Esa lógica vive dentro de la feature correspondiente, no en una página o layout.
