# Migraciones estructurales seguras

## Mover código

1. Preserva la API si es posible.
2. Actualiza sólo consumidores necesarios.
3. No renombres a la vez salvo necesidad.
4. Comprueba imports y ciclos.
5. Verifica proporcionalmente.
6. Elimina la ruta antigua sólo tras migrar consumidores.

Un re-export/compatibility layer puede facilitar una transición gradual si tiene propósito, caducidad y no crea una segunda API permanente accidental.

## API pública y shared

Al introducir `features/foo/index.ts`, migra consumidores del slice y mantén exports mínimos; no reescribas todos los imports indiscriminadamente. No mezcles crear ownership de feature con promocionar múltiples piezas a `shared`. Primero consolida el dominio y después demuestra reutilización conforme a `riffvalley-feature-module`. `MonthYearPicker`, `ReleaseGroup`, `Badge`, `ColorPill`, `PlatformLinkButton` y `SearchableCombobox` siguen siendo candidatos, no decisiones.

## APIs e infraestructura

Consulta `riffvalley-api-integration`. No cambies simultáneamente ubicación del adapter, modelo, errores, timeout, retry y cache. Mover `googleCalendar.ts` no implica adoptar `Promise.allSettled`; eso cambia resiliencia y merece otro slice.

En `wordpress.ts`, inspecciona transporte HTTP/GraphQL, serialización, retry, cache, queries, tipos, parsing, normalización y redactores. Extrae como máximo una responsabilidad coherente por slice. Cualquier cambio en requests, orden, timing, retry, cache o payload es HIGH por WAF/build.

## Astro y Vue

Consulta `riffvalley-astro-vue`. Dividir Vue no exige convertir hijos a Astro, cambiar `client:*` ni mover fetch entre servidor/cliente. Un `Header.astro` grande tampoco exige Vue: separa preparación de datos, modelo de navegación, presentación, móvil, social, tema/búsqueda sólo cuando haya razones independientes para cambiar.

## Candidatos actuales, sin estructura final cerrada

- **AgendaCalendarIsland:** modelos, grid/fechas, filtros, fetch, navegación, selección, mapa, diálogo y UI. Extrae según responsabilidad y estado compartido.
- **WordPress:** comienza por piezas puras/characterizable antes que transporte/cache sensible, salvo que el problema real esté en infraestructura.
- **Header:** busca desacoplar shell y preparación editorial sin cambiar markup/UX.
- **Home:** conserva `index.astro` como composition root y extrae reglas de selección cuando tengan ownership editorial claro.
