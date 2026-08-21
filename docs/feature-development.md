# Feature development

A short operational guide for building a new product capability in Riff
Valley — or extending an existing one — without re-deriving the architecture
from scratch each time. It complements [`architecture.md`](./architecture.md)
(the map of where things live) with the *process* of getting from a
requirement to a merged PR.

Read this before starting a new feature, before deciding whether something
extends an existing feature, and before splitting work into PRs.

## The flow

```
requirement → inspect → ownership → boundary → contrato/API
            → riesgo/tests → implementación por slices → verificación → PR
```

1. **Requirement.** State the actual capability in product terms ("add
   TikTok as a third social feed"), not as a technical task ("add a Vue
   component"). If you can't name the capability, you're not ready to place
   the code yet.

2. **Inspect.** Look at what already exists that's adjacent to this
   requirement — sibling features, existing components, existing API
   clients. Don't design in a vacuum; the answer to "where does this go" is
   usually already visible in the repo.

3. **Ownership.** Decide which feature (existing or new) owns this
   capability end-to-end: data access, models, transforms, UI. One clear
   owner, not code scattered across `components/` and `lib/` because nobody
   decided.

4. **Boundary.** Declare what's in and out before writing code. What does
   this capability *not* do? What does it deliberately not share with its
   neighbors yet? A boundary written down before implementation is much
   cheaper to keep than one inferred afterward from a sprawling diff.

5. **Contrato/API.** Pin down the external contract — the backend endpoint
   shape, the fields, the pagination scheme — *before* writing the client
   against it. A contract you haven't verified against the real
   provider is a guess, not a boundary.

6. **Riesgo/tests.** Decide what could regress and at what cost, then choose
   the cheapest test level that catches it (see
   [Testing by risk](#testing-by-risk-complexity-regression) below). Decide
   this before implementing, not as an afterthought once the code exists.

7. **Implementación por slices.** Build in the smallest coherent steps that
   each preserve a working state. Don't design the whole capability's final
   shape up front — let structure emerge from what the slice actually needs
   (see [Emergent structure](#emergent-structure-never-a-template)).

8. **Verificación.** Run the tests that matter for what changed, typecheck,
   review the full diff, and — when viable — a visual/manual smoke check
   against a real backend. "It compiles" is not "it works."

9. **PR.** Small, reviewable, one clear intent per PR. See
   [Don't fix the PR count upfront](#dont-fix-the-pr-count-upfront).

## Existing feature vs. new feature

Ask: does this capability already have an owner?

- **Extends an existing feature** when it's the same product capability
  gaining a new facet (a new filter on `releases`, a new field on
  `agenda`'s calendar model). It belongs in that feature's existing
  folders.
- **New feature** when it's a genuinely distinct capability with its own
  data, its own UI, and its own reason to change independently — even if it
  *looks* similar to something else. Two things that resemble each other
  today can diverge tomorrow for reasons specific to each; don't merge them
  into one feature just because the surface looks alike.
- **Not sure yet** → don't create the feature folder yet. Keep the code
  where it naturally sits (often `components/`, per `architecture.md`'s
  "Decision guide") until a second real consumer or a clearer boundary
  shows up. Creating a feature to "future-proof" is the same mistake as
  creating `shared/` on looks alone.

## Placement cheatsheet

- **`pages/`** — composition roots. A page fetches the data its *route*
  needs, decides layout, and wires `app/` chrome + feature UI together. It
  never contains business logic (parsing, scoring, filtering) — that's the
  owning feature's job — and it never reaches into a feature's internals
  instead of its public surface.
- **`app/`** — the shell every page shares (header, footer, search, nav).
  Something belongs here only if it wraps *every* page, not just several of
  them.
- **`lib/`** — technical infrastructure and provider clients with zero
  knowledge of Riff Valley's product domain. `apiBase.ts`, `spotify.ts`,
  `wordpressClient.ts` — they'd look the same wired into any site using the
  same providers.
- **`shared/`** — only after two or more features demonstrably need the
  *same contract*, not just a similar-looking piece. `MonthYearPicker.vue`
  earned its place in `shared/` because both `releases` and
  `national-releases` needed the identical month/year navigation contract —
  not because "date pickers are generic."
- **`features/*`** — a product capability, owning its data, transforms and
  UI end-to-end.

## Feature A must never import Feature B

`features/releases` reaching into `features/agenda/utils/...` directly is
forbidden, no matter how convenient. If two features need the same thing,
that need goes through `shared/` (once reuse is real) — never through one
feature quietly depending on another's internals. This is what keeps a
change inside `agenda` from ever silently breaking `releases`.

## Emergent structure, never a template

A new feature does not get `api/`, `model/`, `components/`, `composables/`
and `server/` by default "for symmetry" with `agenda` or `releases`.
`redactores` is a complete, correct feature as a single file — because
there was no second responsibility to split apart yet. Create a subfolder
when a real responsibility needs it, not before.

## Server/client boundaries (when they exist)

Not every feature has this split — only introduce it when a feature
genuinely has both server-only code (API keys, heavy build-time
computation) and browser code touching the same domain. `agenda`'s
`server/` (Google Calendar access, map data) vs. `api/` (the browser fetch
client) is the current example. A feature with no server-only concern
(`redactores`, fetching everything at build time) has no `server/` folder,
and that's correct — not incomplete.

## Testing by risk × complexity × regression

Don't test by line count, file count, or a coverage percentage target.
Decide what you're protecting:

- Pure logic (pagination cursor math, a mapping function) → unit test, the
  cheapest level that catches a real regression.
- UI behavior → component-level, testing observable states, not internals.
- A cross-cutting journey → integration/E2E, sparingly.

Test the contract you just built (a new API client, a new composable) when
getting it wrong would be expensive to notice later — not everything that
changed, and not implementation trivia that would break on a harmless
refactor.

## Don't fix the PR count upfront

Don't decide "this will be 3 PRs" before you understand the actual work.
Slice by coherent, behavior-preserving (or clearly-scoped-new-behavior)
units as you learn what the work actually requires. A capability that
turns out simpler than expected deserves fewer PRs; one that reveals real
shared coordination you didn't expect deserves an extra slice once that
evidence exists — not before.

## Definition of Done

- The capability's boundary (in/out) is written down or obvious from the
  diff.
- Ownership is unambiguous — no logic scattered outside the owning
  feature.
- The external contract (if any) is verified against the real provider,
  not assumed from a spec alone.
- Dependency direction holds: no `feature A → feature B`, no
  `lib/shared → features`.
- Tests match real risk, not a arbitrary quota; they pass.
- Typecheck passes; the diff has one clear, reviewable intent.
- Existing, unrelated behavior is provably unchanged (diff review, and a
  smoke check when a live backend is involved).

## Worked example: adding TikTok to Social

This is not a history of the refactor — just the same flow above, seen
through one real capability.

**Requirement → inspect → ownership.** "Add TikTok as a third social feed"
first meant looking at what *Social* already was: Instagram and Telegram
lived as two unrelated pairs — `lib/instagram.ts` /`lib/telegram.ts` plus
grid/card/detail Vue components sitting directly in `components/vue/`, with
no feature owning them. Before TikTok could reuse anything, that ownership
gap had to close. That's what created `features/social/` — moving the
existing Instagram/Telegram code into `api/` and `components/`, changing
nothing about their behavior. Two platforms that already existed were the
*evidence* a `social` feature was real, not a guess that one might be
useful someday.

**Boundary → duplicated coordination.** Only once Instagram and Telegram
sat side by side inside the same feature did it become visible that their
grid islands duplicated real coordination logic — loading/error state, the
concurrency guard, cursor advancement, page-append, selection/detail state.
That duplication was extracted into
`features/social/composables/usePaginatedSocialFeed.ts` — generic over
post type and cursor type — *because the evidence already existed*, not in
anticipation of a third platform. `IntersectionObserver` and viewport/scroll
handling stayed in each Island: that part is genuinely browser/DOM-specific
per Island, with no clean shared boundary, so it wasn't forced into the
composable.

**Contrato/API before the client.** TikTok's backend contract — endpoint
shape, fields, pagination (`limit`/`offset`, `hasMore` from the backend) —
was pinned down and verified against the real backend *before* the final
client shipped. The first version of that contract had a wrong endpoint
path; it surfaced immediately once verified against production, and got
corrected (`/tiktok/videos`, not `/videos`) before the feature was
considered done. Closing the contract early — and actually checking it,
not just trusting the spec — is what caught that mismatch before it shipped
as a silent bug.

**Implementation by slices, reusing what already fit.**
`features/social/api/tiktok.ts` followed the exact same shape as
`instagram.ts`/`telegram.ts` (same error handling, same minimal parsing).
`TikTokGridIsland.vue` reused `usePaginatedSocialFeed` (offset cursor, same
as Instagram's scheme) and reused `PhoneFrame` (extending its
`platformIcon` union with `'tiktok'`). `PhoneMediaCarousel` was **not**
reused for the detail view: TikTok's detail has one cover image and an
oEmbed-style link/HTML, not several navigable raw-media slides — forcing
the carousel onto a shape it wasn't built for would have been ceremony, not
reuse. No `SocialPost` model was created to unify Instagram, Telegram and
TikTok's very different post shapes — each platform kept its own type.

**Home integration.** Once the third Island existed, `pages/index.astro`'s
change was two lines: one new import, and the home's `phone-trio` swapping
its second (duplicated) Telegram slot for the new `TikTokGridIsland`. The
page didn't gain any new logic — it composed one more root, exactly what a
composition root is for.

**The lesson:** reuse boundaries that reuse has already demonstrated —
don't force an abstraction (a shared post model, a shared media carousel, a
shared DOM-lifecycle hook) ahead of the evidence that it's the same
contract, not just a similar shape.

## Anti-patterns

1. Designing a feature's final folder structure before writing any real
   code for it — copying `agenda`'s shape "for symmetry" instead of letting
   subfolders emerge from actual responsibilities.
2. Trusting a backend contract from a spec alone and building the client
   against it without verifying it against the real provider.
3. Creating a shared abstraction (a common model, a shared component) from
   visual or structural similarity alone, before a second consumer needs
   the *same contract*.
4. One feature importing another feature's internals directly instead of
   going through its public surface or promoting real reuse to `shared/`.
5. Forcing a generic-looking component (carousel, list, picker) onto a
   shape it wasn't built for, just because "we already have one."
6. Fixing the number of PRs or the final architecture before understanding
   what the work actually requires.
7. Putting business logic in a page or in `app/` shell instead of in the
   owning feature.
8. Extracting shared coordination logic speculatively, before two real
   consumers demonstrate the duplication is real.
