---
name: riffvalley-refactoring
description: Orquesta refactors incrementales de Riff Valley al reorganizar código existente, dividir componentes o módulos, mover responsabilidades, extraer funciones, composables o APIs, migrar a features, reducir acoplamiento o preservar comportamiento mediante characterization tests.
---

# Refactoring en Riff Valley

> Refactor by small, behavior-preserving slices.

Un refactor cambia estructura interna y mantiene comportamiento observable.
Un fix o feature cambia comportamiento intencionadamente. Si una tarea
incluye ambos, identifícalos y sepáralos en slices.

Para el flujo completo (AUDIT → CHARACTERIZATION → BOUNDARY → SMALL SLICE
→ VERIFY → RE-EVALUATE → PR), su Definition of Done y ejemplos reales, ver
[`docs/technical/refactoring.md`](../../../docs/technical/refactoring.md); para límites y
dirección de dependencias, [`docs/technical/architecture.md`](../../../docs/technical/architecture.md);
para qué proteger y a qué nivel, [`docs/technical/testing.md`](../../../docs/technical/testing.md).
Esta skill no los resume: coordina autoridad entre skills y guarda los
guardrails operativos que ningún doc cubre.

Esta skill coordina; no sustituye a las políticas especializadas:

```text
riffvalley-refactoring
        │
        ├── riffvalley-architecture       límites y dependencias
        ├── riffvalley-astro-vue          Astro, Vue, Islands y runtime
        ├── riffvalley-feature-module     ownership, módulos, API pública, shared
        ├── riffvalley-api-integration    proveedores, HTTP y resiliencia
        └── riffvalley-testing            protección del comportamiento
```

`riffvalley-git-workflow` gobierna la rama, commit, PR y ciclo de merge de un refactor; esta skill mantiene la autoridad sobre el slice, riesgo y preservación de comportamiento.

## Precedencia

1. Las instrucciones explícitas del usuario prevalecen.
2. `riffvalley-refactoring` orquesta workflow, riesgo y slices en refactors.
3. `riffvalley-architecture` decide límites y dependencias.
4. `riffvalley-feature-module` decide ownership, API pública y `shared`.
5. `riffvalley-astro-vue` decide Astro, Vue, Islands, hidratación y runtime.
6. `riffvalley-api-integration` decide fronteras externas y resiliencia.
7. `riffvalley-testing` decide qué proteger y a qué nivel.
8. Hallmark gobierna exclusivamente decisiones visuales cuando la tarea es visual.
9. Las skills externas aportan conocimiento técnico de framework y tooling.
10. Ante conflicto, prevalece la skill `riffvalley-*` especializada en ese ámbito.
11. Una skill auxiliar nunca puede ampliar el alcance solicitado.
12. Recomendaciones externas de instalar, mover, dividir o configurar requieren primero justificación según las políticas del proyecto.

Hallmark sólo tiene autoridad en diseño, rediseño, auditoría visual, UX/UI visual y design systems solicitados. No decide arquitectura, ownership, Astro/Vue, comportamiento funcional ni alcance de refactors, y no puede añadir estados funcionales, previews, tokens o artefactos auxiliares fuera del alcance solicitado.

Los criterios cuantitativos o automáticos de `vue-best-practices` para dividir componentes, crear composables o extraer código son señales de inspección, no órdenes arquitectónicas. Riff Valley decide si se extrae, el alcance, el ownership y el slice; la skill externa explica cómo implementarlo correctamente una vez aprobado.

## Guardrails durante un slice

- Preserva comportamiento por defecto; separa siempre estructura de
  cambio funcional, incluso si ambos parecen inevitables juntos.
- Si aparece un bug o deuda real durante el refactor, regístralo — no lo
  corrijas dentro del mismo slice salvo que el usuario lo pida o sea
  trivial, inseparable y necesario para terminar con seguridad.
- No afirmes que no hubo cambio de comportamiento sin evidencia. Informa
  qué se verificó (p. ej. "tests relevantes y typecheck pasan; no se
  identificó un cambio intencionado").
- Characterization tests antes de mover lógica compleja sin red de
  seguridad, solo cuando el riesgo real lo justifique — no por rutina
  (nivel y alcance: `riffvalley-testing`).
- Cambia una responsabilidad o frontera por slice; no mezcles
  reorganización, corrección de bugs y features nuevas en el mismo
  cambio. El tamaño de un slice es conceptual: no lo fijes por líneas,
  archivos, minutos o commits.
- Verifica con el check más barato capaz de detectar el riesgo antes de
  seguir al siguiente slice (niveles y cuándo omitir cada uno:
  `docs/technical/refactoring.md` → Verify).
- Tras cada slice decide explícitamente: continuar, parar, cambiar de
  frontera, o declarar DONE. Nunca sigas refactorizando código vecino
  solo por simetría o "ya que estamos", sin evidencia nueva que lo pida.
- Mover archivos no es lo mismo que mejorar ownership o dirección de
  dependencias — revisa qué cambia realmente antes de dar un movimiento
  por bueno.

## Migraciones seguras

- Preserva la API existente si es posible; actualiza solo los
  consumidores necesarios, sin renombrar a la vez salvo necesidad.
- Comprueba imports y ciclos tras mover código; verifica de forma
  proporcional al riesgo.
- Elimina la ruta antigua solo después de migrar sus consumidores.
- Un re-export o compatibility layer transitorio es válido solo con
  propósito y caducidad explícitos — nunca como una segunda API
  permanente accidental.

## Prohibido salvo petición o necesidad explicada

- rediseñar UI, cambiar CSS o copy;
- introducir features, estado global o Pinia;
- actualizar dependencias, framework o tooling;
- cambiar API externa, backend, cache, retry, SEO o contenido editorial;
- formatear todo, hacer renombrados masivos o reescribir código vecino;
- crear commits, push, branches o PRs.
