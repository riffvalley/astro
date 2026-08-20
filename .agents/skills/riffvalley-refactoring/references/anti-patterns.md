# Anti-patrones y prohibiciones por defecto

## Anti-patrones

- **Big Bang Refactor:** reorganizar toda la aplicación en una operación.
- **Folder Architecture:** confundir mover archivos con mejorar ownership o dependencias.
- **Pattern Chasing:** introducir patrones por popularidad.
- **Clean Architecture Ceremony:** capas sin complejidad real.
- **Opportunistic Cleanup:** cambios no relacionados dentro del slice.
- **Test After Hope:** mover lógica compleja y protegerla sólo después.
- **Behavior Smuggling:** ocultar un cambio funcional bajo “refactor”.
- **Abstraction Explosion:** interfaces/services/repositorios para cada función.
- **Shared Dumping:** resolver ownership difícil enviándolo a `shared`.
- **Mega Diff:** intención imposible de explicar de forma sencilla.
- **Never-ending Refactor:** continuar porque siempre queda algo que limpiar.
- **Premature Final Architecture:** crear toda la estructura antes de extraer responsabilidades reales.

El tamaño de archivo no es arquitectura. Revisa un archivo grande cuando tenga varias razones independientes para cambiar: dominios distintos, UI + fetching/transformación, transporte + cache/reglas, navegación + datos, varios side effects o lógica pura enterrada. `AgendaCalendarIsland.vue`, `wordpress.ts`, `Header.astro` e `index.astro` son señales conceptuales, no autorización para dividirlos.

## Prohibido salvo petición o necesidad explicada

- rediseñar UI, cambiar CSS o copy;
- introducir features, estado global o Pinia;
- actualizar dependencias, framework o tooling;
- cambiar API externa, backend, cache, retry, SEO o contenido editorial;
- formatear todo, hacer renombrados masivos o reescribir código vecino;
- crear commits, push, branches o PRs.

## Árbol de decisión

```text
¿Qué problema queremos resolver?
           │
           ▼
¿Es estructural o funcional?
      │              │
 estructural       funcional
      │              │
      ▼              ▼
 refactor        fix / feature
      │
      ▼
¿Qué comportamiento debe mantenerse?
      │
      ▼
¿Existe protección suficiente?
   │             │
  Sí             No
   │             │
   │       characterization test
   │          cuando aporte valor
   └───────┬─────┘
           ▼
Definir una responsabilidad → cambiar → verificar
           │
           ▼
¿Objetivo del slice cumplido?
   │                 │
  Sí                 No
   │                 │
 STOP          continuar sólo
               dentro del slice
```
