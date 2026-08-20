# Riff Valley — Astro

Sitio de [Riff Valley](https://www.riffvalley.es), comunidad de música metal,
rock y hardcore. Astro 6 estático, contenido servido desde un WordPress
headless vía WPGraphQL, desplegado en Netlify.

## Comandos

```bash
pnpm install    # instalar dependencias
pnpm dev        # servidor de desarrollo en localhost:4321
pnpm build      # build de producción a ./dist/
pnpm preview    # previsualizar el build de producción en local
pnpm test       # tests unitarios en modo watch
pnpm test:run   # tests unitarios, una sola ejecución
pnpm typecheck  # comprobación de Astro, TypeScript y componentes Vue
pnpm astro ...  # CLI de Astro (p.ej. `pnpm astro check` para el type checking)
```

Los tests se colocan junto al código que protegen (`foo.ts` → `foo.test.ts`).
Vitest usa su entorno Node por defecto; no hay DOM global ni infraestructura
de componentes/E2E hasta que un comportamiento concreto la necesite.

### Iterar sobre cambios — usa el dev server, no un build completo

`pnpm build` pagina **todos** los posts de WordPress desde cero (~2 minutos)
antes de empezar siquiera a construir, y reconstruye el sitio entero en cada
cambio. Usa `pnpm dev` (localhost:4321) y comprueba los cambios ahí — recarga
al instante y, como los datos de GraphQL se cachean en disco (ver abajo),
solo paga el fetch de ~2 minutos una vez por vida de la caché, no una vez por
reinicio.

## Arquitectura

Sitio estático (`output: 'static'`) hecho con **Astro 6**, con `@astrojs/netlify`
como adaptador para las páginas y endpoints que necesitan SSR bajo demanda
(la agenda de conciertos y sus APIs). Gestor de paquetes: **pnpm**. Requiere
Node.js >= 22.12.0.

### Contenido: WordPress headless vía GraphQL

Todo el contenido editorial se trae de un endpoint WPGraphQL
(`https://www.riffvalley.es/graphql`), centralizado en `src/lib/wordpress.ts`:

- `getAllPosts()` — pagina todos los posts (con contenido/SEO/categorías
  completos) para la galería del index, los rieles por categoría y las rutas
  del catch-all.
- `getCategories()` / `getPages()` — paginan categorías y páginas estáticas
  de WP respectivamente.
- `getRedactores()` — perfiles curados a mano (avatar, último "Top 10 discos"
  y reel de Instagram) para la sección "Redactores" de la home.
- Las tres primeras están memoizadas por proceso — todas las páginas que las
  llaman durante el mismo build/dev comparten una única paginación.
- **Caché en disco solo en dev** (`.wp-cache/`, en `.gitignore`): antes de
  pedir datos a la red, cada función mira primero si hay un JSON cacheado.
  Esto persiste entre reinicios de `pnpm dev`, así que la paginación completa
  (~2 min) solo ocurre una vez hasta que se borra la carpeta. En `pnpm build`
  esta caché se ignora siempre — los builds de producción son siempre en
  fresco.

### Rutas

- `src/pages/index.astro` — homepage: galería de últimos posts, sección
  Discos (guía de lanzamientos + novedades nacionales), agenda de conciertos
  embebida, Actualidad (crónicas/reviews/artículos/entrevistas/novedades),
  mejores discos mensuales, redactores, redes sociales y Spotify.
- `src/pages/[...path].astro` — ruta catch-all; `getStaticPaths()` enumera
  todos los posts/categorías/páginas de WP y los prerenderiza cada uno en su
  propia `uri` — todo el contenido editorial es estático, no hay fallback SSR.
- `src/pages/agenda-conciertos.astro` — calendario de conciertos por
  comunidad autónoma, alimentado por 19 Google Calendars públicos
  (`src/lib/agendaCalendars.ts` + `src/lib/googleCalendar.ts`).
- `src/pages/como-usar-agenda.astro` — guía de uso de la agenda, con pestañas
  escritorio/móvil.
- `src/pages/api/*.json.ts` — endpoints SSR bajo demanda que usan las islas
  Vue del calendario para pedir datos frescos sin reconstruir el sitio.

### Estilos y diseño

- Tailwind v4 vía el plugin de Vite (`@tailwindcss/vite`), sin
  `tailwind.config` — los tokens de diseño se declaran con `@theme` en
  `src/styles/global.css` (ver también `tokens.css` y `design.md`).
- Modo oscuro por defecto, claro como alternativa vía clase `.light` en
  `<html>`, gestionado desde `Header.astro` y `Layout.astro`.

## Variables de entorno

Copia `.env.example` a `.env` y rellena:

| Variable                   | Para qué sirve                                                              |
| --------------------------- | ------------------------------------------------------------------------- |
| `HOST_API`                  | Base URL del backend propio (Instagram/Telegram/Spotify/discos)           |
| `GOOGLE_CALENDAR_API_KEY`   | Lectura de los 19 Google Calendars de la agenda de conciertos              |
| `WP_BASE_URL`                | Base URL de WordPress. Opcional — por defecto `https://www.riffvalley.es` |

En Netlify, estas mismas variables se configuran en Site settings →
Environment variables (apuntando a la URL real de producción, no a
`localhost`).

### Migración futura de WordPress a un subdominio propio

`WP_BASE_URL` existe pensando en el día en que `riffvalley.es` pase a servir
directamente este frontend de Astro y WordPress se mude a un subdominio
propio (p.ej. `wordpress.riffvalley.es`). Todo el código que habla con
WordPress deriva su URL de esta variable (`src/lib/wordpress.ts`,
`src/layouts/Layout.astro`) — ese día, el cambio es solo actualizar
`WP_BASE_URL` en Netlify y volver a desplegar, sin tocar código.

## Despliegue

El sitio se despliega en Netlify (`netlify.toml`: `pnpm build` → `dist`).
Como las páginas de posts están prerenderizadas, publicar o editar un
artículo en WordPress no se refleja solo — hace falta un nuevo build. Para
automatizarlo: un Build Hook de Netlify + un hook en WordPress (`save_post`)
que lo dispare al publicar/actualizar.
