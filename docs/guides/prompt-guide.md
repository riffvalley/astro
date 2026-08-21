# Guía para pedir trabajo a la IA

Esta guía es para cualquier persona del equipo que quiera pedirle algo a
Claude o Codex sobre Riff Valley, sin tener que saberse la arquitectura del
proyecto, las skills internas ni el proceso técnico. Responde a una sola
pregunta: **¿qué tengo que escribir en mi prompt para que la tarea salga
bien?**

No hace falta leer nada más antes de esto. Los documentos técnicos del
proyecto (`docs/technical/architecture.md`, `docs/technical/feature-development.md`,
`docs/technical/refactoring.md`, `docs/technical/testing.md`, `docs/technical/git-workflow.md`) existen
para que el agente los use — no para que tú los memorices.

## Antes de empezar

Cuéntale al agente **qué** necesitas y **por qué** lo necesitas, no cómo
construirlo por dentro. Con eso suele bastar:

- Qué comportamiento tiene que seguir funcionando igual (si algo ya existe
  y no quieres que se rompa).
- Qué queda fuera, si hay algo que sabes que no quieres tocar todavía.

No necesitas decidir tú en qué carpeta va el código, cómo se llama el
módulo, ni qué tests hacen falta. El proyecto ya tiene reglas escritas para
eso (arquitectura, dónde vive cada cosa, cuándo testear) y el agente las
aplica solo. Pedirle "organízalo en tres carpetas separadas" no ayuda —
pedirle "quiero que TikTok funcione como un feed más" sí.

## Qué tipo de tarea es

Antes de escribir el prompt, identifica cuál de estos cuatro casos es el
tuyo — el resto de la guía se organiza alrededor de ellos.

1. **Nueva funcionalidad.** Algo que hoy no existe y quieres que exista:
   una sección nueva, un botón, una integración con un servicio nuevo. Se
   reconoce porque la respuesta a "¿esto ya funciona de alguna forma?" es
   no.
2. **Refactor.** El comportamiento actual está bien, pero el código por
   dentro es un lío, está repetido, o quieres reorganizarlo. Se reconoce
   porque no quieres que nada cambie para quien usa la web — solo por
   dentro.
3. **Bugfix.** Algo está roto o hace algo que no debería. Se reconoce
   porque puedes describir "pasa X, y debería pasar Y".
4. **Auditoría / análisis.** Quieres que alguien revise, entienda o
   diagnostique algo, pero todavía no quieres que se toque nada. Se
   reconoce porque la palabra clave es "dime qué pasa", no "arréglalo".

## Qué debe tener un buen prompt

Una fórmula sencilla que sirve para las cuatro:

**CONTEXTO + OBJETIVO + COMPORTAMIENTO ESPERADO + RESTRICCIONES + QUÉ NO
TOCAR + AUTORIZACIÓN GIT**

- **Contexto** — qué es esto y por qué lo necesitas, en una frase.
- **Objetivo** — qué quieres conseguir al final, dicho como resultado, no
  como plan técnico.
- **Comportamiento esperado** — qué debe seguir funcionando igual que
  antes, si aplica.
- **Restricciones** — cualquier límite real: un plazo, un dato que no se
  puede perder, una parte que no se puede tocar.
- **Qué no tocar** — partes del proyecto que sabes que son delicadas o que
  simplemente no forman parte de este encargo.
- **Autorización Git** — qué puede hacer con el repositorio (ver la
  sección de más abajo).

## Plantilla mínima universal

Copia esto y rellena los huecos:

```
Quiero [objetivo].

Contexto:
[lo necesario]

Debe:
- [...]
- [...]

No debe:
- [...]
- [...]

Verifica el resultado.

No hagas stage, commit, push, PR ni merge.
```

La última línea puedes cambiarla según cuánto quieras autorizar (ver más
abajo). El resto vale para casi cualquier encargo.

## Plantilla: nueva funcionalidad

```
Quiero añadir [funcionalidad] a Riff Valley.

Sirve para: [para qué la necesitas].

Debe:
- [comportamiento que tiene que tener]
- [con qué otra cosa tiene que convivir, si aplica]

No debe:
- [algo que no quieres que cambie de paso]

Inspecciona el proyecto y decide tú dónde encaja mejor.
Verifica el resultado.

No hagas stage, commit, push, PR ni merge.
```

No hace falta decir en qué carpeta va ni cómo se debe llamar nada por
dentro — eso lo decide el agente inspeccionando el proyecto primero.

## Plantilla: refactor

```
Quiero refactorizar [qué parte del código].

El comportamiento actual debe preservarse exactamente — esto es
reorganización interna, no un cambio de lo que la web hace.

Inspecciona antes de cambiar nada.
Protege con tests lo que tenga riesgo real de romperse.
No aproveches para hacer limpieza de cosas no relacionadas.

Verifica el resultado.

No hagas stage, commit, push, PR ni merge.
```

