# Crear o extraer una feature

## 1. Identificar la capacidad

Antes de crear archivos, responde de forma concreta:

- ¿qué capacidad de producto representa y qué problema resuelve?
- ¿qué datos controla y qué UI le pertenece claramente?
- ¿qué APIs o proveedores utiliza?
- ¿quién consume esa capacidad?
- ¿puede nombrarse con vocabulario de dominio?

`agenda`, `editorial`, `releases` o `social` describen capacidades. `buttons`, `api`, `utils`, `modals` y `forms` son categorías técnicas: pueden existir dentro de una feature o, tras reutilización demostrada, en `shared`; no son features por sí solas. Si las respuestas no delimitan un dominio, conserva el código local y reevalúa más adelante.

## 2. Definir la frontera

Escribe o acuerda qué queda **dentro** y **fuera** antes de extraer. La feature debe poseer sus conceptos, reglas, UI y comunicación específica, pero no funcionalidades vecinas por proximidad.

Por ejemplo, `agenda` puede poseer eventos, regiones, configuración de calendarios, el grid y sus filtros. No debe convertirse en un contenedor general de cualquier fecha del sitio. La composición de rutas, el shell global y los contratos con otras features siguen los límites de `riffvalley-architecture`.

## 3. Elegir la estructura mínima

Empieza con la forma que representa trabajo real:

```text
features/foo/
├── components/
├── model/
└── index.ts
```

Añade `api/` si hay comunicación propia; `composables/` si hay estado Vue coherente; `utils/` para funciones puras del dominio. `index.ts` sólo aporta valor cuando hay una API pública que proteger.

```text
features/foo/
├── api/
├── components/
├── composables/
├── model/
├── utils/
└── index.ts
```

No crees por plantilla `domain/`, `application/`, `infrastructure/`, `repositories/`, `services/` o `use-cases/`. Una estructura profunda sólo se justifica si hay complejidad que separar —varios proveedores, reglas densas, infraestructura significativa o casos de uso distintos—, no porque una feature tenga que parecer “completa”.

## 4. Cohesión e incremento

Acerca el código específico de la capacidad para que se comprenda navegando principalmente por una zona. Una extracción desde el estado actual puede comenzar sólo con `model/`, añadir `api/` al mover la comunicación, y después `components/` al mover UI relacionada. No crees toda la arquitectura final vacía antes de extraer responsabilidades.

Cuando la tarea incluye UI reactiva, los componentes y composables de la feature obedecen además a `riffvalley-astro-vue`: una feature puede contener Astro, Vue o ambos; la tecnología no decide el límite de dominio.

## Modelos, DTOs, componentes, composables y constantes

Un DTO refleja el proveedor; un modelo representa el lenguaje de la feature. Separa DTO → modelo cuando normaliza nombres/campos, elimina datos que la UI no necesita, reduce opcionales difíciles, protege contra cambios de proveedor o unifica varias fuentes. No inventes `FooDto`, `FooMapper` y `FooModel` si las estructuras son realmente idénticas y la separación no aporta nada.

Componentes y funciones puras que sólo tienen sentido para el dominio permanecen en él: `components/AgendaEventDialog.vue` o `utils/calendarGrid.ts`. Un composable representa estado reactivo coherente, como `useAgendaFilters`, `useCalendarGrid` o `useReleaseFilters`; no sirve para esconder una trivialidad. Constantes de dominio viven junto a su feature, no en un futuro `shared/constants.ts` genérico.

## Anti-patrones

- **Feature dumping ground:** `features/common` absorbe cualquier código sin dueño.
- **Technical features:** `features/api`, `features/utils` o `features/components` confunden tecnología con capacidad.
- **Empty architecture:** directorios y capas vacíos o triviales creados por plantilla.
- **God feature:** una feature acaba siendo media aplicación; revisa su frontera o compón dominios desde `pages`/`app`.
- **Circular ownership:** dos features se necesitan mutuamente; reconsidera composición, frontera o contrato compartido.
- **Wrapper explosion:** capas que sólo llaman a otra función sin aportar semántica, protección o simplificación.
