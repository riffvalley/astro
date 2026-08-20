# Workflow de un refactor

## INSPECT

Antes de editar, comprende el archivo objetivo, imports, consumidores, dependencias, side effects, APIs públicas, estado, comportamiento observable, tests, configuración relacionada y fronteras con otras features. No empieces moviendo archivos porque el destino parezca evidente.

Para un refactor amplio, crea un mapa pequeño:

```text
responsibility → current owner → consumers → dependencies → desired owner
```

## DEFINE BEHAVIOR

Enumera sólo lo relevante para el slice. Agenda puede requerir preservar cambio de mes, eventos, filtros, contadores y diálogo; WordPress, paginación, parsing, normalización, cache, serialización y retry; Header, navegación, previews, búsqueda y tema; Home, orden, destacados y ausencia de duplicados.

No prometas preservar “todo” sin identificar qué puede observarse y cómo se comprobará.

## DEFINE BOUNDARY

Expresa el slice en una frase precisa:

- “Extraer el cálculo del grid mensual a una función pura sin cambiar su representación”.
- “Mover los tipos de Agenda sin modificar sus estructuras”.
- “Aislar la cache de WordPress manteniendo estrategia y timing actuales”.

“Limpiar Agenda”, “mejorar WordPress” o “modernizar `src`” no definen un slice. Reduce el alcance antes de editar.

## ASSESS RISK

- **LOW:** mover tipos/constantes sin cambiar forma, extraer función pura, reorganizar imports.
- **MEDIUM:** extraer composable, dividir componente, introducir API pública, mover adapter u ownership.
- **HIGH:** cambiar async, cache, retry, WordPress build-time, routing, frontera server/client, varias features o contratos públicos.

La clasificación es aproximada: decide cuánta protección y verificación necesita el cambio.

## PROTECT

Aplica `riffvalley-testing`. Usa tests existentes, characterization tests, typecheck, integración, build o verificación manual concreta según riesgo. Protege el comportamiento del slice; no añadas tests triviales para declarar cobertura. Parsers WordPress, fechas, grid/agregación de Agenda y selección editorial de Home son candidatos de alto valor.

## CHANGE ONE RESPONSIBILITY

Haz un cambio estructural principal. No mezcles reorganización, rediseño, corrección de races, nueva resiliencia y nuevas features. Mantén consumidores y contratos estables siempre que sea viable.

## VERIFY, REVIEW DIFF, STOP

Ejecuta el check más barato capaz de detectar el riesgo, revisa imports/ciclos y examina el diff completo. Si el objetivo está cumplido, para. Registra mejoras encontradas como candidatos separados en vez de continuar con “ya que estamos”.
