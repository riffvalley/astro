# Architecture

Cómo se organiza el código bajo `src/` y por qué. Escrito para un
desarrollador nuevo o un agente de IA que necesite saber dónde vive algo —o
dónde poner algo nuevo— sin tener que leer primero todo el código base.

## Modelo mental

- **`pages/`** — Rutas de Astro. Un archivo por URL (o un catch-all).
  Composition roots: obtienen los datos de esa ruta, componen la página e
  incorporan el chrome de `app/` y la UI de las features. Sin lógica de
  negocio.
- **`app/`** — el shell global alrededor de cada página: header, footer,
  búsqueda, navegación. No está atado a ninguna feature concreta.
- **`features/`** — capacidades de producto (agenda, releases,
  national-releases, editorial, redactores, social). Cada una posee su
  acceso a datos, modelos, transformaciones y UI para esa capacidad.
- **`shared/`** — piezas pequeñas, a nivel de framework, genuinamente
  reutilizadas por dos o más features. No es el destino por defecto para
  código que "parece genérico".
- **`lib/`** — infraestructura técnica y clientes de proveedores. No sabe
  nada del dominio de producto de Riff Valley (posts, reviews,
  conciertos...).
- **`components/`** — piezas presentacionales de Astro/Vue consumidas
  directamente por páginas (post cards, rails, la grid de redactores) que
  todavía no pertenecen a una frontera de feature definida. Consume las
  exportaciones públicas de las features; nada depende de él.

## Dirección de dependencias

```
pages, app, components  →  features, shared, lib
features                →  shared, lib
```

Prohibido:

```
shared    → features
lib       → features
feature A → feature B (internals)
```

