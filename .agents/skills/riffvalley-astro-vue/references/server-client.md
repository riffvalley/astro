# Límite servidor/cliente

Astro es la frontera entre build/servidor y navegador. El frontmatter de una página/componente Astro y los endpoints de `src/pages/api/` pueden ejecutar trabajo de servidor; una island Vue hidratada se empaqueta para navegador.

## Nunca incluir en una island Vue

No importes ni serialices hacia Vue:

- `GOOGLE_CALENDAR_API_KEY`, otros secretos, credenciales o tokens;
- lógica `node:*`, `fs`, red de Node y código exclusivo de build;
- infraestructura WordPress server-only: cliente HTTPS/GraphQL, caché de disco y consultas que requieren servidor;
- llamadas que dependan de secretos;
- clientes o configuración de infraestructura completos.

El uso actual de `src/lib/wordpress.ts` ilustra código server-only: importa `node:https`, `node:fs`, `node:path` y usa caché de desarrollo. Nunca debe llegar a imports de Vue.

## Patrones seguros para datos dinámicos

- Una ruta SSR como `agenda-conciertos.astro` puede usar `GOOGLE_CALENDAR_API_KEY`, pedir Google Calendar y pasar al calendario Vue únicamente eventos y configuración serializable.
- Una página estática que necesita refresco puede hidratar una island y hacer que ésta llame a un endpoint Astro SSR. La home usa `/api/agenda-resumen.json` para que la clave de Google permanezca en servidor.
- Un endpoint puede devolver sólo el modelo necesario para el navegador y aplicar cache HTTP según la frescura del dato; `/api/redactor-reels.json` y `/api/agenda-resumen.json` son ejemplos de frontera HTTP bajo demanda.

`HOST_API` es una excepción intencional: `astro.config.mjs` lo expone al bundle cliente mediante `envPrefix` para los endpoints públicos del backend propio. No significa que `WP_BASE_URL`, claves de Google u otras variables se puedan exponer; revisa cada variable antes de usarla en Vue.

## Evitar fugas y trabajo duplicado

1. Mantén secretos e integraciones privadas en el servidor/endpoint.
2. Traduce DTOs de proveedor a modelos de feature antes de enviarlos.
3. Envía el mínimo de datos necesario; el payload de props también es coste de página.
4. No repitas el mismo fetch de servidor en cada isla si Astro puede componerlo una vez.
5. Cuando el cliente refresque, usa una ruta pública controlada, no una clave ni una infraestructura serializada.

Los endpoints siguen siendo rutas Astro: deben limitarse a parsing de request, respuesta y headers, delegando lógica de dominio al módulo de su feature cuando esa arquitectura exista.
