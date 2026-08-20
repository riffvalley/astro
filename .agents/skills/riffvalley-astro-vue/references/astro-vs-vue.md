# Decidir entre Astro y Vue

## Regla de partida

El HTML editorial y la composición de Riff Valley se renderizan con Astro. Vue es una isla interactiva dentro de esa composición, no el marco por defecto de una ruta ni un sustituto de componentes Astro.

El proyecto usa Astro 6 estático (`output: 'static'`) con `@astrojs/netlify` para las rutas y endpoints bajo demanda que lo necesitan. Vue 3 está integrado mediante `@astrojs/vue`; no implica que el contenido deba hidratarse.

## Elige Astro cuando

Usa Astro preferentemente para:

- contenido editorial de WordPress y páginas prerenderizadas;
- layouts, navegación, footer y shell global;
- composición de rutas y elección de qué feature se presenta;
- HTML, estilos y componentes presentacionales sin estado interactivo de cliente;
- datos ya disponibles durante build, SSR o frontmatter;
- SSR que devuelve HTML y no necesita continuar en el navegador.

En el código actual, `Layout.astro`, `Header.astro`, `Footer.astro`, `PostCard.astro`, `PostsGallery.astro`, `CategoryRail.astro`, `LatestGrid.astro`, `ReviewsRail.astro` y las rutas editoriales son ejemplos naturales. Tener props, CSS extenso, imports de tipos o una consulta de servidor no justifica Vue.

Un `<script>` pequeño dentro de un `.astro` también es válido cuando resuelve una interacción localizada sin introducir estado complejo: tema del layout, búsqueda Pagefind, un comportamiento de pestañas o la carga puntual de una miniatura. No fuerces Vue sólo para eliminar un script corto.

## Elige Vue cuando

Vue es apropiado si existe una necesidad real de JavaScript reactivo, como:

- estado cliente persistente mientras el usuario interactúa;
- filtros, selectores, calendario y navegación de fechas;
- formularios interactivos con filas, validación y estados de envío;
- modales o diálogos con estado;
- datos que se cargan o refrescan después de la primera respuesta;
- múltiples eventos cliente coordinados;
- una interacción que sería artificial y frágil con scripts imperativos grandes.

Ejemplos actuales justificados: `AgendaCalendarIsland.vue` (filtros, diálogos, navegación y eventos), `GuiaLanzamientosIsland.vue`, `NovedadesNacionalesIsland.vue` y los feeds paginados de Instagram/Telegram.

## Casos que no justifican convertir a Vue

No conviertas Astro → Vue únicamente:

- por comodidad o familiaridad con Vue;
- porque el componente tiene muchas reglas CSS;
- porque recibe props;
- porque su lógica sólo se ejecuta en build/servidor;
- para obtener una interactividad mínima que un script pequeño y localizado resuelve con claridad.

Tampoco conviertas Vue → Astro si eso fuerza a dividir una única interacción coherente en scripts imperativos que deben sincronizar su estado.

## Fetch: dónde ocurre

El origen del dato y el momento de actualización deciden el borde:

- **Build/server Astro:** WordPress/WPGraphQL, datos editoriales, secretos y contenido listo para HTML. El catch-all editorial se prerenderiza así.
- **SSR/endpoint Astro:** datos que deben estar frescos o dependen de la request, sin exponer secretos. La agenda y `/api/agenda-resumen.json` obtienen eventos de Google en servidor; los endpoints con `prerender = false` son el borde HTTP.
- **Vue cliente:** sólo datos seguros de consumir públicamente y que cambian tras cargar la página. `HOST_API` está expuesto deliberadamente por la configuración de Vite para los clientes del backend propio; no extrapoles esa excepción a otras variables.

Evita duplicar una misma fuente de verdad entre frontmatter y una island. Pasa un snapshot inicial si mejora la primera pintura y deja explícito cuándo Vue debe refrescarlo; si la ruta estática necesita datos frescos, usa un endpoint SSR seguro en lugar de llevar secretos al navegador.
