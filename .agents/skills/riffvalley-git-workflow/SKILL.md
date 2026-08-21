---
name: riffvalley-git-workflow
description: Define o aplica el ciclo Git/GitHub de Riff Valley al crear ramas de tarea, preparar commits, publicar cambios, abrir PRs, promover dev a main o gestionar hotfixes. Úsala para trabajo real con el repositorio, no para preguntas conceptuales aisladas de Git.
---

# Riff Valley Git Workflow

Guardrails mínimos para cualquier acción Git real. Para naming, ejemplos de
commit, plantilla de PR, squash merge y el checklist de promoción
`dev → main`, ver [`docs/technical/git-workflow.md`](../../../docs/technical/git-workflow.md) —
esta skill no lo duplica.

- `main` is production; `dev` is integration. Never work directly on
  either.
- Create task branches only from an updated `dev` — fetch and
  fast-forward first, don't assume local `dev` is current.
- If the task depends on another PR's work, confirm that PR is actually
  merged into `dev` first. If it isn't: **STOP**.
- Stage, commit, push, opening a PR, and merging are five separate
  authorizations. None is implied by another, and being asked to
  implement or review something authorizes none of them. Creating and
  working on a local branch doesn't authorize publishing it.
- Never touch, discard, or silently include changes that aren't part of
  the current task. If the working tree isn't clean before you start,
  identify what's there and say so — don't stash, reset, or discard it
  automatically.
- Never push directly to `main` or `dev`. Never force-push either.
- Normal flow: task branch → PR to `dev`.
- Hotfix: branch from `main` → PR to `main` → sync the fix back into
  `dev`.
