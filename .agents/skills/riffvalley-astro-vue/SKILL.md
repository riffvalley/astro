---
name: riffvalley-astro-vue
description: Decide cómo usar Astro, Vue 3 y Astro Islands en Riff Valley al crear o convertir componentes, añadir client:*, introducir comportamiento cliente, elegir fetch/SSR o reducir JavaScript enviado al navegador.
---

# Astro, Vue e Islands en Riff Valley

Riff Valley es principalmente editorial: **Astro por defecto; Vue sólo cuando exista una razón real para ejecutar JavaScript reactivo en el cliente**. Esta skill gobierna esa decisión concreta del proyecto y complementa, sin sustituir, `riffvalley-architecture` para límites y dependencias.

Si están instaladas, consulta `astro-framework` y `vue-best-practices` para sintaxis, APIs y comportamiento general del framework. Ante conflicto, esta skill decide la política específica de Riff Valley; la precedencia general está definida en `riffvalley-refactoring`.

Los criterios cuantitativos o automáticos de `vue-best-practices` para dividir componentes, crear composables o extraer código son señales de inspección, no órdenes arquitectónicas. Riff Valley decide si se extrae, el alcance, el ownership y el slice; `vue-best-practices` explica cómo implementarlo correctamente una vez aprobado.

Las reglas “MUST” de `astro-framework` sólo aplican cuando la capacidad correspondiente forma parte de la tarea y es compatible con la arquitectura de Riff Valley. No obligan por sí mismas a introducir `server:defer`, sessions, Content Collections, `astro:env`, cambios de adapter, output o configuración; explican cómo usar esas capacidades cuando Riff Valley decide necesitarlas.

## Flujo

1. Decide si la pieza necesita estado o coordinación reactiva en navegador. Consulta [astro-vs-vue.md](references/astro-vs-vue.md).
2. Si necesita Vue, define la frontera más pequeña que contenga el estado compartido y selecciona la hidratación menos agresiva compatible con UX. Consulta [island-directives.md](references/island-directives.md).
3. Separa build/servidor de navegador y prepara props serializables y orientadas a la feature. Consulta [server-client.md](references/server-client.md).
4. Si la island concentra responsabilidades independientes, evalúa extracciones cohesionadas sin fragmentar por ceremonia. Consulta [hydration-boundaries.md](references/hydration-boundaries.md).

Patrón preferido:

```text
Astro page
    ↓
Astro composition
    ↓
Vue island (sólo donde empieza la interacción)
    ↓
Vue components internos
```

No conviertas un componente Astro en Vue por comodidad, estilos, props o lógica que sólo se ejecuta en servidor/build. Tampoco uses `client:load` por defecto.

## Checklist antes de añadir o modificar una Island

- ¿Necesita realmente JavaScript cliente?
- ¿Astro sería suficiente?
- ¿Cuál es la directiva de hidratación menos agresiva válida?
- ¿La frontera de la Island es adecuada?
- ¿Estamos enviando datos innecesarios al cliente?
- ¿Hay código server-only entrando accidentalmente al bundle?
- ¿El estado pertenece a una sola Island?
- ¿La complejidad justifica Vue, composables o componentes hijos?
