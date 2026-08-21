# Git workflow

The practical Git flow for Riff Valley — for humans and for an agent working
in this repo. Complements [`architecture.md`](./architecture.md),
[`feature-development.md`](./feature-development.md),
[`refactoring.md`](./refactoring.md) and [`testing.md`](./testing.md), which
cover what to build and how; this one covers how the work actually lands in
the repo.

## Model

- `main` — production, stable.
- `dev` — integration branch. Normal work starts here.
- One task → one dedicated branch.
- Normal PR target: `dev`.
- Release: `dev` → `main`.
- Hotfix: branch from `main`, then sync the fix back into `dev`.

## Normal flow

```
dev updated → task branch → implementation → verification → review
            → stage → commit → push → PR to dev → merge
```

## Important: authorization is not implicit

**Stage, commit, push, opening a PR, and merging are five separate
actions.** None of them is implied by another, and none of them is implied
by being asked to implement or review something.

If a task says "implement X" or "review Y," that is not authorization to
touch Git state. When an agent is working interactively, it does not stage,
commit, push, open a PR, or merge without the user explicitly asking for
that specific action — asking for one of the five never authorizes the
next one. "Create the PR" is not "merge it." "Commit this" is not "push
it."

## Starting work

- Check the working tree before doing anything — `git status`. If there
  are pre-existing changes, see [Dirty working tree](#dirty-working-tree)
  below before proceeding.
- Update `dev` (`git fetch`, confirm local `dev` matches `origin/dev`).
- Create the task branch from that updated `dev`.
- If this task depends on another PR's work, confirm that PR is actually
  merged into `dev` first. If it isn't: **STOP** and say so — don't branch
  from work that isn't there yet.

Never discard changes that aren't part of the current task, even if they
look unrelated or in-progress — they may belong to someone else, or to work
you don't have full context on.

## Branch naming

Practical prefixes, not a rigid taxonomy: `feat/`, `fix/`, `refactor/`,
`test/`, `docs/`, `chore/`. Real branches from this repo's history:
`refactor/agenda-calendar-grid`, `refactor/header-navigation`,
`fix/agenda-provider-resilience`, `feat/disco-semana-app-row`,
`chore/git-workflow-skill`. Name the branch after what it does, briefly —
don't over-formalize with tickets/dates/scopes nobody will look up.

## Verification before Git writes

Before staging anything:

- The tests appropriate to what changed.
- `pnpm test:run`, when the change touches tested code.
- `pnpm typecheck`.
- `git diff --check`.
- Review the actual diff and `git status` — confirm it matches what you
  intended to change, nothing more.

## Stage

Stage only the files the task actually touched. Never sweep in unrelated or
pre-existing changes with a blanket `git add -A` without checking `git
status` first — an unrelated file riding along in a commit is a silent
scope violation, not a convenience.

## Commit

[Conventional Commits](https://www.conventionalcommits.org/). Real examples
from this repo's history and this line of work:

```
feat(social): add TikTok feed
refactor(header): extract navigation shell component
docs: document project architecture
```

One coherent intent per commit — a commit that mixes a refactor with a
behavior change is exactly the anti-pattern `refactoring.md` warns about,
just at the Git-history level instead of the code level.

## Push

- Never force-push `main` or `dev`.
- Never push directly to `main` or `dev` — work happens on a task branch.
- Push the task branch only after commit is authorized *and* push itself is
  authorized — see [Important](#important-authorization-is-not-implicit).

## Pull requests

Normal shape: task branch → `dev`.

A PR should:

- Have one coherent scope — the same "one clear intent" rule as a commit,
  at a larger grain.
- State what behavior was preserved and what changed — a reviewer
  shouldn't have to infer that from the diff alone.
- Include the verification that's relevant to it (tests run, typecheck,
  a smoke check when one added real value).
- Not carry unrelated debt or cleanup found along the way — write that
  down separately (see `refactoring.md`'s behavior-preservation rule),
  don't fold it in because the PR was already open.

## Merge

Being authorized to open a PR is not being authorized to merge it — ask
again, specifically, before merging.

After a merge:

- Update local `dev` before starting the next task (fast-forward, don't
  assume it happened automatically).
- If the next task depends on this one, confirm the merge actually landed
  on `dev` (not just that the PR shows "merged" — check `dev` itself)
  before branching from it.

## Hotfix

```
main → hotfix/* → PR to main → sync the change back into dev
```

Used only for a fix that can't wait for the normal `dev → main` release
path. Everything else about it follows the same rules as the normal
flow — dedicated branch, verification before Git writes, explicit
authorization at each step.

## Dirty working tree

If `git status` shows changes you didn't make as part of this task:

- Identify what they are and, if possible, whose they are — don't guess
  that they're safe to ignore or safe to include.
- Don't delete them.
- Don't sweep them into your commit automatically.
- If they don't block isolating your own change (different files, no
  overlap), work around them — stage and commit only your files.
- If they do block a clean isolation of your task, **STOP** and surface it
  instead of resolving it unilaterally.

## Forbidden operations

- Direct commit or push to `main` or `dev`.
- Force-pushing `main` or `dev`.
- Discarding changes that aren't yours to discard.
- Mixing unrelated tasks into one branch, commit, or PR.
- Treating "commit was authorized" as "push is authorized."
- Treating "PR was authorized" as "merge is authorized."

## Quick reference

```
1. git status                      — check the tree before anything else
2. git fetch && confirm dev is current
3. (dependent work?) confirm the prior PR is merged into dev — else STOP
4. git checkout -b <prefix>/<name> from dev
5. implement
6. run focused tests, pnpm test:run, pnpm typecheck, git diff --check
7. review the full diff and git status
8. stage only this task's files            — needs authorization
9. commit, one clear intent, Conventional Commits — needs authorization
10. push the task branch                    — needs authorization
11. open PR to dev, coherent scope, state behavior kept/changed — needs authorization
12. merge                                   — needs its own authorization
13. update local dev before the next task
```
