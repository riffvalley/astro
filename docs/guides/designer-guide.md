# Guía para diseño y cambios visuales

Esta guía es para cualquier persona de diseño que quiera pedirle a Claude o
Codex un cambio visual en Riff Valley — sin necesitar saber Vue ni Astro a
fondo, y sin arriesgarse a romper algo que funciona. Complementa
[`docs/guides/prompt-guide.md`](./prompt-guide.md) (cómo pedir cualquier tarea) con
lo específico de tocar diseño en este proyecto.

La idea central: en este proyecto, el mismo archivo que dibuja un botón a
veces también decide qué hace ese botón al pulsarlo. Esta guía te enseña a
distinguir una cosa de la otra sin tener que entender el código.

## Qué puedes tocar normalmente

Esto es terreno seguro para un cambio de diseño:

- El texto y las etiquetas visibles.
- Las clases (los nombres que controlan el estilo de un elemento).
- El CSS: colores, espaciado, tipografía, tamaños.
- El layout: cómo se colocan las cosas en la pantalla.
- El comportamiento responsive (cómo se ve en móvil, tablet, escritorio).
- Iconos e imágenes.
- El orden visual de los elementos en pantalla.

Todo esto cambia **cómo se ve** algo, no lo que hace.

## Qué debes tratar con cuidado

En Astro y Vue, el mismo archivo que dibuja algo en pantalla puede tener,
mezclado ahí mismo, piezas que controlan comportamiento. No hace falta que
entiendas cómo funcionan por dentro — solo que sepas reconocerlas para no
tocarlas sin querer:

- `v-if` — decide si algo se muestra o no.
- `v-for` — repite algo una vez por cada elemento de una lista.
- `@click`, `@submit` — qué pasa cuando alguien hace clic o envía un
  formulario.
- `:algo` (con dos puntos delante) — un valor que viene de otra parte, no
  un texto fijo.
- `v-model` — conecta un campo con un valor que cambia.
- `props`, `emits`, `slots` — cómo un componente recibe información o
  avisa a otro de que pasó algo.
- Cualquier `client:algo` — decide si esa pieza carga JavaScript en el
  navegador.

Si ves alguna de estas piezas cerca de lo que quieres cambiar, no la toques
tú mismo — pídele a Claude que la revise o la preserve explícitamente.

## Qué no debería tocar un cambio de diseño

Salvo que la tarea lo pida explícitamente, un cambio visual no debería
tocar:

- Las llamadas a APIs o al backend.
- Los composables (piezas que manejan datos o estado).
- La lógica de negocio (las reglas de qué pasa y cuándo).
- Las validaciones de formularios.
- Los modelos o tipos de datos.
- La navegación (a dónde te lleva un enlace o un botón).
- Los permisos.
- Los datos en sí.
- Los tests que ya existen.

## Regla sencilla

Pregúntate qué estás cambiando:

- Si la pregunta es **"¿cómo se ve?"** → es diseño.
- Si la pregunta es **"¿qué hace?", "¿qué datos usa?", "¿cuándo
  ocurre?"** → es funcionalidad.
- Si tu cambio mezcla las dos cosas → pide primero un análisis, no la
  implementación directa.

## HTML / CSS / funcionalidad

Un ejemplo pequeño, un botón real de este proyecto:

```html
<button @click="openPost(post)">
  Ver
</button>
```

**Es visual** cambiar:
- el texto ("Ver" → "Leer más"),
- las clases,
- un icono,
- la posición,
- los estilos.

**Es funcional** cambiar:
- el `@click`,
- el nombre `openPost`,
- sus argumentos (lo que va entre paréntesis),
- las condiciones que deciden si el botón aparece o no.

Fíjate: puedes cambiar todo lo de dentro del botón sin tocar el
`@click="openPost(post)"` — esa parte se queda igual, haga lo que haga el
botón por fuera.

## Cómo pedir un cambio visual a Claude

```
Quiero cambiar visualmente [componente/sección].

Objetivo:
[qué aspecto quiero conseguir]

Puedes cambiar:
- markup de presentación
- clases
- CSS

No cambies:
- lógica
- datos
- eventos
- props
- APIs
- comportamiento

Preserva toda la funcionalidad actual.

Verifica que no haya cambios funcionales.

No hagas commit, push, PR ni merge.
```

