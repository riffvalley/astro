# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # Start dev server at localhost:4321
pnpm build      # Build production site to ./dist/
pnpm preview    # Preview production build locally
pnpm astro ...  # Run Astro CLI commands directly (e.g. `pnpm astro check` for type checking)
```

No test suite or linter is configured in this repo.

### Iterating on changes — use the dev server, not a full build

`pnpm build` fetches and paginates **every** WP post from scratch (~2 minutes)
before it even starts building, and rebuilds the entire static site on every
change. Prefer running `pnpm dev` (localhost:4321) in the background and
verifying changes there instead — it hot-reloads instantly and, since
GraphQL data is cached to disk (below), only pays the ~2 minute WP fetch once
per cache lifetime rather than once per restart.

**Ask the user before running `pnpm build`** (a full static build) — it's
slow and normally only needed to check the production build itself or right
before a deploy, not for routine iteration.

## Architecture

This is an **Astro 6** static site (`output: 'static'`) for Riff Valley, a Spanish metal/rock/hardcore music site, deployed to **Netlify** via `@astrojs/netlify`. Package manager is **pnpm**. Node.js >= 22.12.0 required.

### Content source: headless WordPress via GraphQL

All content is pulled from a WPGraphQL endpoint (`https://www.riffvalley.es/graphql`), defined in `src/lib/wordpress.ts`:

- `getAllPosts()` — paginates through every post (20 at a time, with full content/SEO/categories) for the index gallery, category rails, and the catch-all route's `getStaticPaths()`.
- `getCategories()` / `getPages()` — paginate categories and static WP pages respectively.
- All three are memoized per-process (`allPostsPromise`/etc.) — every page that calls them during the same build/dev process shares one paginated fetch instead of repeating it.
- **Dev-only disk cache** (`.wp-cache/`, gitignored): in dev mode, each of the three functions above first checks for a cached JSON file on disk before hitting the network, and writes one after a fresh fetch. This persists across `pnpm dev` restarts, so the ~2 minute full pagination only happens once until the cache is cleared — delete the `.wp-cache/` folder to force a refresh. This cache is skipped entirely during `pnpm build` (production builds always fetch fresh).
- Individual post HTML gets its WordPress `<meta name="generator">` tag stripped from RankMath's SEO `fullHead` (to avoid revealing the CMS) and its `content` truncated at any embedded `<!DOCTYPE` (some WP blocks/shortcodes inject a full HTML document into post content).
- `extractReviewScore(content)` — regex-extracts the numeric score from the "Let's Review" Gutenberg block markup (WPGraphQL doesn't expose it as a field).

### Routing

- `src/pages/index.astro` — renders the post gallery on the homepage.
- `src/pages/[...path].astro` — catch-all route; `getStaticPaths()` enumerates every WP post via `getPosts()` and pre-renders it at its own `uri` (all posts, so all pages are statically generated at build time — there is no SSR fallback). Missing posts redirect to `/404`.
- SEO: when a post provides RankMath's `seo.fullHead`, `Layout.astro` injects it raw via `set:html` in place of a generated `<title>`.

### Styling

- Tailwind v4 is wired through the Vite plugin (`@tailwindcss/vite`) rather than a `tailwind.config`; design tokens (colors `rv-pink`/`rv-navy`, fonts `sans`/`heading`, etc.) are declared with `@theme` in `src/styles/global.css`.
- `.post-content` in `global.css` styles raw Gutenberg/WP block HTML rendered via `set:html` (headings, links, lists, blockquotes, images).
- Dark mode toggles a `dark` class on `<html>`. `Layout.astro` sets this synchronously via an inline `<script>` before paint (avoids flash of wrong theme) based on `localStorage.theme` or `prefers-color-scheme`; `Header.astro` has the click handler that toggles and persists it.

### Components

- `Header.astro` / `Footer.astro` contain hardcoded navigation arrays (`nav`, `secondary`, `sections`, `social`) — these are not sourced from WordPress menus and must be updated manually if site sections change.
- `Welcome.astro` is unused leftover from the Astro starter template (not imported anywhere).

### Path aliases

`tsconfig.json` extends `astro/tsconfigs/strict`; no custom path aliases are configured — imports use relative paths (e.g. `../lib/wordpress`).
