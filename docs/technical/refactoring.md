# Refactoring

Una guía operativa corta para refactorizar código existente (a menudo
legacy) en Riff Valley sin cambiar comportamiento innecesariamente. Asume
[`architecture.md`](./architecture.md) para dónde pertenece cada cosa y
[`feature-development.md`](./feature-development.md) para cómo se
construyen las capacidades nuevas. Esta guía trata sobre cambiar la
*estructura* de código que ya existe y que ya funciona.

Un refactor cambia la estructura interna y preserva el comportamiento
observable. Un bugfix o una feature nueva cambia comportamiento a
propósito. Si un trabajo es ambas cosas a la vez, sepáralas en slices
distintos en vez de meter un cambio de comportamiento dentro de un diff de
"refactor".

## El flujo

```
AUDIT → CHARACTERIZATION → BOUNDARY → SMALL SLICE → VERIFY → RE-EVALUATE → PR
```

Cada fase de abajo es un punto de control, no una fase que atraviesas a
toda prisa para llegar al "trabajo de verdad" —la auditoría y la decisión
de frontera son el trabajo de verdad; mover el código suele ser la parte
fácil.

## Audit

Antes de tocar nada, entiende qué hay realmente ahí:

- **Identifica las responsabilidades reales** —qué hace realmente este
  código, no lo que su nombre o su carpeta sugieren que hace.
- **Consumidores** —quién llama a esto, desde dónde, con qué expectativas.
- **Ownership** —¿ya existe un dueño claro, o esto es exactamente el tipo
  de hueco de ownership que un refactor debería cerrar?
- **Dependencias** —de qué depende este código, y qué depende de él, en
  ambas direcciones.
- **Riesgo** —qué se rompe, y con qué visibilidad, si esto sale mal.
- **Deuda vs. un problema arquitectónico** —un archivo desordenado es
  deuda; código que viola activamente la dirección de dependencias (`lib
  → features`, `feature A → feature B`) es un problema arquitectónico y
  normalmente el arreglo de mayor prioridad.

No decidas todavía la estructura de carpetas objetivo ni el número de PRs.
Ambos se derivan de lo que encuentre la auditoría, no al revés.

## Characterization

Antes de mover lógica que conlleve riesgo real, protege su comportamiento
actual con tests —escritos contra el código *existente*, antes de
cualquier cambio estructural. Protege el comportamiento observable, los
contratos reales y los edge cases conocidos; no escribas tests para
trivialidades de implementación que se romperían con un cambio interno
inofensivo y no te dirían nada sobre una regresión. Si la lógica es de
bajo riesgo y trivialmente re-verificable leyendo el diff, un
characterization test puede no merecer la pena escribirlo —esto es una
decisión de criterio guiada por riesgo × complejidad, no un mandato de
testear todo antes de cada movimiento.

## Boundary

Mueve una responsabilidad hacia el dueño al que realmente pertenece —la
feature (o `lib`, o `shared`) de cuyo dominio forma parte, según las reglas
de ubicación de `architecture.md`. Algunas cosas que no son razones
válidas para extraer:

- **Tamaño del archivo.** Que un archivo sea largo no es, por sí solo, una
  razón para dividirlo —divide cuando contenga más de una
  responsabilidad, no cuando cruce un número de líneas.
- **Reutilización anticipada.** No crees `shared/` para algo que hoy solo
  usa un consumidor, apostando a que aparecerá un segundo.
- **Simetría.** No crees una abstracción porque haría que el árbol
  "se viera" más consistente con un módulo hermano.

Extrae a `shared/` solo una vez que dos o más features necesiten
demostradamente el *mismo contrato* —no una pieza con aspecto parecido.

## Small slices

Cada slice hace una sola cosa con una intención clara y enunciable
—"extraer esta función pura", "mover este archivo a la feature que lo
posee", "extraer esta coordinación duplicada a un composable". Verifica
después de cada slice, antes de empezar el siguiente, de modo que una
regresión se detecte en el slice que la introdujo, no tres slices después.

Un slice no es automáticamente un PR. Varios slices pequeños y
relacionados pueden aterrizar en un solo PR; un único slice también puede
ser su propio PR si es una unidad significativa y revisable de forma
independiente. Decide eso según lo que realmente sea revisable, no según
una proporción slice-a-PR fijada de antemano.

## Verify

Como mínimo, proporcional a lo que cambió:

- Tests focalizados para el código que se movió o cambió.
- `pnpm test:run` (suite completa).
- `pnpm typecheck`.
- `git diff --check`.
- Una revisión completa del diff —confirma que tiene una única intención
  comprensible y que no se ha colado nada no relacionado.

