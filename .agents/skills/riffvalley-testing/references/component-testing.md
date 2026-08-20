# Componentes Vue y Astro

Los tests Vue comprueban qué ve y hace la persona: texto, lista filtrada, contador, eventos emitidos, navegación, diálogos, formularios y estados. Evita afirmar `wrapper.vm.selectedRegion` o refs internas salvo una razón concreta.

```text
Given eventos de varias regiones
When se selecciona una región
Then lista y contador reflejan el filtro
```

## Estados async

Para una Island que hace fetch, cubre según aplique `idle`, `loading`, `success`, `empty`, `error`, `retry`, `stale`, `cancelled` y `partial`. La agenda es el caso más sensible: enero → febrero rápidamente no debe permitir que una respuesta tardía de enero reemplace el estado de febrero. Un test futuro puede controlar promesas diferidas, timers o `AbortController`; no impone una técnica.

`GuiaLanzamientosIsland`, `NovedadesNacionalesIsland`, Instagram y Telegram son candidatos de prioridad media para filtros/paginación, empty/error y retry. `ProposalForm` merece comportamiento observable para submit, éxito, error y la UX de rate limit.

## Astro

No pruebes cada `.astro`. Prioriza lógica extraída, endpoints y render crítico con riesgo. Páginas puramente compositivas pueden quedar protegidas por typecheck, build y unos pocos smoke/E2E. Evita snapshots enormes de HTML generado.

## Mocking

Mockea fronteras reales: HTTP, `Date`, timers, `localStorage` y browser APIs. Evita mockear funciones privadas, composables propios o hijos sólo para facilitar el test. Pregunta: “¿estoy mockeando una frontera real o la implementación que quiero comprobar?”. No se decide ahora una librería de HTTP mocking.

No uses sleeps arbitrarios; espera una condición observable. Evita selectores E2E/CSS frágiles: prefiere roles, labels y texto accesible cuando sea viable.
