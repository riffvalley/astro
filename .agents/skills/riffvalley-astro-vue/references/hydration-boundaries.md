# Fronteras de hidratación y tamaño de las islands

## Patrón de frontera

```text
Astro page
    ↓
Astro feature/component: estructura, contenido y datos de servidor
    ↓
Vue island: inicio del estado e interacción compartidos
    ↓
Vue children: representación y comportamiento de esa misma interacción
```

La frontera debe ser lo menor posible sin romper una interacción cohesionada. HTML que nunca lee ni modifica el estado Vue permanece en Astro. Los elementos que necesitan coordinar filtros, selección, foco, diálogo o datos cargados comparten una única isla cuando esa coordinación es real.

Evita ambos extremos:

- una island que hidrata un subárbol enorme de contenido que podría ser HTML estático;
- diez micro-islands que intercambian estado, eventos o duplican peticiones para reconstruir una sola experiencia.

## Datos de Astro a Vue

Pasa props sólo desde la composición Astro al componente raíz de Vue. Deben ser:

- serializables;
- modelos o view models de la feature, no DTOs innecesarios del proveedor;
- configuración estrictamente necesaria para esa interacción;
- snapshots iniciales que mejoren la carga cuando el cliente debe partir de datos del servidor.

No pases funciones, clases, objetos enormes, clientes de infraestructura, secretos o estructuras completas que la UI no utiliza. Normaliza los datos cerca del adaptador de la feature, conforme a `riffvalley-architecture`; la isla recibe la forma que presenta.

Para una island que refresca datos, separa con claridad `initialData` de su cliente de refresh. No mantengas dos estados que pretendan ser autoritativos sin una regla de sincronización.

## Islands que crecen

No uses un umbral de líneas. Revisa una island cuando reúne varias responsabilidades independientes: fetching, transformación, lógica de fechas, navegación, filtros, varios diálogos, múltiples bloques visuales y coordinación compleja de estado.

`AgendaCalendarIsland.vue` es el ejemplo actual de una island que ya delegó su complejidad en vez de concentrarla: la carga de eventos vive en el composable `useAgendaMonthEvents`, el grid y las agrupaciones en funciones puras (`utils/calendarGrid.ts`, `utils/eventGrouping.ts`, `utils/eventDerivations.ts`), y la presentación en componentes hijos (`AgendaCalendarGrid`, `AgendaCalendarToolbar`, `AgendaDayDialog`, `AgendaFilterDialog`). La propia island queda como coordinadora — sigue siendo la señal a revisar primero cuando una nueva responsabilidad quiera entrar ahí, no una orden de seguir extrayendo.

Extracciones posibles, sólo cuando reducen complejidad real:

- un composable para estado reactivo cohesivo, del estilo de `useAgendaMonthEvents`;
- componentes hijos para bloques visuales que reciben props y emiten eventos claros;
- un adaptador API para fetch y normalización;
- `model/types` y funciones puras para transformaciones, fechas y agrupaciones.

## Cuándo crear un composable

Crea un composable cuando representa una unidad coherente de estado reactivo reutilizable, o cuando su complejidad ya oculta la responsabilidad principal del componente. Debe tener una API explícita y pertenecer a la feature salvo reutilización probada.

No crees un composable para desplazar cinco líneas, para ocultar una única llamada local o por cumplir una convención. Si el estado se usa en un solo componente y es corto, mantenerlo local es preferible.

## Scripts imperativos de Astro

Un script de Astro puede ser mejor que Vue para una interacción pequeña y aislada. Reevalúalo si acumula lifecycle, estado complejo, varios elementos coordinados o lógica reutilizable; en ese punto, Vue puede ofrecer una frontera más mantenible. La decisión no consiste en eliminar todos los scripts ni en convertirlos todos a componentes Vue.
