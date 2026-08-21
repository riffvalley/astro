# Architecture

How code is organized under `src/` and why. Written for a new developer or an
AI agent who needs to know where something lives — or where to put something
new — without reading the whole codebase first.

## Mental model

- **`pages/`** — Astro routes. One file per URL (or a catch-all). Composition
  roots: fetch data for that route, lay out the page, drop in `app/` chrome
  and feature UI. No business logic.
- **`app/`** — the global shell around every page: header, footer, search,
  nav. Not tied to any one feature.
- **`features/`** — product capabilities (agenda, releases, national-releases,
  editorial, redactores, social). Each owns its data access, models,
  transforms and UI for that capability.
- **`shared/`** — small, framework-level pieces genuinely reused by two or
  more features. Not a default landing spot for "generic-looking" code.
- **`lib/`** — technical infrastructure and provider clients. Knows nothing
  about Riff Valley's product domain (posts, reviews, conciertos...).
- **`components/`** — presentational Astro/Vue pieces consumed directly by
  pages (post cards, rails, the redactores grid) that don't yet belong to a
  defined feature boundary. Consumes features' public exports; nothing
  depends on it.

## Dependency direction

```
pages, app, components  →  features, shared, lib
features                →  shared, lib
```

Forbidden:

```
shared    → features
lib       → features
feature A → feature B (internals)
```

