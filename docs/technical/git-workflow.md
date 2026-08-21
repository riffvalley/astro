# Git workflow

El flujo Git práctico de Riff Valley — para humanos y para un agente
trabajando en este repo. Complementa [`architecture.md`](./architecture.md),
[`feature-development.md`](./feature-development.md),
[`refactoring.md`](./refactoring.md) y [`testing.md`](./testing.md), que
cubren qué construir y cómo; este documento cubre cómo el trabajo aterriza
realmente en el repo.

## Modelo

- `main` — producción, estable.
- `dev` — rama de integración. El trabajo normal empieza aquí.
- Una tarea → una rama dedicada.
- Target normal de PR: `dev`.
- Release: `dev` → `main`.
- Hotfix: rama desde `main`, luego sincroniza el fix de vuelta a `dev`.

## Flujo normal

```
dev updated → task branch → implementation → verification → review
            → stage → commit → push → PR to dev → merge
```

## Importante: la autorización no es implícita

**Stage, commit, push, abrir un PR, y hacer merge son cinco acciones
separadas.** Ninguna implica a otra, y ninguna está implícita por que se
te pida implementar o revisar algo.

Si una tarea dice "implementa X" o "revisa Y", eso no es autorización para
tocar el estado de Git. Cuando un agente trabaja de forma interactiva, no
hace stage, commit, push, abre un PR, ni hace merge sin que el usuario
pida explícitamente esa acción concreta —pedir una de las cinco nunca
autoriza la siguiente. "Crea el PR" no es "haz merge de él". "Haz commit
de esto" no es "haz push de ello".

## Empezar el trabajo

