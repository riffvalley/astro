---
name: riffvalley-git-workflow
description: Define o aplica el ciclo Git/GitHub de Riff Valley al crear ramas de tarea, preparar commits, publicar cambios, abrir PRs, promover dev a main o gestionar hotfixes. Úsala para trabajo real con el repositorio, no para preguntas conceptuales aisladas de Git.
---

# Git workflow de Riff Valley

Esta skill gobierna el ciclo de vida Git/GitHub: base y nombre de rama, commit, push, PR, merge y promoción. No decide arquitectura, comportamiento ni qué tests hacen falta.

## Principios

- `main` es producción estable; `dev` integra cambios antes de promocionarlos. No se trabaja directamente en ninguna de las dos.
- Una task branch representa una sola intención y, normalmente, nace de `dev` actualizado.
- El flujo normal es `task branch → PR a dev → PR dev → main`. Nunca se hace el doble merge `task → dev` y después `task → main`.
- Hotfixes urgentes nacen de `main`, se integran en `main` y se sincronizan de vuelta a `dev`.
- Crear rama y trabajar localmente no autoriza commit, push, PR ni merge. Cada nivel de publicación requiere autorización explícita.

Antes de editar, comprueba el árbol de trabajo y la base de la rama. No ocultes, descartes ni mezcles cambios locales no relacionados. Consulta [branching.md](references/branching.md).

## Workflow resumido

1. Define el slice con la skill de producto aplicable; para refactors, `riffvalley-refactoring` define alcance, riesgo y stop condition.
2. Confirma árbol limpio o que los cambios presentes pertenecen a la tarea; actualiza referencias y `dev` mediante fast-forward cuando proceda.
3. Crea una rama `feat/`, `fix/`, `refactor/`, `test/`, `chore/`, `docs/` o `hotfix/` con nombre corto en kebab-case.
4. Implementa sólo ese alcance, ejecuta la protección definida por `riffvalley-testing` y revisa el diff.
5. Detente cuando el slice esté listo. Publica únicamente cuando el usuario autorice el siguiente nivel.

Para nombres, base y sincronización, consulta [branching.md](references/branching.md). Para PRs y estrategia de merge, consulta [pull-requests.md](references/pull-requests.md). Para promociones, consulta [releases.md](references/releases.md). Para producción urgente, consulta [hotfixes.md](references/hotfixes.md).

## Seguridad y autoridad

- No hagas push directo ni force push sobre `main` o `dev`.
- No abras, merges ni elimines ramas/PRs sin autorización explícita.
- No conviertas CI verde en permiso para integrar: revisa alcance y diff.
- `riffvalley-testing` decide qué proteger; esta skill exige ejecutar esa protección antes de publicar.
- `riffvalley-refactoring` decide el slice; esta skill decide su rama y ciclo de PR.

## Checklist

- ¿La rama representa una sola intención y parte de la base correcta?
- ¿El árbol de trabajo contiene únicamente cambios conocidos de la tarea?
- ¿Se ejecutaron los checks relevantes, `pnpm typecheck`, `pnpm test:run` cuando corresponda y `git diff --check`?
- ¿El target de la PR es `dev`, salvo hotfix urgente o promoción `dev → main`?
- ¿La autorización recibida cubre exactamente commit, push, PR o merge?
- ¿El diff y los cambios fuera de alcance se han revisado antes de publicar?
