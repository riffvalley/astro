# Errores, validación y estados de cliente

## Taxonomía conceptual

Usa una semántica pequeña cuando la feature necesite diferenciar UX: `network`, `timeout`, `invalid-response`, `unauthorized`, `forbidden`, `not-found`, `rate-limit`, `server` y `unknown`. No hace falta una clase por tipo si todos terminan mostrando el mismo mensaje. Sí puede ser útil distinguir, por ejemplo, 429 de una propuesta nacional frente a 500 del backend.

## TypeScript no valida runtime

`await res.json() as Foo` no garantiza `Foo`. Añade validación runtime proporcional para inputs públicos, proveedores menos fiables, estructuras complejas, datos críticos o contratos que cambian. Para un proveedor controlado y una respuesta pequeña, puede bastar una comprobación manual mínima. No impongas Zod, Valibot u otra librería: adoptarla sería una decisión transversal explícita.

## Validar inputs

Valida query params, body, filtros, IDs, URLs, años y meses en el borde. No asumas que `Number(value) || fallback` es una validación: comprueba finitud y rangos de dominio, por ejemplo `month ∈ 1..12`. Un endpoint responde con status adecuado, `content-type` correcto, cache headers cuando proceda y sin filtrar detalles internos.

## Estados en Vue

Los fetch desde Islands deben comunicar al menos `idle`, `loading`, `success`, `empty` y `error`; cuando sea relevante, `retry`, `stale` o `cancelled`. El adaptador de feature debe encapsular status/proveedor cuando ello evita que cada componente reinvente la política, pero evita wrappers triviales.

Las islands actuales de lanzamientos, novedades nacionales y los tres feeds de `features/social/` (Instagram, Telegram, TikTok) ya representan loading, error, retry y/o empty. Al cambiar filtros o paginación rápidamente, añade protección contra respuestas obsoletas si la interacción lo permite.

## Anti-patrones

- **Raw provider leakage:** UI conoce DTOs externos complejos.
- **Fetch everywhere:** cada componente decide status, errores y parseo por separado.
- **Runtime trust:** un cast sustituye una validación necesaria.
- **Silent catch:** se pierde un fallo crítico bajo un `catch {}`.