- Comprueba el working tree antes de hacer nada — `git status`. Si hay
  cambios preexistentes, ver [Working tree sucio](#working-tree-sucio)
  más abajo antes de continuar.
- Actualiza `dev` (`git fetch`, confirma que el `dev` local coincide con
  `origin/dev`).
- Crea la rama de tarea a partir de ese `dev` ya actualizado.
- Si esta tarea depende del trabajo de otro PR, confirma que ese PR ya
  está mergeado en `dev`. Si no lo está: **STOP** y dilo — no ramifiques
  desde trabajo que todavía no está ahí.

Nunca descartes cambios que no forman parte de la tarea actual, aunque
parezcan no relacionados o en progreso — pueden pertenecer a otra persona,
o a trabajo del que no tienes contexto completo.

## Nombrar ramas

Prefijos prácticos, no una taxonomía rígida: `feat/`, `fix/`, `refactor/`,
`test/`, `docs/`, `chore/`. Ramas reales del historial de este repo:
`refactor/agenda-calendar-grid`, `refactor/header-navigation`,
`fix/agenda-provider-resilience`, `feat/disco-semana-app-row`,
`chore/git-workflow-skill`. Nombra la rama según lo que hace, de forma
breve — no la sobreformalices con tickets/fechas/scopes que nadie va a
buscar.

## Verificación antes de escribir en Git

Antes de hacer stage de nada:

- Los tests apropiados para lo que cambió.
- `pnpm test:run`, cuando el cambio toca código testeado.
- `pnpm typecheck`.
- `git diff --check`.
- Revisa el diff real y `git status` — confirma que coincide con lo que
  pretendías cambiar, nada más.

## Stage

Haz stage solo de los archivos que la tarea realmente tocó. Nunca metas de
un barrido cambios no relacionados o preexistentes con un `git add -A` a
ciegas sin comprobar antes `git status` — un archivo no relacionado
colándose en un commit es una violación silenciosa de alcance, no una
comodidad.

## Commit

[Conventional Commits](https://www.conventionalcommits.org/). Ejemplos
reales del historial de este repo y de esta línea de trabajo:

```
feat(social): add TikTok feed
refactor(header): extract navigation shell component
docs: document project architecture
```

Una intención coherente por commit — un commit que mezcla un refactor con
un cambio de comportamiento es exactamente el anti-patrón contra el que
avisa `refactoring.md`, solo que a nivel de historial de Git en vez de a
nivel de código.

## Push

- Nunca hagas force-push de `main` ni `dev`.
- Nunca hagas push directo a `main` ni `dev` — el trabajo ocurre en una
  rama de tarea.
- Haz push de la rama de tarea solo después de que el commit esté
  autorizado *y* el push en sí esté autorizado — ver
  [Importante](#importante-la-autorización-no-es-implícita).

## Pull requests

Forma normal: rama de tarea → `dev`.

Un PR debe:

- Tener un alcance coherente — la misma regla de "una intención clara"
  que un commit, a mayor escala.
- Explicar qué comportamiento se preservó y qué cambió — un revisor no
  debería tener que inferirlo solo a partir del diff.
- Incluir la verificación relevante para él (tests ejecutados, typecheck,
  una comprobación de humo cuando aportó valor real).
- No arrastrar deuda o limpieza no relacionada encontrada por el camino —
  anótala aparte (ver la regla de preservación de comportamiento de
  `refactoring.md`), no la metas dentro solo porque el PR ya estaba
  abierto.

Una plantilla mínima de descripción de PR:

```
What          what changes
Why           why this change
Behavior      what's preserved / what changes
Verification  checks run
Out of scope  debt or cleanup found but not included
```

## Merge

Estar autorizado para abrir un PR no es estar autorizado para hacerle
merge — pregunta de nuevo, específicamente, antes de mergear.

Prefiere squash merge para una rama de tarea pequeña y coherente — mantiene
el historial de `dev` como una intención por PR en vez de exponer commits
intermedios en progreso. Esto no es absoluto: preservar los commits
individuales puede merecer la pena cuando representan slices
independientemente significativos, o hacen que un cambio complejo sea más
fácil de revisar o de bisecar más adelante.

Después de un merge:

- Actualiza el `dev` local antes de empezar la siguiente tarea
  (fast-forward, no asumas que ocurrió automáticamente).
- Si la siguiente tarea depende de esta, confirma que el merge realmente
  aterrizó en `dev` (no solo que el PR muestre "merged" — comprueba el
  propio `dev`) antes de ramificar desde ahí.

## Release (dev → main)

Un PR representa el estado integrado que se está promoviendo: `dev` →
`main`. No abras un PR separado a `main` por cada rama de tarea una vez
que ya está en `dev` — el PR de promoción es un paso único y deliberado,
no automático.

Antes de promover, confirma:

- CI está en verde.
- Los cambios incluidos son conocidos — sin trabajo sorpresa o
  experimental colándose.
- Se ha hecho cualquier validación manual que el alcance necesite.
- Estado/preparación de deploy, si es relevante.

Después de promover, comprueba si `main` y `dev` siguen alineados (un
merge commit en `main` puede dejarlos divergidos) y sincroniza `dev` desde
`main` si hace falta — nunca haciendo force-push de ninguna de las dos
ramas.

## Hotfix

```
main → hotfix/* → PR to main → sync the change back into dev
```

Se usa solo para un fix que no puede esperar al camino normal de release
`dev → main`. Todo lo demás sigue las mismas reglas que el flujo normal —
rama dedicada, verificación antes de escribir en Git, autorización
explícita en cada paso.

## Working tree sucio

Si `git status` muestra cambios que no hiciste como parte de esta tarea:

- Identifica qué son y, si es posible, de quién son — no des por hecho
  que es seguro ignorarlos o incluirlos.
- No los borres.
- No los metas en tu commit automáticamente.
- Si no bloquean aislar tu propio cambio (archivos distintos, sin
  solape), trabaja alrededor de ellos — haz stage y commit solo de tus
  archivos.
- Si sí bloquean un aislamiento limpio de tu tarea, **STOP** y
  comunícalo en vez de resolverlo unilateralmente.

## Operaciones prohibidas

- Commit o push directo a `main` o `dev`.
- Force-push de `main` o `dev`.
- Descartar cambios que no son tuyos para descartar.
- Mezclar tareas no relacionadas en una rama, commit, o PR.
- Tratar "el commit estaba autorizado" como "el push está autorizado".
- Tratar "el PR estaba autorizado" como "el merge está autorizado".

## Referencia rápida

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
