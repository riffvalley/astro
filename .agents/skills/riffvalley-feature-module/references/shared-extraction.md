# Extraer a `shared`

Mantén inicialmente el código con el dominio que le da significado. **Duplication is cheaper than the wrong abstraction.** Que algo parezca genérico, tenga nombre neutro, sea pequeño o quizá vaya a reutilizarse no lo convierte en `shared`.

Evalúa una extracción sólo cuando se cumplan conjuntamente estas condiciones:

- hay al menos dos consumidores reales —o dos usos inmediatos, concretos y confirmados—;
- el concepto se entiende sin vocabulario ni modelos de la feature de origen;
- puede definirse una API estable y comprensible fuera del dominio;
- moverlo reduce duplicación o acoplamiento reales.

`shared` no puede depender de `features`, `app` ni `pages`, conforme a `riffvalley-architecture`. Si el código necesita conocer `AgendaEvent`, `Release`, un proveedor de WordPress o reglas de una feature, sigue perteneciendo allí.

## Casos habituales

`MonthYearPicker` podría llegar a ser `shared/ui` si varias features lo consumen como el mismo control con el mismo contrato. Si agenda y lanzamientos necesitan semántica o comportamiento diferentes, las variantes locales son preferibles.

Un `AgendaEventDialog` sigue siendo específico de agenda. Un `BaseDialog` no debe aparecer preventivamente: sólo sería candidato cuando varias features requieran de verdad el mismo contrato de diálogo.

Funciones puras tampoco se vuelven compartidas por ser puras. `features/agenda/utils/calendarGrid.ts` pertenece a agenda; `shared/utils` es para utilidades agnósticas y probadamente transversales. Del mismo modo, las constantes de una feature se quedan en ella en vez de alimentar un cajón `shared/constants.ts`.

## Señales para no extraer

- La API propuesta tiene props, nombres o tipos del dominio original.
- Sólo hay un consumidor actual y la reutilización es hipotética.
- El único motivo es acortar imports relativos o “ordenar” carpetas.
- La abstracción necesita opciones para cubrir dos necesidades que no son realmente iguales.

En esos casos conserva la pieza local y duplica de forma consciente si hace falta; extraer más tarde, con casos concretos, es más barato que deshacer una abstracción equivocada.
