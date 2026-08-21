# Feature development

Una guía operativa corta para construir una capacidad de producto nueva en
Riff Valley —o extender una ya existente— sin tener que re-derivar la
arquitectura desde cero cada vez. Complementa
[`architecture.md`](./architecture.md) (el mapa de dónde vive cada cosa)
con el *proceso* de pasar de un requirement a un PR mergeado.

Lee esto antes de empezar una feature nueva, antes de decidir si algo
extiende una feature existente, y antes de dividir el trabajo en PRs.

## El flujo

```
requirement → inspect → ownership → boundary → contrato/API
            → riesgo/tests → implementación por slices → verificación → PR
```

1. **Requirement.** Enuncia la capacidad real en términos de producto
   ("añadir TikTok como tercer feed social"), no como tarea técnica
   ("añadir un componente Vue"). Si no puedes nombrar la capacidad, todavía
   no estás listo para ubicar el código.

2. **Inspect.** Mira qué existe ya que sea adyacente a este requirement —
   features hermanas, componentes existentes, clientes de API existentes.
   No diseñes en el vacío; la respuesta a "esto dónde va" normalmente ya
   es visible en el repo.

3. **Ownership.** Decide qué feature (existente o nueva) posee esta
   capacidad de principio a fin: acceso a datos, modelos,
   transformaciones, UI. Un dueño claro, no código repartido entre
   `components/` y `lib/` porque nadie lo decidió.

4. **Boundary.** Declara qué queda dentro y qué queda fuera antes de
   escribir código. ¿Qué es lo que esta capacidad *no* hace? ¿Qué no
   comparte deliberadamente todavía con sus vecinas? Una frontera escrita
   antes de implementar es mucho más barata de mantener que una inferida
   después a partir de un diff que se ha ido extendiendo.

5. **Contrato/API.** Fija el contrato externo —la forma del endpoint del
   backend, los campos, el esquema de paginación— *antes* de escribir el
   cliente contra él. Un contrato que no has verificado contra el
   proveedor real es una suposición, no una frontera.