`lib` y `shared` son la base sobre la que se sostiene todo lo demás. Si
cualquiera de los dos empezara a importar desde una feature, un cambio
dentro de esa única feature podría romper silenciosamente a cualquier otro
consumidor de `lib`/`shared` — justo lo contrario de para qué sirve una
base. Las features se mantienen aisladas entre sí para que tocar `agenda`
nunca pueda romper accidentalmente `releases`; cualquier cosa que dos
features necesiten la una de la otra pertenece a `shared`, pero solo una
vez que la reutilización sea real (ver [Shared](#shared)).

## Pages

Ejemplo: `src/pages/index.astro` (Home).

Qué hace una página:

- obtiene los datos que su ruta necesita (`getAllPosts()`,
  `getRedactores()`, `buildHomeEditorialContent()`...)
- decide la composición y el layout — qué rails, qué islands, en qué orden
- pasa props hacia `app/`, `features/*/components`, y `components/*`

Qué **no** debe hacer una página:

- contener lógica de negocio (parsing, scoring, filtrado) — eso es trabajo
  de la feature dueña
- meterse en los internals de una feature, p. ej. importar
  `features/agenda/utils/eventGrouping` directamente en vez de pasar por
  los `components`/`api`/`index.ts` de la feature
- contener markup que otras páginas también necesitarían — eso pertenece a
  `components/` o `shared/`, no duplicado como JSX/markup local de la
  página

Home ensambla `Layout`, piezas presentacionales de `components/`
(`LatestGrid`, `CategoryRail`, `ReviewsRail`, `MonthlyAlbumsSpotlight`,
`RedactoresGrid`, `SpotifyJukebox`), root Vue islands de dos features
distintas (`AgendaCalendarIsland` de `agenda`, más `InstagramGridIsland`,
`TelegramGridIsland` y `TikTokGridIsland` de `social`), y datos editoriales
construidos por `features/editorial`. Nunca hace parsing del HTML de un
post ni calcula un review score ella misma — de eso se encarga
`buildHomeEditorialContent()`.

## App

`src/app/shell/` contiene el chrome que comparte cada página:
`Header.astro`, `Footer.astro`, `Search.astro`, `HeaderNavigation.astro`.
`src/layouts/Layout.astro` los envuelve alrededor de `<slot />` en cada
ruta.

`Header.astro` es el ejemplo representativo: obtiene posts vía
`features/editorial/api/wordpress` y construye los datos de navegación vía
`buildHeaderNavigation()` de `features/editorial`, y luego renderiza
`HeaderNavigation` y `Search`. Depende de una feature, nunca al revés —
nada en `features/editorial` sabe que el header existe.

Algo pertenece a `app/` cuando envuelve el chrome de *cada* página. Si
simplemente aparece en varias páginas sin ser shell global, eso es
composición de página (o una pieza de `components/`/`shared/` consumida
por esas páginas).

## Features

Una feature posee una capacidad de producto de principio a fin — datos,
transformaciones y UI — con sus carpetas internas moldeadas por
responsabilidades reales, no por una plantilla fija.

- **`agenda`** — calendario de conciertos. `server/` (Google Calendar +
  datos de mapa, solo servidor/build), `api/` (cliente de fetch de
  navegador), `model/` (tipos de dominio + configuración de calendarios),
  `components/` (incluyendo el root island `AgendaCalendarIsland.vue`),
  `composables/`, `utils/`.
- **`releases`** — "Guía de lanzamientos". `api/` (`discsClient.ts`),
  `model/`, `components/` (incluyendo el root island
  `GuiaLanzamientosIsland.vue`), `utils/`.
- **`national-releases`** — misma forma que `releases` para su propia
  capacidad: `api/`, `model/`, `components/` (root island
  `NovedadesNacionalesIsland.vue`), `utils/` propios.
- **`editorial`** — modelado del contenido de WordPress: `api/wordpress.ts`
  (acceso WPGraphQL), `utils/editorialParsing.ts`, más archivos sueltos
  (`headerNavigation.ts`, `homeContent.ts`, `reviewScore.ts`), todos
  expuestos a través de `index.ts`.
- **`redactores`** — un único archivo `redactores.ts` más su test. Sin
  subcarpetas `api/`, `model/` ni `components/`, porque todavía no hay UI ni
  múltiples responsabilidades que separar.
- **`social`** — una única feature que cubre los feeds sociales del sitio,
  manteniendo cada proveedor separado en vez de unificarlo tras un modelo
  común: `api/` (`instagram.ts`, `telegram.ts`, `tiktok.ts` — un cliente
  por proveedor), `components/` (root islands `InstagramGridIsland.vue`,
  `TelegramGridIsland.vue`, `TikTokGridIsland.vue`, cada uno con sus
  propios componentes de card/detail específicos del proveedor, más los
  shells de presentación compartidos `PhoneFrame.vue`/
  `PhoneMediaCarousel.vue`), `composables/` (`usePaginatedSocialFeed.ts`,
  la coordinación de paginación/selección genuinamente común a los tres
  feeds), `tests/`.

**Una feature no necesita `api/`, `model/`, `components/`, `composables/`
ni `server/` solo porque otras features las tengan.** La estructura de
subcarpetas emerge de las responsabilidades reales de esa feature —
`redactores` es una feature completa y legítima como un solo archivo. No
crees carpetas vacías "por simetría" con `agenda` o `releases`.

## Islands

Las Vue islands son composition roots del lado cliente, y viven dentro de
la carpeta `components/` de la feature que las posee:
`features/agenda/components/AgendaCalendarIsland.vue`,
`features/releases/components/GuiaLanzamientosIsland.vue`,
`features/national-releases/components/NovedadesNacionalesIsland.vue`,
`features/social/components/InstagramGridIsland.vue`,
`features/social/components/TelegramGridIsland.vue` y
`features/social/components/TikTokGridIsland.vue` — un root island por
proveedor, cada uno pasando igualmente por el composable compartido de su
propia feature `usePaginatedSocialFeed`, en vez de tres implementaciones
sin relación entre sí.

El trabajo de un island es:

- poseer el estado de cliente que debe sobrevivir a través de sus hijos
  (mes/año seleccionado, filtros marcados, un modal abierto)
- coordinar el fetch a través del cliente `api/` de su propia feature y
  derivar lo que sus hijos necesitan a partir del resultado
- delegar la presentación a componentes Vue más pequeños de la misma
  feature (`AgendaCalendarGrid`, `DiscRow`, `NationalRow`...) y a `shared/`
  donde una pieza sea genuinamente genérica (`MonthYearPicker`,
  `ReleaseGroup`)

Un island no debería contener markup ni lógica de negocio que pertenezca un
nivel más abajo, dentro de su propia feature, y no debería meterse en otra
feature — todo lo que necesita sobre su propio dominio está en carpetas
hermanas (`../model`, `../utils`, `../api`).

## Shared

Regla: algo se mueve a `shared/` solo después de una reutilización real y
demostrada entre dos o más features — no porque parezca genérico.

- `shared/components/MonthYearPicker.vue` y `ReleaseGroup.vue` — usados
  tanto por `GuiaLanzamientosIsland.vue` (releases) como por
  `NovedadesNacionalesIsland.vue` (national-releases): la misma
  navegación de mes/año y la misma carcasa de lista agrupada por fecha,
  compartida de verdad.
- `shared/components/ColorPill.vue` — usado por `releases` (`DiscRow`,
  `DiscModal`) y por `national-releases` (`NationalRow`) para el mismo
  contrato de chip de etiqueta con color.
- `shared/utils/formatDateLong.ts` — la misma llamada de formateo de
  fecha, las mismas reglas de locale, usada por ambos islands de
  lanzamientos.

La similitud visual no basta por sí sola: dos componentes pueden parecerse
hoy y divergir mañana por razones específicas de su feature (uno necesita
una forma de datos distinta, el otro una regla de locale distinta).
Promocionar solo por parecido produce una abstracción compartida que
termina llenándose de condicionales para servir a dos dueños no
relacionados. Promociona una vez que una segunda feature necesite el
*mismo contrato*, no solo una forma parecida.

## Lib

`lib/` contiene infraestructura técnica y clientes de proveedores sin
conocimiento del dominio de producto de Riff Valley — se verían igual
conectados a cualquier otro sitio que use los mismos proveedores.

`wordpressClient.ts` es el ejemplo: `fetchGraphQL`, `readDevCache`/
`writeDevCache`, manejo de retry/timeout — puramente "cómo hablar con
WPGraphQL y cachearlo en dev", sin ninguna noción de posts, reviews ni
redactores. Tanto `features/editorial/api/wordpress.ts` como
`features/redactores/redactores.ts` lo importan para construir sus propias
formas de dominio encima.

`lib` nunca debe depender de `features/`: es la base sobre la que se
sostiene más de una feature (tanto editorial como redactores se apoyan en
`wordpressClient`). Si `lib` importara desde una feature, cualquier otro
consumidor de ese módulo de `lib` correría el riesgo de romperse cada vez
que esa única feature cambiara, y el grafo de dependencias ganaría un
ciclo. El resto de `lib` sigue la misma forma — `spotify.ts`,
`instagram.ts`, `telegram.ts` (clientes de proveedor), `apiBase.ts` (base
URL compartida), `colorContrast.ts`, `linkPlatform.ts` (algoritmos
técnicos) — infraestructura, no lógica de producto.

## Fronteras server/client

No todas las features lo necesitan, pero cuando el código de una feature
genuinamente se divide entre código solo de servidor y código de
navegador, mantenlos físicamente separados. `agenda` es el ejemplo actual:

- `features/agenda/api/` — el cliente de fetch de navegador
  (`agendaClient.ts`) llamado desde el island; corre en el navegador del
  visitante.
- `features/agenda/server/` — `googleCalendar.ts` y `spainMap.ts`, solo
  servidor/build: contienen el manejo de la clave de la API de Google
  Calendar y el cómputo geográfico pesado (`d3-geo`/`topojson`) que nunca
  debe llegar al bundle de cliente.

Esta separación existe porque agenda genuinamente tiene ambos tipos de
código tocando el mismo dominio — no es un par de carpetas que toda
feature deba tener. `redactores`, por ejemplo, obtiene todo de WordPress en
build time sin ningún cliente de navegador, y eso es una feature completa
y correcta.

## Ubicación de los tests

Los tests viven en una carpeta `tests/` junto al código que protegen,
propiedad del mismo módulo:

- `features/agenda/tests/googleCalendar.test.ts` protege
  `features/agenda/server/googleCalendar.ts`.
- `features/agenda/tests/agendaResumenEndpoint.test.ts` protege el
  contrato del endpoint `pages/api/agenda-resumen.json.ts` — el test de un
  endpoint vive con la feature a la que sirve, no en `pages/`.
- `features/editorial/tests/wordpress.test.ts` protege
  `features/editorial/api/wordpress.ts`.
- `lib/wordpressClient.test.ts` se queda en `lib/`, junto a
  `wordpressClient.ts` — es infraestructura, no una feature.
- `shared/tests/formatDateLong.test.ts` protege el único util compartido
  que tiene lógica que merece protegerse.

Esto trata sobre *dónde* viven los tests, no sobre estrategia de testing —
ver la política de testing del proyecto para qué probar y a qué nivel.

## Guía de decisión

"¿Dónde debería ir este código?"

- Una capacidad de producto concreta (calendario, guía de lanzamientos,
  redactores) → **feature**
- Un cliente técnico de proveedor/infraestructura sin conocimiento de
  producto → **lib**
- El mismo contrato exacto ya necesitado por dos o más features →
  **shared**
- Obtener datos o componer una sola ruta → **page**
- Chrome presente en cada página (header, footer, búsqueda) → **app**
- Una pieza presentacional consumida por páginas que todavía no posee una
  frontera de feature → se queda en **`components/`** hasta que una
  capacidad real justifique extraerla

## Anti-patrones

- Una feature importando los internals de otra directamente (p. ej.
  `features/releases` metiéndose en `features/agenda/utils/...`) en vez de
  pasar por una superficie pública, o promocionar la necesidad compartida
  a `shared/`.
- `lib/` importando desde `features/` — invierte la dirección de
  dependencias sobre la que se sostiene todo el árbol.
- Promocionar algo a `shared/` solo por similitud visual, antes de que una
  segunda feature realmente necesite el mismo contrato.
- Crear carpetas `api/`/`model/`/`components/`/`composables/` en una
  feature nueva "por simetría" con agenda/releases, antes de que haya
  código real que poner en ellas.
- Dividir un archivo porque cruzó un umbral de número de líneas, no porque
  contenga más de una responsabilidad.
- Extraer un microcomponente sin reutilización real y sin una frontera
  presentacional propia.
- Mover un archivo solo para que coincida con la forma de carpetas de otro
  módulo, sin ninguna razón de dependencia u ownership detrás.