## Cuando necesitas cambiar estructura

Mover bloques de un sitio a otro en la pantalla suele ser seguro. Pero si
ese movimiento afecta a un `v-if`, un `v-for`, un slot o un evento —por
ejemplo, si algo deja de estar dentro de la condición que decidía si se
mostraba— eso ya es un cambio funcional, y hay que tratarlo y revisarlo
como tal, no como un simple reordenamiento visual.

## Cambios responsive

Al pedir un ajuste para pantallas distintas, especifica para cuáles:
desktop, tablet, móvil. Y pide explícitamente que se preserve el
comportamiento, no solo que "se vea bien en la captura" — un elemento
puede verse perfecto en un screenshot y haber perdido, por ejemplo, la
zona donde se podía hacer clic.

## Componentes Vue

Un archivo `.vue` tiene tres zonas, siempre separadas:

- **`<script>`** → la lógica.
- **`<template>`** → la estructura visual, aunque a veces con algunos
  bindings funcionales mezclados (los que viste arriba: `v-if`, `@click`,
  etc.).
- **`<style>`** → los estilos.

Regla práctica para diseño: `<style>` es zona segura; `<template>`
requiere cuidado (por los bindings mezclados); `<script>` no se toca salvo
necesidad explícita y justificada.

## Componentes Astro

Un archivo `.astro` se organiza parecido:

- El **frontmatter** (el bloque entre `---` y `---` al principio del
  archivo) → datos y lógica que corren en el servidor.
- El **markup** de después → la estructura visual.
- **`<style>`** → los estilos.

Para diseño: no toques el frontmatter salvo que la tarea lo requiera
explícitamente.

## Cómo pedir una revisión antes de tocar

Si no estás seguro de si algo es seguro de cambiar, pide primero que te lo
expliquen sin tocar nada:

```
Quiero hacer este cambio visual: [X].

Antes de editar, dime:
- qué archivos tocarías;
- qué parte es solo presentación;
- qué parte tiene lógica;
- si existe riesgo funcional.

No implementes todavía.
```

## Ejemplos

**Cambiar el layout de una card:**

> Quiero que las cards de discos muestren la portada más grande y el
> texto debajo en vez de al lado. Puedes cambiar markup de presentación,
> clases y CSS. No cambies lógica, datos, eventos ni props. No hagas
> commit, push, PR ni merge.

**Adaptar una sección a móvil:**

> En móvil, la sección de redes sociales se ve apretada. Ajusta el
> layout para pantallas pequeñas sin tocar el comportamiento de scroll ni
> de selección de un post. Verifica que siga funcionando igual en
> desktop. No hagas ninguna operación Git.

**Cambiar iconos y colores:**

> Quiero actualizar los iconos y colores del footer para que coincidan
> con la nueva paleta. No toques los enlaces ni su destino, solo su
> aspecto. No hagas commit, push, PR ni merge.

**Rediseñar un modal sin cambiar su comportamiento:**

> Quiero rediseñar visualmente el modal de detalle de un disco: nuevo
> layout, nueva tipografía. Debe seguir abriéndose, cerrándose y
> mostrando los mismos datos exactamente igual que ahora. Antes de
> editar, dime qué parte del archivo es solo presentación y cuál tiene
> lógica.

## Señales de STOP

Si en algún momento Claude te dice que, para hacer tu cambio puramente
visual, necesita tocar:

- una API,
- un composable,
- un store,
- el backend,
- tipos o modelos,
- la navegación,

eso es una señal de alerta. No es necesariamente que esté mal —a veces un
cambio visual sí necesita un dato nuevo que antes no existía— pero pídele
que te lo justifique primero, antes de dejar que lo haga.

## Checklist para diseñador

- ¿Estoy cambiando cómo se ve o cómo funciona?
- ¿Sé qué componente quiero modificar?
- ¿He dicho qué debe mantenerse?
- ¿He indicado qué no debe tocar?
- ¿El cambio afecta a móvil/desktop?
- ¿Quiero implementación o solo una propuesta?
