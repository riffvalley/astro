---
name: riffvalley-testing
description: Define o aplica la estrategia de testing de Riff Valley al crear tests, corregir regresiones, preparar characterization tests, elegir unit/integration/E2E, mocks, fixtures, coverage o preservar comportamiento durante refactors.
---

# Testing de Riff Valley

El objetivo es minimizar regresiones con el menor coste razonable, priorizando **riesgo × complejidad × probabilidad de regresión**, no líneas, número de archivos ni porcentaje global. **Test behavior and contracts, not implementation trivia.**

Esta skill decide qué comprobar, por qué y a qué nivel. `riffvalley-architecture`, `riffvalley-feature-module`, `riffvalley-astro-vue` y `riffvalley-api-integration` mantienen la autoridad sobre las políticas que los tests verifican; no las sustituye. La precedencia general está definida en `riffvalley-refactoring`.

`vue-testing-best-practices` aporta implementación técnica de testing Vue. Sus recomendaciones no autorizan instalar dependencias ni configurar runners, y no deciden la estrategia ni qué merece ser probado: esas decisiones pertenecen a `riffvalley-testing`. Para APIs o sintaxis de Vitest, Vue Test Utils o Playwright, consulta la skill externa o su documentación cuando el tooling exista.

## Decisión

```text
¿Qué comportamiento protegemos?
        │
        ▼
¿Puede probarse como función pura?
   │             │
  Sí             No
   │             │
 Unit      ¿Es comportamiento de UI?
                 │
             Sí ─┴─ No
             │      │
       Component   Integration/API
```

```text
¿Cruza varias capas y representa un journey crítico de usuario?
        │
       Sí
        ↓
   considerar E2E
```

La pirámide (muchos unit, algunos integración/componente y pocos E2E) es una guía de coste y confianza, no una cuota matemática.

## Workflow

1. Nombra el comportamiento, contrato, edge case o bug que protegerás. Consulta [test-priorities.md](references/test-priorities.md).
2. Elige el nivel más barato que lo comprueba; extrae lógica pura sólo si una tarea de producto/refactor lo justifica. Consulta [unit-and-domain.md](references/unit-and-domain.md).
3. Para UI, API o asincronía, prueba estados y efectos observables, no internals. Consulta [component-testing.md](references/component-testing.md) y [api-testing.md](references/api-testing.md).
4. Reserva E2E y smoke para journeys que cruzan capas. Consulta [e2e.md](references/e2e.md).
5. Antes de un refactor complejo, protege el comportamiento existente mediante characterization tests. Consulta [refactor-safety.md](references/refactor-safety.md).

## Checklist

- ¿Qué regresión detectaría este test y cuál es el nivel más barato que puede hacerlo?
- ¿Comprueba comportamiento observable, no implementación?
- ¿Cubre un edge case real, error, contrato o bug conocido?
- ¿Mockea una frontera real (HTTP, reloj, navegador), no el propio código bajo prueba?
- ¿El reloj/timezone y los fixtures mínimos son deterministas?
- ¿Duplica cobertura sin valor frente a unit, componente o E2E?
- ¿Seguirá teniendo sentido tras un refactor interno?
