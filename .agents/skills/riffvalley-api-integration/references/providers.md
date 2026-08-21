# Proveedores actuales

## WordPress / WPGraphQL

WordPress es una dependencia de build: la paginación completa alimenta la home, rutas editoriales y generación estática. El cliente actual evita el `fetch` instrumentado de Netlify mediante `node:https`, serializa requests, aplica espaciado, reintentos limitados para 429/5xx, cache de memoria y cache de disco sólo en desarrollo. También normaliza categorías y contenido, y aplica un fallback sin SEO si un dato de Rank Math provoca un 301.

Riesgos a vigilar: disponibilidad del CMS, timeout ausente, paginación larga, WAF/rate limits, respuestas inconsistentes y observabilidad del build. Un build que no pueda producir un estado editorial válido debe fallar de manera comprensible; no publiques silenciosamente un sitio incompleto sin una decisión explícita. El HTML de WordPress se trata como contenido confiable por una decisión de frontera existente; no extiendas esa confianza a fuentes nuevas sin evaluarla. La frontera transporte/dominio ya está separada: `lib/wordpressClient.ts` es el transporte (GraphQL, cache) sin conocimiento de posts/reviews/redactores; `features/editorial/api/wordpress.ts` es el cliente que construye el modelo de dominio sobre él.

## Google Calendar

La clave es server-only. La integración normaliza Google event → `CalendarEvent`, consulta 19 calendarios para un rango y ordena el resultado. Al cambiarla, valida rangos de fecha, considera timeout y decide conscientemente si una comunidad fallida permite respuesta parcial. La página SSR y `agenda-resumen` son la frontera que evita exponer la clave.

## Backend propio de Riff Valley

`HOST_API` forma `API_BASE` y es público porque las Islands consumen sus endpoints. Clientes de dominio actuales sobre esa base: `discsClient.ts` (releases), `nationalReleasesClient.ts` (national-releases), `spotify.ts` (lib) e `instagram.ts`/`telegram.ts`/`tiktok.ts` (`features/social/api/`). Mantén la UI alejada del formato externo cuando haya transformación útil, aplica validación proporcional y considera cancelación para filtros, mes, búsqueda o paginación. 429 de propuestas nacionales tiene semántica UX propia; las mutaciones no se reintentan ciegamente.

## Instagram, Spotify, Telegram y TikTok

Son proveedores indirectos a través del backend propio; su contrato puede no coincidir con la especificación dada — TikTok ya tuvo un caso real de ruta incorrecta, detectado solo al verificar contra el backend real. Verifica siempre un contrato nuevo contra el proveedor real antes de cerrar la tarea. Las redes pueden degradar con mensaje/retry y no deben dictar el modelo de UI. Las miniaturas de reels son URLs firmadas: `redactor-reels` las refresca en SSR y envía cache HTTP acotada. Spotify usa fallback a búsqueda/iframe cuando no hay enlace verificado; mantén esa degradación explícita.

## Anti-patrones de infraestructura

- **No timeout:** un proveedor bloquea build, SSR o UI indefinidamente.
- **Infinite retry:** intentos sin límite o POST duplicados.
- **Environment leakage:** una variable privada llega a Vite/Vue.
- **ApiBase dumping ground:** `shared/api` reemplaza a `src/lib` como cajón sin propietario.
- **Repository ceremony:** capas de repository/service/adapter/use-case para una llamada trivial.
- **Provider-driven domain:** un cambio de Google, WordPress o backend obliga a tocar toda la UI.
