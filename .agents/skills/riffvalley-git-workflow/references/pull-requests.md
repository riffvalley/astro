# Pull requests y publicación

## Niveles de autorización

```text
LOCAL WORK  → crear rama, editar, ejecutar checks, revisar diff
PUBLICATION → commit, push, abrir PR
INTEGRATION → merge, borrar rama, promoción dev → main
```

No infieras permiso para el nivel siguiente. Que una tarea esté terminada no autoriza por sí sola commit, push, PR o merge.

## Commits y push

Cuando se autorice un commit, mantén una intención coherente y usa Conventional Commits cuando resulte útil:

```text
refactor(agenda): extract calendar grid logic
test(editorial): characterize review score parser
fix(agenda): prevent stale month responses
```

No disfraces un fix o feature como `refactor:`. El push requiere autorización explícita y publica únicamente la task branch autorizada. Nunca uses force push sobre `main` o `dev`.

## PR de task branch

El target normal es `dev`:

```text
refactor/agenda-calendar-grid → dev
```

Antes de abrirla, ejecuta los checks definidos para el cambio por `riffvalley-testing`, más `pnpm typecheck`, `pnpm test:run` cuando corresponda, `git diff --check` y revisión del diff. El workflow actual [`.github/workflows/quality.yml`](../../../../.github/workflows/quality.yml) añade instalación congelada, typecheck y unit tests al PR; no sustituye verificaciones específicas del slice.

El cuerpo del PR debe explicar:

```text
What         qué cambia
Why          por qué se realiza
Behavior     qué se preserva o qué cambia explícitamente
Verification checks ejecutados
Out of scope mejoras descubiertas que no se incluyeron
```

## Merge recomendado

Para una task branch pequeña y coherente, recomienda squash merge: conserva una historia limpia de una intención por PR y evita exponer commits intermedios de trabajo en `dev`.

No es una regla absoluta. Preservar commits puede aportar valor cuando representan slices independientes, ayudan a revisar un cambio complejo o facilitan bisect. En cualquier caso, CI verde no reemplaza revisar alcance y diff antes de integrar.

Las protecciones de rama recomendadas para el futuro son PR obligatorio, checks requeridos y prohibición de force push tanto en `main` como en `dev`; no las configures sin una tarea explícita.
