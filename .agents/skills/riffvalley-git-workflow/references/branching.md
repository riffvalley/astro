# Ramas de tarea

## Roles

```text
main  → producción / versión estable
dev   → integración previa a promoción
task  → una intención concreta
```

`main` es la rama por defecto actual del repositorio. `dev` es la base normal de trabajo. No desarrolles directamente sobre ninguna de las dos.

## Crear una rama normal

Antes de crearla:

1. Ejecuta `git status` y entiende todos los cambios locales.
2. Si hay cambios no relacionados o de autoría incierta, detente e informa; no hagas stash, reset ni descarte automático.
3. Actualiza las referencias remotas.
4. Cambia a `dev` y actualízala con fast-forward cuando sea posible.
5. Crea la rama desde el `dev` actualizado.

El agente puede crear una rama local cuando una tarea de implementación lo necesita, pero no debe asumir que ello autoriza publicación.

## Nombre y tamaño

Usa uno de estos prefijos:

```text
feat/<descripcion>
fix/<descripcion>
refactor/<descripcion>
test/<descripcion>
chore/<descripcion>
docs/<descripcion>
hotfix/<descripcion>
```

El nombre es corto, descriptivo, en minúsculas y kebab-case, sin nombres personales. Por ejemplo:

```text
feat/release-genre-filter
fix/agenda-stale-request
refactor/agenda-calendar-grid
test/editorial-parsers
chore/vitest-foundation
docs/architecture-guide
```

Una rama contiene una intención coherente. Divide refactors grandes en slices según `riffvalley-refactoring`; no acumules Agenda, WordPress y Header en la misma rama.

## Decisión

```text
¿Es un cambio urgente de producción?
│
├─ Sí → hotfix/<descripcion> desde main → PR a main → sincronizar dev
│
└─ No → rama desde dev
         ↓
       PR a dev
         ↓
       promoción dev → main cuando corresponda
```
