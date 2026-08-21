# Límite servidor/cliente

Astro es la frontera entre build/servidor y navegador. El frontmatter de una página/componente Astro y los endpoints de `src/pages/api/` pueden ejecutar trabajo de servidor; una island Vue hidratada se empaqueta para navegador.

## Nunca incluir en una island Vue

No importes ni serialices hacia Vue:

- `GOOGLE_CALENDAR_API_KEY`, otros secretos, credenciales o tokens;
- lógica `node:*`, `fs`, red de Node y código exclusivo de build;
- infraestructura WordPress server-only: cliente HTTPS/GraphQL, caché de disco y consultas que requieren servidor;
- llamadas que dependan de secretos;
- clientes o configuración de infraestructura completos.

`lib/wordpressClient.ts` ilustra código server-only vigente: importa `node:https`, `node:fs`, `node:path` y usa caché de desarrollo. Nunca debe llegar a imports de Vue.

## Patrones seguros para datos dinámicos

Los patrones (ruta SSR con secreto de servidor, island que refresca vía
endpoint público, endpoint con cache HTTP acotada) y sus ejemplos actuales
están en [astro-vs-vue.md](astro-vs-vue.md) → "Fetch: dónde ocurre" — no se
repiten aquí. `HOST_API` es la única excepción a "nunca serialices
infraestructura hacia Vue"; qué variables existen hoy y qué proveedores la
consumen es política de `riffvalley-api-integration`, no de esta skill.

## Evitar fugas y trabajo duplicado

1. Mantén secretos e integraciones privadas en el servidor/endpoint.
2. Traduce DTOs de proveedor a modelos de feature antes de enviarlos.
3. Envía el mínimo de datos necesario; el payload de props también es coste de página.
4. No repitas el mismo fetch de servidor en cada isla si Astro puede componerlo una vez.
5. Cuando el cliente refresque, usa una ruta pública controlada, no una clave ni una infraestructura serializada.

Los endpoints siguen siendo rutas Astro: deben limitarse a parsing de request, respuesta y headers, delegando lógica de dominio al módulo de su feature cuando esa arquitectura exista.
