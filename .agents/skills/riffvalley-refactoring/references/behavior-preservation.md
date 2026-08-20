# Preservar comportamiento

```text
REFACTOR                       FIX / FEATURE
estructura cambia              comportamiento cambia intencionadamente
comportamiento se mantiene     contrato nuevo o corregido
```

Si durante un refactor aparece un bug, documéntalo y termina el slice preservando comportamiento. Corrígelo sólo si el usuario lo pidió o es trivial, inseparable y necesario para completar con seguridad. La posible doble `TelegramGridIsland` en Home es un posible bug/cambio funcional separado de reorganizar Home.

No afirmes que no hubo cambio sin evidencia. Informa, por ejemplo: “Los tests relevantes y el typecheck pasan; no se identificó un cambio intencionado de comportamiento”.

## Código asíncrono

Antes de mover fetch a adapter/composable identifica orden de eventos, loading, empty/error, retry, cancelación, respuestas stale y fallo parcial. Una extracción no preserva automáticamente la semántica async. Mejoras como `AbortController`, timeout, `allSettled`, validación o nueva taxonomía de error son slices funcionales/resiliencia separados salvo que el objetivo las incluya.

## Fechas

Antes de mover lógica de Agenda o Releases fija sus supuestos: timezone, local/UTC, inicio de semana, borde de mes/año, all-day y locale. Extrae funciones puras cuando resulte natural y protege edge cases mediante `riffvalley-testing`.

## Ejemplos actuales

- **Agenda:** preservar navegación mensual, eventos, filtros/regiones, contadores, grid, mapa y diálogo relevante al slice.
- **WordPress:** preservar número/orden de requests, paginación, payload GraphQL, cache, serialización, retry, parsing y normalización. Cambios de timing pueden afectar WAF/build y son HIGH.
- **Header:** preservar navegación, previews, búsqueda, tema y comportamiento móvil; separar no significa convertir a Vue ni rediseñar.
- **Home:** preservar orden de secciones, props, destacados, selección editorial y deduplicación; no mezclar con decisiones editoriales.

## Characterization

Para lógica compleja sin tests: identifica comportamiento observable, captura casos representativos antes de moverlo y conserva esos tests durante el refactor. `riffvalley-testing` decide qué nivel aporta valor; esta skill decide cuándo integrarlo en el slice.
