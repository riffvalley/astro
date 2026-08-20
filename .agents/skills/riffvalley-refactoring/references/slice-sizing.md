# Tamaño, plan y condición de parada

Un slice persigue una responsabilidad arquitectónica y puede verificarse independientemente. Para riesgo MEDIUM/HIGH, prepara antes de editar un plan corto de slices, interno o visible cuando ayude a coordinar. No diseñes decenas de micro-pasos ni una arquitectura final completa por anticipado.

## Demasiado grande

Reduce el slice si toca varios dominios, mezcla arquitectura y comportamiento, exige verificar riesgos independientes, no cabe en una intención clara o haría difícil localizar una regresión.

Ejemplo Agenda que debe dividirse: crear feature, cambiar API, extraer composable, corregir races, rediseñar y añadir estado global en una operación.

## Demasiado pequeño

Combina pasos si ninguno mejora cohesión, acoplamiento, testabilidad, ownership, encapsulación, frontera de dominio o comprensión local; si sólo introduce wrappers temporales sin propósito; o si fragmenta una extracción coherente.

No impongas límites por archivos, líneas, minutos o commits. El tamaño es conceptual.

## Plan orientativo, no receta

Una futura Agenda podría avanzar mediante protección del comportamiento, tipos, lógica pura de fechas/grid, acceso API, estado reactivo y presentación. El orden depende de la inspección real. Una corrección de race condition es un fix separado si no resulta imprescindible para el refactor.

## Stop condition

Después de cada slice:

1. verifica;
2. revisa el diff;
3. describe el resultado;
4. identifica deuda o mejoras restantes;
5. propone, sin ejecutar automáticamente, el siguiente slice.

La duplicación temporal puede ser más segura que una abstracción equivocada si es consciente, limitada, eliminable y documentada. “Duplication is cheaper than the wrong abstraction” no justifica dejar deuda indefinidamente.

## Separación conceptual en Git

Recomienda mantener intenciones independientes separadas, pero nunca crees commits automáticamente. Nombres como `refactor(agenda): extract calendar grid logic` o `test(editorial): characterize review score parser` ilustran intención, no autorizan operaciones Git.
