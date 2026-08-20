---
name: riffvalley-api-integration
description: Define o aplica la política de Riff Valley para añadir o modificar fetch, APIs, proveedores externos, endpoints Astro, DTOs, validación, timeout, retry, cache, AbortController y variables de entorno.
---

# Integraciones API de Riff Valley

Una integración externa tiene una frontera explícita: proveedor → transporte/DTO → normalización cuando aporte valor → modelo de feature → UI. La frontera protege al dominio; no es una obligación de crear `Dto`, mapper, repository, service y use case para cada llamada.

Esta skill gobierna la política de integración. `riffvalley-feature-module` decide la propiedad de la feature y `shared`; `riffvalley-architecture`, los límites y dependencias; `riffvalley-astro-vue`, Astro/Vue, Islands y server/client. Consúltalas en vez de duplicar sus decisiones. La precedencia general está definida en `riffvalley-refactoring`.

## Workflow

1. Identifica el propietario de la capacidad y el proveedor. Consulta [boundaries.md](references/boundaries.md).
2. Define la frontera servidor/cliente y los datos que pueden cruzarla. Consulta [server-client.md](references/server-client.md).
3. Decide si el proveedor requiere modelo interno, normalización y validación runtime. Consulta [errors-validation.md](references/errors-validation.md).
4. Diseña timeout, cancelación, retry, degradación y fallo parcial adecuados al contexto. Consulta [resilience.md](references/resilience.md).
5. Elige el tipo de cache y su invalidación; no uses “cache” como concepto único. Consulta [caching.md](references/caching.md).
6. Para los proveedores actuales, consulta [providers.md](references/providers.md).

## Checklist antes de terminar

- ¿Quién es propietario de esta API y estamos filtrando detalles del proveedor?
- ¿DTO + mapper aportan protección real o son ceremoniales?
- ¿Hay timeout cuando un build, SSR o interacción podría bloquearse?
- ¿Puede haber una respuesta obsoleta y el retry es seguro, limitado e idempotente?
- ¿Un fallo parcial debe tumbar toda la respuesta?
- ¿Validamos inputs y desconfiamos razonablemente de `res.json()`?
- ¿Hay secretos o configuración server-only entrando al cliente?
- ¿El cache tiene scope, lifetime e invalidación comprensibles?
- ¿La UX distingue `idle`, `loading`, `success`, `empty`, `error` y, si aplica, `retry`/`cancelled`?
- ¿Evitamos abstracciones HTTP o de infraestructura por anticipación?
