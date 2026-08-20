# Unit tests, dominio y fechas

Prefiere unit tests para responsabilidades con forma `input → function → output`, sin DOM ni proveedor real. Son el nivel más barato para reglas valiosas.

Ejemplos actuales prioritarios:

- `monthBounds`: inicio/fin correctos, febrero y cambio de año.
- `groupByDay` y `formatDateLong`: agrupación, orden y formato explícito en `es-ES`.
- Parsers de WordPress: score ausente o válido, entidades, listas con “y”, HTML inesperado y `<!DOCTYPE` embebido.
- Transformación Google event → `CalendarEvent`: all-day, hora, campos opcionales, orden y calendarios vacíos.
- Lógica de selección de home: evitar duplicados, reserva de “discos del mes” y límites por categoría, cuando se extraiga o se caracterice.
- El grid de agenda: 42 celdas, lunes como inicio, días contiguos, borde diciembre/enero y fecha actual controlada.

No refactorices ahora para hacer testable una función. Cuando una tarea autorice separar una responsabilidad, probar la función pura suele dar más señal que montar una isla completa sólo para inspeccionar el mismo resultado.

## Tiempo y timezone

No dependas de la fecha ni timezone de la máquina: fija reloj, crea fechas explícitas y declara timezone cuando cambie el resultado. Comprueba primer/último día del grid, diciembre/enero, febrero y leap years cuando el dominio los admita. `eventDateKey` usa fecha local para eventos con hora: es una suposición observable que merece tests de zona horaria si se modifica.

## Characterization tests

Antes de refactorizar lógica compleja sin red de seguridad, captura el comportamiento actual, aunque no sea el diseño ideal:

```text
legacy/current behavior → characterization test → refactor → same observable behavior
```

Agenda, parsers WordPress, selección editorial y transformaciones de releases son candidatos. El test no declara que el comportamiento sea perfecto: permite detectar cambios accidentales. `riffvalley-refactoring` define el workflow de los slices.

## Anti-patrones

- **Coverage theatre:** tests sólo para una métrica.
- **No edge cases:** sólo se protege el happy path.
- **Giant fixtures:** cientos de campos donde bastaban cinco.
- **Test duplication:** el mismo detalle se prueba en tres niveles sin añadir confianza.
