# Prioridades de testing

No se testea un archivo porque exista, sea grande o esté exportado. Prioriza por `riesgo × complejidad × probabilidad de regresión` y pregunta qué comportamiento relevante quedaría desprotegido.

## Alta

- Funciones puras de fechas, agrupaciones, filtros, transformación, selección editorial y generación de estructuras.
- Parsers de contenido externo/HTML: `extractReviewScore`, `extractHighlightedBands`, entidades y truncado de contenido de WordPress.
- Límites de fecha, cambio de mes/año, febrero, leap years y timezone cuando aplique: `monthBounds`, grid de agenda y rangos de Google Calendar.
- Mappers de representación externa a modelo interno y su comportamiento ante opcionales o datos irregulares.
- Errores que cambian la UX o el contrato: 429 `THROTTLED`, fallos de proveedor, cache headers importantes.

## Media

- Adaptadores API, composables y Vue con comportamiento significativo: filtros, formularios, diálogos, carga, vacío, error, retry y paginación.
- Endpoints Astro: input válido/inválido, fallo de proveedor, status, shape de respuesta y headers de cache.
- Lógica actual cohesionada pero no pura, como calendario o selección editorial, mediante characterization tests antes de modificarla.

## Baja por defecto

- Componentes Astro sólo presentacionales, props que sólo se imprimen, markup trivial, clases CSS, iconos, constantes obvias y wrappers sin lógica.
- Snapshots grandes de HTML o de árboles Vue cuando no protegen una decisión significativa.

## Coverage

No fijes 80/90/100% global. Coverage sirve para descubrir huecos; sólo merece exigencia fuerte en módulos críticos ya aislados. La pregunta útil es “¿qué comportamiento importante no cubrimos?”, no “¿cómo subimos cinco puntos?”.

## Fixtures

Usa fixtures pequeñas y expresivas: sólo los campos relevantes para el caso. No copies posts/respuestas de producción enormes salvo que el bug dependa de esa forma exacta. Una fixture de proveedor debe hacer visibles los campos que el contrato usa.
