---
name: riffvalley-testing
description: Define o aplica la estrategia de testing de Riff Valley al crear tests, corregir regresiones, preparar characterization tests, elegir unit/integration/E2E, mocks, fixtures, coverage o preservar comportamiento durante refactors.
---

# Testing de Riff Valley

Minimiza regresiones al menor coste razonable: **riesgo × complejidad ×
probabilidad de regresión**, no líneas, archivos ni porcentaje de
cobertura. Test behavior and contracts, not implementation trivia. Para
qué testear, prioridades y ejemplos reales, ver
[`docs/technical/testing.md`](../../../docs/technical/testing.md); para characterization
dentro de un slice de refactor, [`docs/technical/refactoring.md`](../../../docs/technical/refactoring.md).
Esta skill decide solo el **nivel** (unit/component/integration/E2E) y
**cómo aislar dependencias** — no qué priorizar, eso ya está en los docs.

## Árbol de decisión

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

La pirámide (muchos unit, algunos integración/componente y pocos E2E) es
una guía de coste y confianza, no una cuota matemática.

## Mocking: ¿frontera real o implementación?

Mockea fronteras reales — HTTP, `Date`/timers, `localStorage`, browser
APIs. No mockees funciones privadas, composables propios o hijos solo
para facilitar el test: si tienes que simular tu propio código para
probarlo, estás probando la simulación, no el comportamiento. Ante la
duda, pregunta explícitamente "¿esto es una frontera real, o soy yo
mismo?".

No dependas del reloj, timezone o red reales cuando eso vuelva el test
frágil: fixtures deterministas, fechas explícitas, fetch/timers
simulados. Evita sleeps arbitrarios (espera una condición observable) y
selectores E2E/CSS frágiles (prefiere roles, labels y texto accesible).

## Characterization

Antes de refactorizar lógica compleja sin red de seguridad — solo cuando
el riesgo sea real, no por rutina —, protege su comportamiento actual con
tests (nivel y alcance: `riffvalley-refactoring` / `docs/technical/refactoring.md`).

Ante un bug ya en producción, el ciclo proporcional es: reproducir → test
que falla (cuando aporte valor) → corregir → test verde. El test documenta
el comportamiento correcto y evita que el bug vuelva.

## Tooling no instalado

No hay infraestructura general de component mounting ni E2E en este
repo. No la instales por defecto — añádela solo cuando un riesgo real de
interacción DOM lo justifique (criterio y lista de qué no añadir "porque
falta": `docs/technical/testing.md`).

`vue-testing-best-practices` y Playwright aportan sintaxis e
implementación técnica cuando el tooling exista. Ninguna de las dos
decide la estrategia ni qué merece probarse — esas decisiones son de
esta skill; consúltalas solo para APIs/sintaxis una vez aprobado el qué
y el nivel.

## Checklist

- ¿Qué regresión detectaría este test y cuál es el nivel más barato que
  puede hacerlo?
- ¿Comprueba comportamiento observable, no implementación?
- ¿Mockea una frontera real, no el propio código bajo prueba?
- ¿El reloj/timezone/red y los fixtures son deterministas?
- ¿Duplica cobertura sin valor frente a otro nivel ya existente?
- ¿Seguirá teniendo sentido tras un refactor interno?
