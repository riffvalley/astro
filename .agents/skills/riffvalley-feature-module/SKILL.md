---
name: riffvalley-feature-module
description: Crea o modulariza features de Riff Valley por capacidad de producto, decide su frontera, estructura mínima, API pública y posible extracción a shared. Úsala al crear un módulo, aislar funcionalidad por dominio, mover código a features o dividir una funcionalidad existente.
---

# Features de Riff Valley

Una feature representa una **capacidad coherente de producto**, no una carpeta de tecnología o de componentes visualmente parecidos. Posee, en la medida necesaria, sus modelos, lógica, acceso a datos, transformaciones, componentes y composables.

Esta skill define la receta de creación y extracción incremental. `riffvalley-architecture` mantiene la autoridad sobre límites globales y dependencias; `riffvalley-astro-vue`, sobre Astro, Vue, hidratación y server/client. Consúltalas cuando esas decisiones entren en juego; no las sustituyas. La precedencia general está definida en `riffvalley-refactoring`.

## Flujo resumido

1. Nombra la capacidad, su problema, datos, UI, APIs y consumidores. Si no hay un nombre de dominio claro, no crees una feature todavía.
2. Declara qué queda dentro y fuera para evitar que absorba dominios vecinos. Sigue el detalle en [creation-workflow.md](references/creation-workflow.md).
3. Elige la estructura mínima que contiene las responsabilidades reales; añade carpetas sólo al extraer código que las necesita.
4. Mantén el código específico junto al dominio y expón una API pública pequeña sólo si hay consumidores externos. Consulta [public-api.md](references/public-api.md).
5. Evalúa `shared` únicamente con reutilización real y un contrato independiente. Consulta [shared-extraction.md](references/shared-extraction.md).
6. Para decidir Astro/Vue o una Island dentro de la feature, sigue `riffvalley-astro-vue`.

Ejemplos del repositorio y posibles evoluciones, no prescriptivos: [module-examples.md](references/module-examples.md).

## Árbol de decisión

```text
¿Pertenece a una capacidad concreta?
│
├─ Sí → feature
│
└─ No
   │
   ├─ ¿Lo usan realmente varias features?
   │   ├─ Sí → evaluar shared
   │   └─ No → mantenerlo local donde se usa
```

```text
¿Necesita Vue?
│
├─ Sí → seguir riffvalley-astro-vue
└─ No → Astro / TS puro
```

## Checklist de verificación

- ¿La feature representa una capacidad clara y tiene una frontera explícita?
- ¿La estructura contiene sólo carpetas con responsabilidades reales?
- ¿Las dependencias y los imports respetan `riffvalley-architecture`?
- ¿No hay deep imports ni dependencias circulares entre features?
- ¿`shared` sigue sin conocer features y no se extrajo por anticipación?
- ¿La API pública es pequeña y el código específico permanece junto al dominio?
- ¿La decisión de Astro/Vue sigue `riffvalley-astro-vue`?
- ¿Se preservó el comportamiento? Los procedimientos detallados de esa comprobación corresponden a `riffvalley-refactoring`.