## Plantilla: bugfix

```
Hay un bug: [qué pasa] cuando [en qué situación].
Debería pasar: [qué esperarías que pasara en su lugar].

Reproduce el bug primero, identifica la causa, y corrige solo eso.
Añade un test de regresión si aporta valor real.
No aproveches para refactorizar todo lo que esté alrededor.

Verifica el resultado.

No hagas stage, commit, push, PR ni merge.
```

## Plantilla: auditoría

```
Quiero una auditoría de [qué parte del proyecto].

No implementes nada todavía.
Inspecciona y presenta los hallazgos.
Propón el mínimo siguiente paso, pero no lo ejecutes.

No hagas stage, commit, push, PR ni merge.
```

## Git: qué tengo que decir

Esto es importante y se olvida fácil: **implementar no es lo mismo que
hacer commit, ni hacer commit es lo mismo que hacer push, ni hacer push es
lo mismo que abrir un PR, ni abrir un PR es lo mismo que hacer merge.**
Son cinco cosas distintas, y el agente no asume ninguna de ellas por su
cuenta — tienes que decir explícitamente hasta dónde quieres que llegue.

Ejemplos de frases que puedes usar tal cual, según cuánto quieras
autorizar:

- **"No hagas ninguna operación Git."** — solo quieres ver el resultado,
  sin tocar el repositorio todavía.
- **"Puedes hacer commit, pero no push."** — quieres el cambio guardado
  localmente para revisarlo tú antes de subirlo.
- **"Sube la rama y crea PR a dev, pero no hagas merge."** — quieres que
  otra persona (o tú mismo) revise el PR antes de integrarlo.

Si no dices nada sobre Git, la respuesta por defecto es la más
conservadora: no se toca el repositorio.

## Cuánta información dar

**Buen prompt:**
- Un objetivo concreto y reconocible.
- Qué comportamiento debe mantenerse.
- Las restricciones que de verdad importan.

**Mal prompt:**
- Inventarte una arquitectura de carpetas o nombres de archivo tú mismo.
- Pegar un documento enorme de instrucciones "por si acaso".
- Intentar decirle cómo implementar cada línea de código.
- Mezclar varias tareas independientes en un mismo prompt.

Un prompt corto no es un prompt pobre. Cuanto más cortas y claras sean tus
frases, más fácil es que el agente aplique bien las reglas del proyecto
—esas reglas ya están escritas, tú no tienes que repetirlas.

## Ejemplos reales

**Añadir una red social nueva:**

> Quiero que YouTube funcione como un feed más, junto a Instagram,
> Telegram y TikTok. Inspecciona cómo están montados los feeds actuales y
> reutiliza lo que ya exista si encaja. No toques Instagram, Telegram ni
> TikTok. No hagas stage, commit, push, PR ni merge.

**Corregir un bug:**

> Al abrir el detalle de un post de Instagram con varias fotos, la
> segunda foto no se ve. Debería poder verse igual que la primera.
> Reproduce el bug, identifica la causa y corrige solo eso. No hagas
> ninguna operación Git.

**Refactorizar un componente complejo:**

> El componente del calendario de conciertos ha crecido mucho y mezcla
> demasiadas cosas. Quiero que se reorganice por dentro sin que cambie
> nada de lo que ve el usuario. Ve haciéndolo en pasos pequeños y
> verificando entre uno y el siguiente. Puedes hacer commit, pero no
> push.

**Pedir una auditoría:**

> Quiero saber si la sección de reviews tiene algún problema de
> rendimiento o de datos incorrectos. No implementes nada, solo
> investiga y cuéntame qué encuentras y qué harías primero. No hagas
> ninguna operación Git.

## Cuando no sabes cómo hacerlo

Esto es importante: **no necesitas tener la solución técnica antes de
pedir ayuda.** Es perfectamente válido, y muchas veces lo mejor, escribir
algo así:

> Quiero conseguir X. No sé cuál es la mejor forma de integrarlo.
> Inspecciona el proyecto y propón el plan mínimo antes de implementar.

El agente puede investigar el proyecto, proponerte un plan corto, y
esperar tu confirmación antes de tocar nada. No hace falta resolver tú la
arquitectura primero — para eso están las reglas internas del proyecto.

## Checklist antes de enviar

- ¿Está claro qué quiero conseguir?
- ¿He explicado qué debe mantenerse?
- ¿Hay algo que no quiero que toque?
- ¿Estoy mezclando varias tareas?
- ¿He indicado qué puede hacer con Git?
- ¿Necesito implementación o solo análisis?
