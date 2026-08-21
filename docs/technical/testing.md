# Testing

La estrategia práctica de testing de Riff Valley. Complementa
[`architecture.md`](./architecture.md) (dónde vive el código),
[`feature-development.md`](./feature-development.md) (construir
capacidades nuevas) y [`refactoring.md`](./refactoring.md) (cambiar código
existente de forma segura).

## Principio

Cuánto y con qué profundidad testeamos viene determinado por:

```
riesgo × complejidad × probabilidad de regresión
```

No un porcentaje de cobertura, no "cada función tiene un test", no
ceremonia de testing. Un getter de una línea y un cálculo de cursor de
paginación no merecen la misma atención —el segundo es donde una
regresión es a la vez probable y cara de notar tarde.

## Qué testeamos

En orden de prioridad:

- Lógica pura —funciones sin efectos secundarios, fáciles de testear de
  forma aislada.
- Transformaciones —datos remodelados de una forma a otra (respuesta de
  API → modelo de dominio, posts → rails de la home).
- Reglas de dominio —la lógica de negocio real (avance del cursor de
  paginación, qué posts caen en qué rail, comportamiento de
  retry/backoff).
- Contratos API/HTTP —la forma de un request y una response, no solo "si
  compila".
- Paginación —avance de cursor/offset, `hasMore`, orden del append de
  páginas.
- Coordinación reactiva / composables —estado de carga/error, guardas de
  concurrencia, estado de selección.
- Edge cases que conllevan riesgo real —un límite de truncado, un 404,
  una respuesta malformada— no cada input teóricamente posible.

## Characterization tests

Antes de un refactor que conlleve riesgo real, escribe tests contra el
código *existente* primero, para proteger su comportamiento observable
actual, sus contratos, sus errores y sus edge cases —incluyendo
comportamiento que parezca que podría ser un bug. La idea es saber si
cambia, no juzgar si debería.

**Ejemplo — WordPress:** `features/editorial/tests/wordpress.test.ts`
incluye `does NOT truncate when <!DOCTYPE is at index 0 (existing
behavior, not "fixed")` —un test real, que protege un edge case real de la
lógica de truncado de contenido de posts, escrito para fijar lo que el
código realmente hace hoy en vez de lo que "debería" hacer. Eso es un
characterization test haciendo su trabajo: fallaría ruidosamente si un
cambio futuro alterara ese límite, ya fuera a propósito o por accidente.

No recurras a characterization tests para congelar implementación interna
que no está en riesgo —un test que solo se rompe cuando ocurre un refactor
interno inofensivo es un coste de mantenimiento sin valor de detección de
regresiones.

## Pure logic

Vitest a secas, sin tooling extra, siempre que la lógica pueda testearse
como función pura.

- **Agenda utils** — `features/agenda/tests/eventGrouping.test.ts`,
  `calendarGrid.test.ts`, `eventDerivations.test.ts`, `flagSlugs.test.ts`:
  cada uno protege una transformación pura (agrupar eventos por día,
  construir el grid del calendario, derivar flags) con fixtures simples de
  input/output.
- **Home/editorial selection** —
  `features/editorial/tests/homeContent.test.ts` protege
  `buildHomeEditorialContent()`: qué posts caen en qué rail de la home,
  dado fixtures con fecha fija de modo que la lógica de selección se
  testea contra comparaciones entre posts, nunca contra el reloj real.
- **`usePaginatedSocialFeed`** —
  `features/social/tests/usePaginatedSocialFeed.test.ts` testea el
  composable directamente (sin necesitar montar ningún componente, ya que
  no contiene DOM): carga inicial, siguiente página, la guarda de
  concurrencia, paginación agotada, error/retry, selección —más un caso
  con la forma del cursor de offset numérico de Instagram y otro con la
  forma del cursor nullable de Telegram, demostrando que la misma
  abstracción cubre ambos esquemas reales.

## API clients

Para un cliente de API nuevo o modificado, testea:

- La URL y los parámetros realmente enviados.
- El mapping/contrato —si el resultado parseado coincide con lo que el
  cliente promete devolver.
- Los errores que importan —un status HTTP no-ok, una forma de error
  documentada, un fallo de red.
- El comportamiento de paginación/cursor, cuando el cliente está paginado.

**Ejemplos:** `features/social/tests/tiktok.test.ts` comprueba el query
string exacto (`limit`/`offset`), la ruta `/tiktok/videos/:id`
(URL-encoded), un passthrough de una respuesta exitosa, un `HTTP 500`, la
forma documentada del `404`, y la propagación de un fallo de red.
`lib/wordpressClient.test.ts` y
`features/editorial/tests/wordpress.test.ts` hacen lo mismo para un
contrato más pesado: retry en 429/5xx, rendirse tras agotar el
presupuesto de retries, sin retry en un status no-transitorio, y
paginación vía `hasNextPage`/`endCursor` concatenada en orden.

