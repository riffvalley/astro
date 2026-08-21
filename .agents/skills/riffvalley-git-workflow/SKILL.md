---
name: riffvalley-git-workflow
description: Define o aplica el ciclo Git/GitHub de Riff Valley al crear ramas de tarea, preparar commits, publicar cambios, abrir PRs, promover dev a main o gestionar hotfixes. Úsala para trabajo real con el repositorio, no para preguntas conceptuales aisladas de Git.
---

# Riff Valley Git Workflow

- `main` is production; `dev` is integration.
- Never work directly on `main` or `dev`.
- Create task branches from updated `dev`.
- For dependent work, confirm the previous PR is integrated into `dev`.
  Otherwise STOP.
- Never stage, commit, push, create a PR or merge without explicit
  authorization.
- Commit, push, PR creation and merge are separate authorization steps.
- Never force-push `main` or `dev`.
- Normal flow: dev → task branch → PR dev.
- Hotfix only: main → hotfix → PR main → sync dev.
