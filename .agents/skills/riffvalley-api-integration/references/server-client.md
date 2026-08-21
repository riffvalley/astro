# Servidor, cliente y configuración

`riffvalley-astro-vue` es la autoridad de este límite. Astro frontmatter y endpoints pueden ejecutar integración server/build; una Island Vue se empaqueta para navegador. Nunca lleves al bundle cliente `GOOGLE_CALENDAR_API_KEY`, credenciales, tokens, secretos WordPress, `fs`, `node:https` u otra configuración server-only.

## Variables actuales

- `GOOGLE_CALENDAR_API_KEY` se usa para leer Google Calendar en servidor; debe continuar siendo secreta.
- `WP_BASE_URL` configura WordPress server/build y tiene un fallback consciente hacia `https://www.riffvalley.es`.
- `HOST_API` se expone deliberadamente mediante `vite.envPrefix` porque discos, lanzamientos nacionales, Spotify y los tres feeds de `features/social/` (Instagram, Telegram, TikTok) se consumen desde Islands. Por ello es una base pública: no puede contener secretos ni asumir protección por no llamarse `PUBLIC_*`.

No modifiques ahora `astro.config.mjs`, `.env` ni contratos. Si la configuración crece, `shared/config/env.ts` podría ser un candidato sólo tras una decisión transversal. Cada variable debe tener un único significado, defaults conscientes según desarrollo/producción y errores críticos no deben ocultarse con fallbacks peligrosos.

## Pautas de cruce

Una ruta SSR puede pedir Google y entregar al navegador sólo eventos normalizados y configuración serializable. Una página estática puede delegar datos frescos a un endpoint Astro público, como la home con `agenda-resumen`. No serialices clientes, secretos, DTOs voluminosos ni infraestructura hacia Vue.

Revisa cualquier ampliación de `envPrefix`: expone una variable al navegador y debe tratarse como pública por diseño.
