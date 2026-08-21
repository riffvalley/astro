# Refactoring

A short operational guide for refactoring existing (often legacy) code in
Riff Valley without changing behavior unnecessarily. It assumes
[`architecture.md`](./architecture.md) for where things belong and
[`feature-development.md`](./feature-development.md) for how new capabilities
get built. This one is about changing the *structure* of code that already
exists and already works.

A refactor changes internal structure and preserves observable behavior. A
bugfix or a new feature changes behavior on purpose. If a piece of work is
both, separate them into distinct slices rather than folding a behavior
change into a "refactor" diff.

## The flow

```
AUDIT → CHARACTERIZATION → BOUNDARY → SMALL SLICE → VERIFY → RE-EVALUATE → PR
```

Each phase below is a checkpoint, not a phase you rush through to get to the
"real" work — the audit and the boundary decision are the real work; moving
the code is usually the easy part.

## Audit

Before touching anything, understand what's actually there:

- **Identify the real responsibilities** — what does this code actually do,
  not what its name or folder suggests it does.
- **Consumers** — who calls this, from where, with what expectations.
- **Ownership** — does a clear owner already exist, or is this exactly the
  kind of ownership gap a refactor should close?
- **Dependencies** — what does this code depend on, and what depends on it,
  in both directions.
- **Risk** — what breaks, and how visibly, if this goes wrong.
- **Debt vs. an architectural problem** — a messy file is debt; code that
  actively violates the dependency direction (`lib → features`, `feature A →
  feature B`) is an architectural problem and usually the higher-priority
  fix.

Don't decide the target folder structure or the number of PRs yet. Both
follow from what the audit finds, not the other way around.

## Characterization

Before moving logic that carries real risk, protect its current behavior
with tests — written against the *existing* code, before any structural
change. Protect observable behavior, real contracts, and known edge cases;
don't write tests for implementation trivia that would break on a harmless
internal change and tell you nothing about a regression. If the logic is
low-risk and trivially re-checkable by reading the diff, a characterization
test may not be worth writing — this is a judgment call driven by risk ×
complexity, not a mandate to test everything before every move.

## Boundary

Move a responsibility to the owner it actually belongs to — the feature (or
`lib`, or `shared`) whose domain it's part of, per `architecture.md`'s
placement rules. A few things that are not valid reasons to extract:

- **File size.** A file being long is not, on its own, a reason to split
  it — split when it holds more than one responsibility, not when it
  crosses a line count.
- **Anticipated reuse.** Don't create `shared/` for something only one
  consumer uses today, on the guess that a second one will show up.
- **Symmetry.** Don't create an abstraction because it would make the
  tree "look" more consistent with a sibling module.

Extract to `shared/` only once two or more features demonstrably need the
*same contract* — not a similar-looking piece.

## Small slices

Each slice does one thing with one clear, statable intention — "extract
this pure function," "move this file to its owning feature," "extract this
duplicated coordination into a composable." Verify after each slice, before
starting the next one, so a regression is caught at the slice that
introduced it, not three slices later.

A slice is not automatically a PR. Several small, related slices can land
in one PR; a single slice can also be its own PR if it's a meaningful,
independently reviewable unit. Decide that based on what's actually
reviewable, not on a slice-to-PR ratio fixed in advance.

## Verify

At minimum, proportional to what changed:

- Focused tests for the code that moved or changed.
- `pnpm test:run` (full suite).
- `pnpm typecheck`.
- `git diff --check`.
- A full review of the diff — confirm it has one understandable intent and
  nothing unrelated snuck in.

Add a visual/manual smoke check only when it adds real confidence beyond
what the tests and typecheck already gave you — e.g. an Island wired
through a real backend contract — not as a default final step for every
refactor.

## Re-evaluate

After each slice, decide explicitly:

- **Continue** to the next planned slice.
- **Stop** — the goal that motivated this refactor is met.
- **Change the boundary** — something learned during this slice changes
  where the next one should cut.
- **Declare DONE** and write up what's left as known, intentional debt.

Don't keep refactoring neighboring code just to make the tree visually
symmetric once the original problem is solved.

## Behavior preservation

Keep structural change and functional change in separate slices (and
usually separate PRs). If a refactor surfaces a real bug or a piece of
debt, record it — don't silently fix it inside the same diff. A refactor
that also "fixes a bug it happened to notice" makes both changes harder to
review and impossible to revert independently.

## Definition of Done

- The audited responsibility now has one clear owner.
- Dependency direction holds — no new `feature A → feature B`, no new
  `lib/shared → features`.
- Characterization tests (where the risk justified them) pass against the
  refactored code exactly as they did against the original.
- `pnpm test:run` and `pnpm typecheck` pass; `git diff --check` is clean.
- The diff has one understandable intent per slice/PR.
- Newly found bugs or debt are written down, not silently patched.
- Nothing was extracted, abstracted, or moved for size or symmetry alone.

## Real examples

**WordPress — characterization before splitting transport from parsing.**
`lib/wordpressClient.ts` (transport: `fetchGraphQL`, dev-disk caching,
in-memory caching — no notion of posts or reviews) and
`features/editorial/api/wordpress.ts` (parsing and domain shaping:
`getAllPosts`, `getCategories`, review-score extraction) are two different
responsibilities today. Getting there safely meant protecting the existing
parsing behavior with tests first, so the transport/parsing split could be
verified as behavior-preserving rather than trusted on inspection alone.

**Agenda — incremental extraction along real boundaries.** `features/agenda`
split `server/` (Google Calendar access, map data — server/build-only) from
`api/` (the browser fetch client) only because both kinds of code
genuinely touch the same domain; each extracted piece (`calendarGrid.ts`,
`eventGrouping.ts`, `eventDerivations.ts`, `flagSlugs.ts`, the
`agendaMonthRequestCoordinator`) got its own test alongside it, one
responsibility and one slice at a time — not a single big reorganization.

**Social — ownership first, common coordination only once duplication was
real.** Instagram and Telegram were unified under `features/social/` before
anything else, purely to close an ownership gap (they had no owning
feature). Only once both lived in the same feature did the duplicated
pagination/selection coordination between their grid islands become visible
— that's what justified extracting `usePaginatedSocialFeed`, after the
evidence existed, not before.

## Anti-patterns

1. **Big bang** — refactoring an entire module in one undifferentiated
   change instead of small, independently verifiable slices.
2. **Moving code by line count** — splitting a file because it's long, not
   because it holds more than one responsibility.
3. **Designing the target architecture before inspecting the real code** —
   deciding folders and abstractions from assumption instead of the audit.
4. **Opportunistic cleanup** — folding unrelated improvements into a
   refactor's diff because you're already in that file.
5. **Abstracting from a single occurrence** — extracting a shared piece
   with only one real consumer, anticipating a second one that hasn't
   shown up yet.
6. **Mixing a bugfix into a refactor** — changing behavior and structure in
   the same diff, making neither reviewable nor revertible on its own.
7. **Reopening an already-closed domain without new evidence** — revisiting
   a boundary decided in a previous refactor just because you're nearby,
   with no new fact that changes the original decision.
8. **Chasing a visually perfect tree** — continuing to refactor neighboring
   code for symmetry after the actual problem is already solved.
