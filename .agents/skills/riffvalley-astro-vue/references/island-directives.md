# Directivas de hidratación

Usa la hidratación menos agresiva que mantenga una experiencia correcta. La elección es una decisión de UX y coste: determina cuándo se descarga, evalúa y activa Vue en el navegador.

## `client:load`

**Úsala** cuando la interacción sea esencial nada más cargar la ruta y retrasarla perjudique la tarea principal. En Riff Valley, la guía de lanzamientos y las novedades nacionales pueden justificarla: la página existe para usar sus filtros, listado reactivo y formulario.

**Evítala** para contenido editorial, UI situada lejos del primer viewport o interacciones opcionales. No es el valor por defecto de una island.

**Coste:** compite desde el inicio por descarga, parseo, ejecución e hidratación con el resto de la página.

## `client:idle`

**Úsala** para una mejora secundaria que debe estar lista pronto, pero no bloquea la lectura ni la acción inicial. Por ejemplo, una pequeña herramienta de recomendación visible arriba que no sea necesaria para el contenido principal.

**Evítala** cuando el usuario pueda necesitarla inmediatamente —en ese caso usa `load`— o cuando la isla esté bastante abajo —normalmente `visible` evita trabajo innecesario.

**Coste:** pospone trabajo hasta que el navegador tenga tiempo libre; sigue enviando JavaScript y el momento de activación no es exacto.

## `client:visible`

**Úsala** para features interactivas fuera de la primera vista que pueden activarse al acercarse al viewport. La home la usa correctamente para el mini calendario y los feeds sociales: evita hidratar agenda, Instagram y Telegram si el visitante no llega a esas secciones.

**Evítala** si el usuario necesita interacción instantánea antes de que el observador la active o si un estado compartido con una isla ya activa exige coordinación inmediata.

**Coste:** reduce trabajo inicial, pero introduce un pequeño retraso al aproximarse y depende de que haya HTML útil o un placeholder estable antes de hidratar.

## `client:media`

**Úsala** cuando la interactividad sólo tenga sentido bajo una condición de media estable, no sólo para ahorrar bytes. Ejemplo conceptual: un control Vue exclusivo para escritorio que sustituye a una experiencia Astro distinta en móvil.

**Evítala** para ocultar una misma island por CSS o para usar breakpoints como excusa para duplicar lógica y estado. Si ambas variantes comparten la interacción, suele ser mejor una única isla responsive.

**Coste:** limita la hidratación al media query coincidente, pero añade complejidad de variantes y debe conservar una alternativa útil fuera de esa condición.

## `client:only`

**Úsala** excepcionalmente cuando una librería o componente necesita APIs de navegador durante su render inicial y no puede renderizarse en servidor. Documenta el motivo y ofrece un fallback cuando importe para UX/SEO.

**Evítala** para componentes que Astro/Vue pueden renderizar en servidor: elimina HTML inicial y empeora percepción, accesibilidad y descubribilidad de contenido. No es apropiada para el contenido editorial de Riff Valley.

**Coste:** no hay render de servidor para la isla; el usuario depende totalmente de JavaScript para verla.

## Props y directivas

La directiva se aplica al componente raíz de la island importado desde Astro, no a todos sus hijos. Mantén dentro de esa raíz los hijos que comparten estado. No hidrates un árbol más grande sólo porque una hoja sea interactiva: coloca la island en el primer nodo que necesite ese estado, dejando HTML estático fuera cuando no necesita participar.
