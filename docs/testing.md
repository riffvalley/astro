# Testing

The practical testing strategy for Riff Valley. Complements
[`architecture.md`](./architecture.md) (where code lives),
[`feature-development.md`](./feature-development.md) (building new
capabilities) and [`refactoring.md`](./refactoring.md) (changing existing
code safely).

## Principle

How much and how deep we test is driven by:

```
risk × complexity × probability of regression
```

Not a coverage percentage, not "every function gets a test," not testing
ceremony. A one-line getter and a pagination cursor calculation don't
deserve the same attention — the second one is where a regression is both
likely and expensive to notice late.

## What we test

In priority order:

- Pure logic — functions with no side effects, easy to test in isolation.
- Transformations — data reshaped from one form to another (API response →
  domain model, posts → home rails).
- Domain rules — the actual business logic (pagination cursor advancement,
  which posts land in which rail, retry/backoff behavior).
- API/HTTP contracts — the shape of a request and a response, not just
  "does it compile."
- Pagination — cursor/offset advancement, `hasMore`, page-append order.
- Reactive coordination / composables — loading/error state, concurrency
  guards, selection state.
- Edge cases that carry real risk — a truncation boundary, a 404, a
  malformed response — not every theoretically possible input.

## Characterization tests

Before a refactor that carries real risk, write tests against the
*existing* code first, to protect its current observable behavior,
contracts, errors and edge cases — including behavior that looks like it
might be a bug. The point is to know if it changes, not to judge whether it
should.

**Example — WordPress:** `features/editorial/tests/wordpress.test.ts`
includes `does NOT truncate when <!DOCTYPE is at index 0 (existing
behavior, not "fixed")` — a real test, protecting a real edge case of the
post-content truncation logic, written to lock in what the code actually
does today rather than what it "should" do. That's a characterization test
doing its job: it would fail loudly if a future change altered that
boundary, whether on purpose or by accident.

Don't reach for characterization tests to freeze internal implementation
that isn't at risk — a test that only breaks when a harmless internal
refactor happens is a maintenance cost with no regression-catching value.

## Pure logic

Vitest alone, no extra tooling, whenever the logic can be tested as a pure
function.

- **Agenda utils** — `features/agenda/tests/eventGrouping.test.ts`,
  `calendarGrid.test.ts`, `eventDerivations.test.ts`, `flagSlugs.test.ts`:
  each protects one pure transformation (grouping events by day, building
  the calendar grid, deriving flags) with plain input/output fixtures.
- **Home/editorial selection** —
  `features/editorial/tests/homeContent.test.ts` protects
  `buildHomeEditorialContent()`: which posts land in which home rail, given
  fixed-date fixtures so the selection logic is tested against comparisons
  between posts, never against the real clock.
- **`usePaginatedSocialFeed`** —
  `features/social/tests/usePaginatedSocialFeed.test.ts` tests the
  composable directly (no component mounting needed, since it holds no
  DOM): initial load, next page, the concurrency guard, exhausted
  pagination, error/retry, selection — plus one case shaped like
  Instagram's numeric-offset cursor and one shaped like Telegram's nullable
  cursor, proving the same abstraction covers both real schemes.

## API clients

For a new or changed API client, test:

- The URL and parameters actually sent.
- The mapping/contract — does the parsed result match what the client
  promises to return.
- The errors that matter — a non-ok HTTP status, a documented error shape,
  a network failure.
- Pagination/cursor behavior, when the client is paginated.

**Examples:** `features/social/tests/tiktok.test.ts` checks the exact
query string (`limit`/`offset`), the `/tiktok/videos/:id` path
(URL-encoded), a passthrough of a successful response, an `HTTP 500`, the
documented `404` shape, and network-failure propagation.
`lib/wordpressClient.test.ts` and
`features/editorial/tests/wordpress.test.ts` do the same for a heavier
contract: retry-on-429/5xx, giving up after the retry budget, no retry on a
non-transient status, and pagination via `hasNextPage`/`endCursor`
concatenated in order.

## Components / DOM

There is currently no general component-mounting or E2E infrastructure in
this repo. Don't install one as a default step for a new feature or
refactor — add it only when a real DOM-interaction risk justifies it (a
component whose logic genuinely depends on rendering, event handling, or
DOM measurement in a way a pure-function test can't capture).

A manual visual smoke check can complement tests when it adds real
confidence — e.g. confirming an Island against a real backend contract —
but it does not substitute for testing the underlying logic. A smoke check
that "looked fine" is not a regression net for complex logic; it doesn't
run again on the next change.

## What we usually do NOT test

- Trivial getters with no logic.
- Static markup with no behavior.
- Internal implementation details a user/consumer can't observe.
- Snapshots with no real assertion value.
- Trivial wrappers that just forward to something already tested.
- Framework code itself (Vue's reactivity, Astro's rendering) — trust the
  framework; test what we built on top of it.

## Test placement

Tests live with the owner of the capability, in a `tests/` folder next to
the code they protect:

- `features/<feature>/tests/` — e.g. `features/agenda/tests/`,
  `features/social/tests/`.
- `shared/tests/` — for the one shared util that has logic worth
  protecting (`shared/tests/formatDateLong.test.ts`).

Technical infrastructure can keep its test beside the `lib/` file it
protects instead — `lib/wordpressClient.test.ts` sits next to
`wordpressClient.ts`, because it's infrastructure, not a feature.

## Verification levels

During development or a refactor, in order:

1. Focused tests for what changed.
2. `pnpm test:run` (full suite).
3. `pnpm typecheck`.
4. `git diff --check`.
5. A full review of the diff.

A full build or a manual smoke check are extra steps, added only when the
scope actually justifies them — not a default step for every change.

## When to add new testing infrastructure

Only with a demonstrated need — a real piece of work that the current
setup genuinely can't cover, not a feeling that something is "missing."
Don't add `@vue/test-utils`, `jsdom`/`happy-dom`, Playwright, MSW, or
coverage tooling just because the project doesn't have them yet. Every one
of the examples above — including a Vue composable with async state and
concurrency guards — was tested with plain Vitest, no DOM, no mocking
framework beyond `vi.fn()`/`vi.stubGlobal()`.

## Definition of Done

- The regression this protects against is nameable — you can say what
  input/state would break without this test.
- The test checks observable behavior or a real contract, not
  implementation trivia.
- Fixtures are deterministic — no dependency on the real clock or network.
- The test lives in the right `tests/` folder, next to its owner.
- `pnpm test:run` and `pnpm typecheck` pass; the diff was reviewed in full.
- No new testing dependency was added without a real, stated need for it.

## Anti-patterns

1. **Chasing coverage** — adding tests to move a percentage instead of to
   protect a real regression.
2. **Testing implementation** — asserting on internals that would break on
   a harmless refactor and reveal nothing about actual behavior.
3. **Trivial snapshots** — a snapshot with no real assertion, that just
   flags "something changed" without saying whether it matters.
4. **Installing tooling before it's needed** — adding a mounting library,
   MSW, or Playwright speculatively, ahead of a real need.
5. **Fragile tests on the real clock or network** — a test that can flake
   because it depends on `Date.now()` or an actual HTTP call instead of a
   fixed fixture or a stub.
6. **Duplicating tests of the same contract** — re-proving something a
   sibling test (or the generic composable test) already covers, with no
   new behavior at stake.
7. **Skipping characterization before a risky refactor** — moving
   risk-carrying logic with no test protecting its current behavior first.
8. **Using a manual smoke check as the only protection for complex logic**
   — a one-time visual pass is not a regression net; it doesn't run again
   on the next change.
