# Adaptadores y endpoints

Prueba el comportamiento del adapter, no la librería `fetch`. Por ejemplo: ante 429, `submitNationalReleases` mantiene la semántica `THROTTLED`; ante error no JSON, usa fallback seguro; ante una respuesta inválida, no debe aceptarla silenciosamente cuando exista validación runtime.

Las llamadas reales a WordPress, Google y backend no son requisito de unit tests. Simula la frontera HTTP y usa respuestas mínimas que expresen el contrato. Para Google separa transformación de evento (unit) y agregación de calendarios (integración de servicio); contempla vacío, múltiples calendarios, orden, fallo parcial, all-day, con hora y opcionales.

## Endpoints Astro

Protege al menos input válido, input inválido, fallo del proveedor, status, shape de respuesta y headers importantes. `agenda-resumen` merece tests futuros de mes/año y `Cache-Control`; `month=13` no debería transformarse silenciosamente en una fecha inesperada cuando se añada validación. `redactor-reels` puede caracterizarse por URL de reel, fallback cuando una página falla y cache de URLs firmadas.

## Errores y contratos

Sigue la taxonomía/validación de `riffvalley-api-integration`; no copies su política. Los tests sólo comprueban que el contrato elegido se mantenga. Evita dependencia de proveedores reales, retry infinito o mocks que repliquen el código en vez de el contrato.