## Components / DOM

Actualmente no hay infraestructura general de montaje de componentes ni
E2E en este repo. No instales una como paso por defecto de una feature
nueva o un refactor —añádela solo cuando un riesgo real de interacción DOM
lo justifique (un componente cuya lógica genuinamente dependa de
renderizado, manejo de eventos, o medición del DOM de una forma que un
test de función pura no pueda capturar).

Una comprobación visual manual puede complementar los tests cuando aporta
confianza real —p. ej. confirmar un Island contra un contrato de backend
real— pero no sustituye testear la lógica subyacente. Una comprobación
visual que "se vio bien" no es una red de regresiones para lógica
compleja; no se vuelve a ejecutar en el siguiente cambio.

## Qué normalmente NO testeamos

- Getters triviales sin lógica.
- Markup estático sin comportamiento.
- Detalles internos de implementación que un usuario/consumidor no puede
  observar.
- Snapshots sin valor real de aserción.
- Wrappers triviales que solo reenvían a algo que ya está testeado.
- Código del propio framework (la reactividad de Vue, el renderizado de
  Astro) —confía en el framework; testea lo que construimos encima.

## Ubicación de los tests

Los tests viven con el dueño de la capacidad, en una carpeta `tests/`
junto al código que protegen:

- `features/<feature>/tests/` —p. ej. `features/agenda/tests/`,
  `features/social/tests/`.
- `shared/tests/` —para el único util compartido que tiene lógica que
  merece protegerse (`shared/tests/formatDateLong.test.ts`).

La infraestructura técnica puede mantener su test junto al archivo de
`lib/` que protege en su lugar —`lib/wordpressClient.test.ts` está junto a
`wordpressClient.ts`, porque es infraestructura, no una feature.

## Niveles de verificación

Durante el desarrollo o un refactor, en orden:

1. Tests focalizados para lo que cambió.
2. `pnpm test:run` (suite completa).
3. `pnpm typecheck`.
4. `git diff --check`.
5. Una revisión completa del diff.

Un build completo o una comprobación visual manual son pasos extra, que
se añaden solo cuando el alcance realmente los justifica —no un paso por
defecto para cada cambio.

## Cuándo añadir infraestructura de testing nueva

Solo con una necesidad demostrada —un trabajo real que el setup actual
genuinamente no puede cubrir, no una sensación de que falta algo. No
añadas `@vue/test-utils`, `jsdom`/`happy-dom`, Playwright, MSW, ni tooling
de coverage solo porque el proyecto todavía no los tiene. Cada uno de los
ejemplos de arriba —incluyendo un composable Vue con estado async y
guardas de concurrencia— se testeó con Vitest a secas, sin DOM, sin más
mocking que `vi.fn()`/`vi.stubGlobal()`.

## Definition of Done

- La regresión que esto protege es nombrable —puedes decir qué
  input/estado rompería sin este test.
- El test comprueba comportamiento observable o un contrato real, no
  trivialidades de implementación.
- Los fixtures son deterministas —sin dependencia del reloj real ni de la
  red.
- El test vive en la carpeta `tests/` correcta, junto a su dueño.
- `pnpm test:run` y `pnpm typecheck` pasan; el diff se revisó por
  completo.
- No se añadió ninguna dependencia de testing nueva sin una necesidad
  real y enunciada.

## Anti-patrones

1. **Perseguir cobertura** —añadir tests para mover un porcentaje en vez
   de proteger una regresión real.
2. **Testear implementación** —afirmar sobre internals que se romperían
   con un refactor inofensivo y no revelan nada sobre comportamiento real.
3. **Snapshots triviales** —un snapshot sin ninguna aserción real, que
   solo señala "algo cambió" sin decir si importa.
4. **Instalar tooling antes de necesitarlo** —añadir una librería de
   montaje, MSW, o Playwright de forma especulativa, por delante de una
   necesidad real.
5. **Tests frágiles por el reloj o la red reales** —un test que puede
   fallar de forma intermitente porque depende de `Date.now()` o de una
   llamada HTTP real en vez de un fixture fijo o un stub.
6. **Duplicar tests del mismo contrato** —volver a probar algo que un test
   hermano (o el test genérico del composable) ya cubre, sin ningún
   comportamiento nuevo en juego.
7. **Saltarse la characterization antes de un refactor arriesgado** —mover
   lógica que conlleva riesgo sin ningún test que proteja su
   comportamiento actual primero.
8. **Usar una comprobación visual manual como única protección para
   lógica compleja** —un pase visual puntual no es una red de
   regresiones; no se vuelve a ejecutar en el siguiente cambio.
