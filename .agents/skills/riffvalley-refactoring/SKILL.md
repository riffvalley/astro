---
name: riffvalley-refactoring
description: Orquesta refactors incrementales de Riff Valley al reorganizar código existente, dividir componentes o módulos, mover responsabilidades, extraer funciones, composables o APIs, migrar a features, reducir acoplamiento o preservar comportamiento mediante characterization tests.
---

# Refactoring en Riff Valley

> Refactor by small, behavior-preserving slices.

Un refactor cambia estructura interna y mantiene comportamiento observable. Un fix o feature cambia comportamiento intencionadamente. Si una tarea incluye ambos, identifícalos y sepáralos en slices cuando sea razonable.

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

## Workflow obligatorio

```text
INSPECT → DEFINE BEHAVIOR → DEFINE BOUNDARY → ASSESS RISK → PROTECT
        → CHANGE ONE RESPONSIBILITY → VERIFY → REVIEW DIFF → STOP / NEXT SLICE
```

Sigue [workflow.md](references/workflow.md). Para dimensionar un slice y saber cuándo parar, consulta [slice-sizing.md](references/slice-sizing.md). Para separar estructura, bugs y comportamiento, consulta [behavior-preservation.md](references/behavior-preservation.md).

Cuando muevas código, imports, APIs públicas o fronteras de feature, sigue [migrations.md](references/migrations.md). Elige checks proporcionales con [verification.md](references/verification.md). Antes de ampliar el alcance, revisa [anti-patterns.md](references/anti-patterns.md).

## Checklist

Antes de editar:

- ¿Cuál es el problema estructural y qué comportamiento debe permanecer?
- ¿Qué archivos, consumidores, dependencias y side effects están implicados?
- ¿Qué skill gobierna cada decisión?
- ¿Cuál es el riesgo y existe protección suficiente?
- ¿Cuál es el slice mínimo coherente?

Durante:

- ¿Seguimos dentro del alcance y preservamos comportamiento?
- ¿Cambiamos una responsabilidad principal?
- ¿Estamos creando abstracciones o tocando código no relacionado?

Después:

- ¿El objetivo concreto está cumplido y los checks relevantes pasan?
- ¿La dirección de dependencias sigue válida?
- ¿El diff tiene una única intención comprensible?
- ¿Una mejora descubierta debe quedar como otro slice?
- ¿Debemos parar aquí?

No hagas commits, push, branches ni PRs salvo petición explícita.
