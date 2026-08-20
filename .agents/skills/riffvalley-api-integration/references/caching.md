# Tipos de cache y decisión de frescura

No uses “cache” como un concepto único. Para cada estrategia define scope, lifetime, invalidación y tolerancia a datos obsoletos.

| Tipo | Scope / lifetime | Ejemplo actual | Decisión a documentar |
| --- | --- | --- | --- |
| Memoria | proceso actual; se pierde al reiniciar | `Map` y promesas memoizadas de WordPress | TTL, deduplicación y coherencia dentro de build/dev |
| Disco de desarrollo | máquina local; persiste entre reinicios | `.wp-cache` | cómo forzar refresh y qué antigüedad es admisible |
| Build | artefacto estático hasta el siguiente build | rutas editoriales prerenderizadas | qué ocurre si el CMS falla o entrega contenido parcial |
| HTTP/navegador | respuesta y caches HTTP durante `max-age` | `agenda-resumen.json` | headers, invalidación y dato stale aceptable |
| CDN/edge | cache del proveedor de hosting | `s-maxage` de endpoints Netlify | purga/revalidación y alcance geográfico |

WordPress usa memoria para evitar repetir paginación en una ejecución y disco sólo en desarrollo. `agenda-resumen` usa `max-age=300, s-maxage=300` porque la agenda tolera cinco minutos de frescura. `redactor-reels` usa un lifetime más largo, pero limitado, por URLs firmadas que caducan. Estos valores no son estándares universales: revísalos contra frescura, carga de proveedor y coste de datos obsoletos.

Nunca caches secretos en respuestas públicas y no des por sentada una invalidación que no existe. Para una integración nueva, declara explícitamente si puede servir datos stale, quién los invalida y qué ocurre al fallar el refresh.