Añade una comprobación visual/manual solo cuando aporte confianza real más
allá de lo que ya dieron los tests y el typecheck —p. ej. un Island
conectado a través de un contrato de backend real— no como paso final por
defecto para cada refactor.

## Re-evaluate

Después de cada slice, decide explícitamente:

- **Continuar** al siguiente slice planeado.
- **Parar** —el objetivo que motivó este refactor está cumplido.
- **Cambiar la frontera** —algo aprendido durante este slice cambia por
  dónde debería cortar el siguiente.
- **Declarar DONE** y anotar lo que queda como deuda conocida e
  intencionada.

No sigas refactorizando código vecino solo para que el árbol quede
visualmente simétrico una vez resuelto el problema original.

## Behavior preservation

Mantén el cambio estructural y el cambio funcional en slices separados (y
normalmente en PRs separados). Si un refactor saca a la luz un bug real o
una pieza de deuda, anótalo —no lo arregles silenciosamente dentro del
mismo diff. Un refactor que además "arregla un bug que se encontró de
paso" hace que ambos cambios sean más difíciles de revisar e imposibles de
revertir de forma independiente.

## Definition of Done

- La responsabilidad auditada ahora tiene un dueño claro.
- La dirección de dependencias se mantiene —sin `feature A → feature B`
  nueva, sin `lib/shared → features` nueva.
- Los characterization tests (donde el riesgo lo justificaba) pasan contra
  el código refactorizado exactamente igual que pasaban contra el
  original.
- `pnpm test:run` y `pnpm typecheck` pasan; `git diff --check` está
  limpio.
- El diff tiene una intención comprensible por slice/PR.
- Los bugs o la deuda encontrados se anotan, no se parchean
  silenciosamente.
- Nada se extrajo, abstrajo ni movió solo por tamaño o por simetría.

## Ejemplos reales

**WordPress — characterization antes de separar transporte de parsing.**
`lib/wordpressClient.ts` (transporte: `fetchGraphQL`, cache en disco de
dev, cache en memoria —sin noción de posts ni reviews) y
`features/editorial/api/wordpress.ts` (parsing y modelado de dominio:
`getAllPosts`, `getCategories`, extracción de review score) son hoy dos
responsabilidades distintas. Llegar ahí de forma segura significó proteger
primero el comportamiento de parsing existente con tests, de modo que la
separación transporte/parsing pudiera verificarse como preservadora de
comportamiento en vez de confiar solo en la inspección.

**Agenda — extracción incremental a lo largo de fronteras reales.**
`features/agenda` separó `server/` (acceso a Google Calendar, datos de
mapa —solo servidor/build) de `api/` (el cliente de fetch de navegador)
únicamente porque ambos tipos de código tocan genuinamente el mismo
dominio; cada pieza extraída (`calendarGrid.ts`, `eventGrouping.ts`,
`eventDerivations.ts`, `flagSlugs.ts`, el `agendaMonthRequestCoordinator`)
recibió su propio test junto a ella, una responsabilidad y un slice cada
vez —no una única gran reorganización.

**Social — ownership primero, coordinación común solo una vez que la
duplicación fue real.** Instagram y Telegram se unificaron bajo
`features/social/` antes que cualquier otra cosa, únicamente para cerrar
un hueco de ownership (no tenían feature dueña). Solo una vez que ambos
vivían en la misma feature se hizo visible la coordinación duplicada de
paginación/selección entre sus grid islands —eso es lo que justificó
extraer `usePaginatedSocialFeed`, después de que la evidencia existiera,
no antes.

## Anti-patrones

1. **Big bang** —refactorizar un módulo entero en un único cambio
   indiferenciado en vez de slices pequeños y verificables de forma
   independiente.
2. **Mover código por número de líneas** —dividir un archivo porque es
   largo, no porque contenga más de una responsabilidad.
3. **Diseñar la arquitectura objetivo antes de inspeccionar el código
   real** —decidir carpetas y abstracciones a partir de suposiciones en
   vez de la auditoría.
4. **Cleanup oportunista** —meter mejoras no relacionadas en el diff de
   un refactor porque ya estás en ese archivo.
5. **Abstraer a partir de una única coincidencia** —extraer una pieza
   compartida con un solo consumidor real, anticipando un segundo que
   todavía no ha aparecido.
6. **Mezclar un bugfix con un refactor** —cambiar comportamiento y
   estructura en el mismo diff, haciendo que ninguno de los dos sea
   revisable ni revertible por sí solo.
7. **Reabrir un dominio ya cerrado sin evidencia nueva** —revisitar una
   frontera decidida en un refactor anterior solo porque estás cerca, sin
   ningún hecho nuevo que cambie la decisión original.
8. **Perseguir un árbol visualmente perfecto** —seguir refactorizando
   código vecino por simetría después de que el problema real ya esté
   resuelto.
