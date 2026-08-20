# Anti-patterns observables y correcciones

Estos son riesgos de la estructura actual. No son una autorización para refactorizarlos en bloque; aplícalos al tocar el área correspondiente.

## `src/components` creciendo indefinidamente

**Señal:** componentes Astro de editorial, agenda, Spotify y shell global conviven sin indicar propietario; `src/components/vue` agrupa islas y piezas de varios dominios.

**Corrección:** el shell global va a `app/`; cada componente de producto, a su feature. `shared/ui` sólo recibe componentes agnósticos con reutilización comprobada.

## `src/lib` como cajón de sastre

**Señal:** hay clientes de WordPress, Google Calendar, backend propio, lógica de formato, mapa y utilidades de color en el mismo directorio.

**Corrección:** acerca API/model/reglas a su feature. Conserva en `shared/` sólo infraestructura o utilidad independiente de un dominio. No sustituyas `lib` por un nuevo `utils` genérico.

## Mega componentes

**Señal:** `AgendaCalendarIsland.vue` concentra calendario, filtros, mapa, navegación, fetch cliente y detalles; `Header.astro` contiene navegación, tema y búsqueda; la home coordina mucha selección editorial.

**Corrección:** separa por responsabilidades cohesivas cuando el cambio lo requiera: composables para estado Vue de una feature, componentes hijos para representación y servicios/modelos para reglas. No fragmentes una pieza pequeña sólo para cumplir una cuota de archivos.

## Mega módulos como `wordpress.ts`

**Señal:** `src/lib/wordpress.ts` (~20 KB) mezcla transporte HTTPS, cache, queries WPGraphQL, DTOs, normalización, extracción de reviews y lógica curatorial de redactores.

**Corrección:** al modificar una responsabilidad, extráela hacia el dominio adecuado. Mantén el transporte/DTOs de WordPress detrás de un adaptador; separa reglas editoriales y redactores cuando necesiten cambiar de forma independiente. No crees seis capas vacías de antemano.

## Páginas Astro con demasiada lógica de negocio

**Señal:** `index.astro` filtra categorías, evita duplicados y selecciona destacados; `agenda-conciertos.astro` y `api/agenda-resumen.json.ts` duplican el cálculo del rango de grid y coordinan proveedor/configuración.

**Corrección:** la ruta conserva parámetros y composición. Extrae reglas reutilizables y transformaciones del dominio a `features/editorial` o `features/agenda` al tocarlas. Evita mover contenido puramente de presentación de ruta sólo por purismo.

## Componentes que conocen DTOs externos

**Señal:** componentes importan tipos directamente desde `lib/wordpress`, `lib/discs`, `lib/nationalReleases`, `lib/instagram` o `lib/telegram`.

**Corrección:** cada adaptador devuelve un modelo de Riff Valley; el componente acepta ese modelo o un view model. Deja el DTO privado junto al adaptador. No es necesario inventar un mapeador separado para una transformación trivial.

## Compartir «por si acaso»

**Señal:** extraer `MonthYearPicker`, `ReleaseGroup` o botones especializados a `shared` sólo porque dos pantallas parecen similares.

**Corrección:** duplica poco y de manera consciente mientras las APIs o semánticas sean distintas. Extrae después de que exista reutilización real y un contrato común estable.

## Capas vacías por patrón

**Señal:** crear `domain/`, `application/`, `infrastructure/`, repositorios, casos de uso o interfaces sin reglas, puertos o consumidores reales.

**Corrección:** empieza con `components/`, `api/` y `model/` si basta. Añade una capa cuando elimine complejidad concreta: múltiples fuentes, reglas difíciles de testear, coordinación de casos de uso o infraestructura intercambiable.

## Imports profundos entre features

**Señal:** `features/social/components/...` importa `features/agenda/model/...` o una página importa internals para reutilizar un helper.

**Corrección:** compón ambas features desde `pages/`/`app/`, mueve el concepto realmente transversal a `shared/`, o expón un contrato mínimo en `feature/index.ts`. Nunca hagas que una feature conozca la estructura interna de otra.