6. **Riesgo/tests.** Decide qué podría regresionar y a qué coste, y elige
   el nivel de test más barato que lo detecte (ver [Testing según
   riesgo](#testing-según-riesgo-complejidad-y-regresión) más abajo). Decide
   esto antes de implementar, no como ocurrencia tardía una vez que el
   código ya existe.

7. **Implementación por slices.** Construye en los pasos coherentes más
   pequeños posibles, cada uno dejando un estado funcionando. No diseñes
   de antemano la forma final completa de la capacidad — deja que la
   estructura emerja de lo que el slice realmente necesita (ver
   [Estructura emergente](#estructura-emergente-nunca-una-plantilla)).

8. **Verificación.** Ejecuta los tests que importan para lo que cambió,
   haz typecheck, revisa el diff completo y —cuando sea viable— haz una
   comprobación visual/manual contra un backend real. "Compila" no es
   "funciona".

9. **PR.** Pequeño, revisable, una intención clara por PR. Ver [No fijes
   el número de PRs de antemano](#no-fijes-el-número-de-prs-de-antemano).

## Feature existente vs. feature nueva

Pregunta: ¿esta capacidad ya tiene un dueño?

- **Extiende una feature existente** cuando es la misma capacidad de
  producto ganando una faceta nueva (un filtro nuevo en `releases`, un
  campo nuevo en el modelo de calendario de `agenda`). Pertenece a las
  carpetas ya existentes de esa feature.
- **Feature nueva** cuando es una capacidad genuinamente distinta con sus
  propios datos, su propia UI y su propia razón para cambiar de forma
  independiente — aunque *se parezca* a algo más. Dos cosas que hoy se
  parecen pueden divergir mañana por razones específicas de cada una; no
  las fusiones en una sola feature solo porque la superficie se parezca.
- **Todavía no está claro** → no crees todavía la carpeta de la feature.
  Deja el código donde ya encaja naturalmente (a menudo `components/`,
  según la "Guía de decisión" de `architecture.md`) hasta que aparezca un
  segundo consumidor real o una frontera más clara. Crear una feature para
  "anticiparse" es el mismo error que crear `shared/` solo por parecido.

## Chuleta de ubicación

- **`pages/`** — composition roots. Una página obtiene los datos que su
  *ruta* necesita, decide el layout, y conecta el chrome de `app/` con la
  UI de las features. Nunca contiene lógica de negocio (parsing, scoring,
  filtrado) —eso es trabajo de la feature dueña— y nunca se mete en los
  internals de una feature en vez de usar su superficie pública.
- **`app/`** — el shell que comparte cada página (header, footer,
  búsqueda, nav). Algo pertenece aquí solo si envuelve *cada* página, no
  solo varias de ellas.
- **`lib/`** — infraestructura técnica y clientes de proveedores con cero
  conocimiento del dominio de producto de Riff Valley. `apiBase.ts`,
  `spotify.ts`, `wordpressClient.ts` — se verían igual conectados a
  cualquier otro sitio que use los mismos proveedores.
- **`shared/`** — solo después de que dos o más features necesiten
  demostradamente el *mismo contrato*, no solo una pieza con aspecto
  parecido. `MonthYearPicker.vue` se ganó su lugar en `shared/` porque
  tanto `releases` como `national-releases` necesitaban el contrato
  idéntico de navegación de mes/año —no porque "los selectores de fecha
  son genéricos".
- **`features/*`** — una capacidad de producto, dueña de sus datos,
  transformaciones y UI de principio a fin.

## Feature A nunca debe importar Feature B

Que `features/releases` se meta directamente en
`features/agenda/utils/...` está prohibido, sin importar lo conveniente
que parezca. Si dos features necesitan la misma cosa, esa necesidad pasa
por `shared/` (una vez que la reutilización es real) — nunca por que una
feature dependa calladamente de los internals de otra. Esto es lo que
evita que un cambio dentro de `agenda` pueda romper silenciosamente
`releases`.

## Estructura emergente, nunca una plantilla

Una feature nueva no recibe `api/`, `model/`, `components/`,
`composables/` ni `server/` por defecto "por simetría" con `agenda` o
`releases`. `redactores` es una feature completa y correcta como un solo
archivo —porque todavía no había una segunda responsabilidad que separar.
Crea una subcarpeta cuando una responsabilidad real la necesite, no antes.

## Fronteras server/client (cuando existan)

No todas las features tienen esta división —introdúcela solo cuando una
feature genuinamente tenga código solo de servidor (claves de API,
cómputo pesado en build time) y código de navegador tocando el mismo
dominio. `server/` de `agenda` (acceso a Google Calendar, datos de mapa)
frente a `api/` (el cliente de fetch de navegador) es el ejemplo actual.
Una feature sin ninguna preocupación solo-de-servidor (`redactores`, que
obtiene todo en build time) no tiene carpeta `server/`, y eso es correcto
—no incompleto.

## Testing según riesgo, complejidad y regresión

No testees por número de líneas, número de archivos, ni por un objetivo de
porcentaje de cobertura. Decide qué estás protegiendo:

- Lógica pura (matemática del cursor de paginación, una función de
  mapeo) → test unitario, el nivel más barato que detecta una regresión
  real.
- Comportamiento de UI → a nivel de componente, probando estados
  observables, no internals.
- Un journey transversal → integración/E2E, con moderación.

Testea el contrato que acabas de construir (un cliente de API nuevo, un
composable nuevo) cuando equivocarte sería caro de notar más tarde — no
todo lo que cambió, y no trivialidades de implementación que se romperían
con un refactor inofensivo.

## No fijes el número de PRs de antemano

No decidas "esto van a ser 3 PRs" antes de entender el trabajo real.
Divide en unidades coherentes que preservan comportamiento (o con un
comportamiento nuevo claramente delimitado) a medida que aprendes lo que
el trabajo realmente requiere. Una capacidad que resulta ser más simple de
lo esperado merece menos PRs; una que revela coordinación compartida real
que no esperabas merece un slice extra una vez que esa evidencia exista —
no antes.

## Definition of Done

- La frontera de la capacidad (qué entra/qué queda fuera) está escrita o
  es obvia a partir del diff.
- El ownership es inequívoco — sin lógica repartida fuera de la feature
  dueña.
- El contrato externo (si lo hay) está verificado contra el proveedor
  real, no asumido solo a partir de una especificación.
- La dirección de dependencias se mantiene: sin `feature A → feature B`
  nueva, sin `lib/shared → features` nueva.
- Los tests corresponden al riesgo real, no a una cuota arbitraria; y
  pasan.
- El typecheck pasa; el diff tiene una intención clara y revisable.
- El comportamiento existente, no relacionado, queda demostrablemente sin
  cambios (revisión del diff, y una comprobación visual cuando hay un
  backend en vivo implicado).

## Ejemplo real: añadir TikTok a Social

Esto no es una crónica del refactor —solo el mismo flujo de arriba, visto
a través de una capacidad real.

**Requirement → inspect → ownership.** "Añadir TikTok como tercer feed
social" primero significó mirar qué era ya *Social*: Instagram y Telegram
vivían como dos pares sin relación —`lib/instagram.ts`/`lib/telegram.ts`
más componentes Vue de grid/card/detail viviendo directamente en
`components/vue/`, sin ninguna feature que los poseyera. Antes de que
TikTok pudiera reutilizar nada, había que cerrar ese hueco de ownership.
Eso fue lo que creó `features/social/` —moviendo el código existente de
Instagram/Telegram a `api/` y `components/`, sin cambiar nada de su
comportamiento. Dos plataformas que ya existían fueron la *evidencia* de
que una feature `social` era real, no una suposición de que algún día
podría ser útil.

**Boundary → coordinación duplicada.** Solo una vez que Instagram y
Telegram estuvieron uno junto al otro dentro de la misma feature se hizo
visible que sus grid islands duplicaban coordinación real —estado de
carga/error, la guarda de concurrencia, el avance del cursor, el
append de páginas, el estado de selección/detalle. Esa duplicación se
extrajo a
`features/social/composables/usePaginatedSocialFeed.ts` —genérico sobre
el tipo de post y el tipo de cursor— *porque la evidencia ya existía*, no
anticipando una tercera plataforma. `IntersectionObserver` y el manejo de
viewport/scroll se quedaron en cada Island: esa parte es genuinamente
específica de navegador/DOM por Island, sin una frontera compartida
limpia, así que no se forzó dentro del composable.

**Contrato/API antes que el cliente.** El contrato del backend de TikTok
—forma del endpoint, campos, paginación (`limit`/`offset`, `hasMore` del
backend)— se fijó y se verificó contra el backend real *antes* de que el
cliente final se publicara. La primera versión de ese contrato tenía una
ruta de endpoint equivocada; salió a la luz inmediatamente al verificarla
contra producción, y se corrigió (`/tiktok/videos`, no `/videos`) antes de
dar la feature por terminada. Cerrar el contrato pronto —y verificarlo de
verdad, no solo confiar en la especificación— es lo que atrapó ese
desajuste antes de que se publicara como un bug silencioso.

**Implementación por slices, reutilizando lo que ya encajaba.**
`features/social/api/tiktok.ts` siguió exactamente la misma forma que
`instagram.ts`/`telegram.ts` (mismo manejo de errores, mismo parsing
mínimo). `TikTokGridIsland.vue` reutilizó `usePaginatedSocialFeed` (cursor
de offset, igual que el esquema de Instagram) y reutilizó `PhoneFrame`
(ampliando su union `platformIcon` con `'tiktok'`). `PhoneMediaCarousel`
**no** se reutilizó para la vista de detalle: el detalle de TikTok tiene
una portada y un enlace tipo oEmbed, no varias slides de media navegables
crudas —forzar el carrusel sobre una forma para la que no se construyó
habría sido ceremonia, no reutilización. No se creó ningún modelo
`SocialPost` para unificar las formas de post tan distintas de Instagram,
Telegram y TikTok —cada plataforma conservó su propio tipo.

**Integración en Home.** Una vez que existía el tercer Island, el cambio
en `pages/index.astro` fue de dos líneas: un import nuevo, y el
`phone-trio` de la home cambiando su segundo slot (duplicado) de Telegram
por el nuevo `TikTokGridIsland`. La página no ganó ninguna lógica nueva —
compuso una raíz más, exactamente para lo que sirve un composition root.

**La lección:** reutiliza fronteras que la reutilización ya ha
demostrado —no fuerces una abstracción (un modelo de post compartido, un
carrusel de media compartido, un hook de ciclo de vida DOM compartido) por
delante de la evidencia de que es el mismo contrato, no solo una forma
parecida.

## Anti-patrones

1. Diseñar la estructura final de carpetas de una feature antes de
   escribir ningún código real para ella —copiar la forma de `agenda`
   "por simetría" en vez de dejar que las subcarpetas emerjan de
   responsabilidades reales.
2. Confiar en un contrato de backend solo a partir de una especificación y
   construir el cliente contra él sin verificarlo contra el proveedor
   real.
3. Crear una abstracción compartida (un modelo común, un componente
   compartido) a partir de similitud visual o estructural por sí sola,
   antes de que un segundo consumidor necesite el *mismo contrato*.
4. Una feature importando los internals de otra directamente en vez de
   pasar por su superficie pública o promocionar la reutilización real a
   `shared/`.
5. Forzar un componente con aspecto genérico (carrusel, lista, selector)
   sobre una forma para la que no se construyó, solo porque "ya tenemos
   uno".
6. Fijar el número de PRs o la arquitectura final antes de entender lo
   que el trabajo realmente requiere.
7. Poner lógica de negocio en una página o en el shell de `app/` en vez de
   en la feature dueña.
8. Extraer lógica de coordinación compartida de forma especulativa, antes
   de que dos consumidores reales demuestren que la duplicación es real.