`lib` and `shared` are the foundation everything else stands on. If either
started importing from a feature, a change inside that one feature could
silently break every other consumer of `lib`/`shared` — the exact opposite of
what a foundation is for. Features stay isolated from each other so that
touching `agenda` can never accidentally break `releases`; anything two
features would need from each other belongs in `shared`, but only once reuse
is real (see [Shared](#shared)).

## Pages

Example: `src/pages/index.astro` (Home).

What a page does:

- fetches the data its route needs (`getAllPosts()`, `getRedactores()`,
  `buildHomeEditorialContent()`...)
- decides layout and composition — which rails, which islands, in what order
- passes props down into `app/`, `features/*/components`, and `components/*`

What a page must **not** do:

- contain business logic (parsing, scoring, filtering) — that's the owning
  feature's job
- reach into a feature's internals, e.g. importing
  `features/agenda/utils/eventGrouping` directly instead of going through the
  feature's components/`api`/`index.ts`
- hold markup that other pages would also need — that belongs in
  `components/` or `shared/`, not duplicated page-local JSX/markup

Home stitches together `Layout`, presentational pieces from `components/`
(`LatestGrid`, `CategoryRail`, `ReviewsRail`, `MonthlyAlbumsSpotlight`,
`RedactoresGrid`, `SpotifyJukebox`), root Vue islands from two different
features (`AgendaCalendarIsland` from `agenda`, plus `InstagramGridIsland`,
`TelegramGridIsland` and `TikTokGridIsland` from `social`), and editorial
data built by `features/editorial`. It never parses post HTML or computes a
review score itself — `buildHomeEditorialContent()` does.

## App

`src/app/shell/` holds the chrome every page shares: `Header.astro`,
`Footer.astro`, `Search.astro`, `HeaderNavigation.astro`. `src/layouts/Layout.astro`
wraps them around `<slot />` for every route.

`Header.astro` is the representative example: it fetches posts via
`features/editorial/api/wordpress` and builds nav data via
`buildHeaderNavigation()` from `features/editorial`, then renders
`HeaderNavigation` and `Search`. It depends on a feature, never the reverse —
nothing in `features/editorial` knows the header exists.

Something belongs in `app/` when it wraps every page's chrome. If it just
happens to appear on several pages without being global shell, that's page
composition (or a `components/`/`shared/` piece consumed by those pages).

## Features

A feature owns one product capability end-to-end — data, transforms and UI —
with its internal folders shaped by real responsibilities, not by a fixed
template.

- **`agenda`** — concert calendar. `server/` (Google Calendar + map data,
  server/build-only), `api/` (browser fetch client), `model/` (domain types +
  calendar config), `components/` (including the root island
  `AgendaCalendarIsland.vue`), `composables/`, `utils/`.
- **`releases`** — "Guía de lanzamientos". `api/` (`discsClient.ts`),
  `model/`, `components/` (including the root island
  `GuiaLanzamientosIsland.vue`), `utils/`.
- **`national-releases`** — same shape as `releases` for its own capability:
  own `api/`, `model/`, `components/` (root island
  `NovedadesNacionalesIsland.vue`), `utils/`.
- **`editorial`** — WordPress content shaping: `api/wordpress.ts` (WPGraphQL
  access), `utils/editorialParsing.ts`, plus flat files
  (`headerNavigation.ts`, `homeContent.ts`, `reviewScore.ts`), all exposed
  through `index.ts`.
- **`redactores`** — a single `redactores.ts` file plus its test. No `api/`,
  `model/` or `components/` subfolders, because there's no UI or multiple
  responsibilities to split apart yet.
- **`social`** — one feature covering the site's social feeds, each
  provider kept distinct rather than unified behind a common model:
  `api/` (`instagram.ts`, `telegram.ts`, `tiktok.ts` — one client per
  provider), `components/` (root islands `InstagramGridIsland.vue`,
  `TelegramGridIsland.vue`, `TikTokGridIsland.vue`, each with its own
  provider-specific card/detail components, plus the shared
  `PhoneFrame.vue`/`PhoneMediaCarousel.vue` presentation shells),
  `composables/` (`usePaginatedSocialFeed.ts`, the pagination/selection
  coordination genuinely common to all three feeds), `tests/`.

**A feature does not need `api/`, `model/`, `components/`, `composables/` or
`server/` just because other features have them.** The subfolder structure
emerges from that feature's actual responsibilities — `redactores` is a
complete, legitimate feature as one file. Don't pre-create empty folders "for
symmetry" with `agenda` or `releases`.

## Islands

Vue islands are client-side composition roots, and they live inside their
owning feature's `components/` folder: `features/agenda/components/AgendaCalendarIsland.vue`,
`features/releases/components/GuiaLanzamientosIsland.vue`,
`features/national-releases/components/NovedadesNacionalesIsland.vue`,
`features/social/components/InstagramGridIsland.vue`,
`features/social/components/TelegramGridIsland.vue` and
`features/social/components/TikTokGridIsland.vue` — one root island per
provider, each still going through its own feature's shared
`usePaginatedSocialFeed` composable rather than three unrelated
implementations.

An island's job is to:

- own the client state that must survive across its children (selected
  month/year, checked filters, an open modal)
- coordinate fetching through its own feature's `api/` client and derive what
  its children need from the result
- delegate presentation to smaller Vue components from the same feature
  (`AgendaCalendarGrid`, `DiscRow`, `NationalRow`...) and to `shared/` where a
  piece is genuinely generic (`MonthYearPicker`, `ReleaseGroup`)

An island should not contain markup or business logic that belongs one level
down in its own feature, and it should not reach into another feature —
everything it needs about its own domain sits in sibling folders (`../model`,
`../utils`, `../api`).

## Shared

Rule: something moves to `shared/` only after real, demonstrated reuse across
two or more features — not because it looks generic.

- `shared/components/MonthYearPicker.vue` and `ReleaseGroup.vue` — used by
  both `GuiaLanzamientosIsland.vue` (releases) and
  `NovedadesNacionalesIsland.vue` (national-releases): the same month/year
  navigation and the same date-grouped list shell, actually shared.
- `shared/components/ColorPill.vue` — used by `releases` (`DiscRow`,
  `DiscModal`) and `national-releases` (`NationalRow`) for the same
  colored-label chip contract.
- `shared/utils/formatDateLong.ts` — the same date-formatting call, same
  locale rules, used by both release islands.

Visual similarity isn't enough on its own: two components can look alike
today and diverge tomorrow for reasons specific to their feature (one needs a
different data shape, the other a different locale rule). Promoting on looks
alone produces a shared abstraction that has to grow conditionals to serve
two unrelated masters. Promote once a second feature needs the *same
contract*, not just a similar shape.

## Lib

`lib/` holds technical infrastructure and provider clients with no knowledge
of Riff Valley's product domain — they'd look the same wired into any site
using the same providers.

`wordpressClient.ts` is the example: `fetchGraphQL`, `readDevCache`/
`writeDevCache`, retry/timeout handling — purely "how to talk to WPGraphQL
and cache it in dev", with no notion of posts, reviews, or redactores.
`features/editorial/api/wordpress.ts` and `features/redactores/redactores.ts`
both import it to build their own domain shapes on top.

`lib` must never depend on `features/`: it's the foundation more than one
feature stands on (both editorial and redactores sit on `wordpressClient`).
If `lib` imported from a feature, every other consumer of that `lib` module
would risk breaking whenever that one feature changed, and the dependency
graph would gain a cycle. The rest of `lib` follows the same shape —
`spotify.ts` (provider client), `apiBase.ts` (shared base URL — also the one
`features/social/api/*` clients build their request URLs from),
`colorContrast.ts`, `linkPlatform.ts` (technical algorithms) —
infrastructure, not product logic.

## Server/client boundaries

Not every feature needs this, but when a feature's code genuinely splits
between server-only and browser code, keep them physically apart. `agenda` is
the current example:

- `features/agenda/api/` — the browser fetch client (`agendaClient.ts`)
  called from the island; runs in the visitor's browser.
- `features/agenda/server/` — `googleCalendar.ts` and `spainMap.ts`,
  server/build-only: they hold the Google Calendar API-key handling and the
  heavy geo computation (`d3-geo`/`topojson`) that must never ship to the
  client bundle.

This split exists because agenda genuinely has both kinds of code touching
the same domain — it isn't a folder pair every feature must have.
`redactores`, for instance, fetches everything from WordPress at build time
with no browser client at all, and that's a complete, correct feature.

## Testing placement

Tests live in a `tests/` folder next to the code they protect, owned by the
same module:

- `features/agenda/tests/googleCalendar.test.ts` protects
  `features/agenda/server/googleCalendar.ts`.
- `features/agenda/tests/agendaResumenEndpoint.test.ts` protects the
  `pages/api/agenda-resumen.json.ts` endpoint's contract — an endpoint's test
  lives with the feature it serves, not in `pages/`.
- `features/editorial/tests/wordpress.test.ts` protects
  `features/editorial/api/wordpress.ts`.
- `lib/wordpressClient.test.ts` stays in `lib/`, next to
  `wordpressClient.ts` — it's infrastructure, not a feature.
- `shared/tests/formatDateLong.test.ts` protects the one shared util that has
  logic worth protecting.

This is about *where* tests live, not testing strategy — see the project's
testing policy for what to test and at which level.

## Decision guide

"Where should this code go?"

- A specific product capability (calendar, releases guide, redactores) →
  **feature**
- A technical provider/infrastructure client with no product knowledge →
  **lib**
- The exact same contract already needed by two or more features → **shared**
- Fetching or laying out one route → **page**
- Chrome present on every page (header, footer, search) → **app**
- A presentational piece consumed by pages that doesn't yet own a feature
  boundary → stays in **`components/`** until a real capability justifies
  extracting it

## Anti-patterns

- A feature importing another feature's internals directly (e.g.
  `features/releases` reaching into `features/agenda/utils/...`) instead of
  going through a public surface, or promoting the shared need to `shared/`.
- `lib/` importing from `features/` — inverts the dependency direction the
  whole tree relies on.
- Promoting something to `shared/` on visual similarity alone, before a
  second feature actually needs the same contract.
- Creating `api/`/`model/`/`components/`/`composables/` folders in a new
  feature "for symmetry" with agenda/releases, before there's real code to
  put in them.
- Splitting a file because it crossed a line-count threshold, not because it
  holds more than one responsibility.
- Extracting a microcomponent with no real reuse and no presentational
  boundary of its own.
- Moving a file only to match another module's folder shape, with no
  dependency or ownership reason behind it.
