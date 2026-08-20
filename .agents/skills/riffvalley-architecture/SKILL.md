---
name: riffvalley-architecture
description: Define o aplica la arquitectura modular orientada a features de Riff Valley al crear, reorganizar o extraer módulos, decidir dónde ubicar código o realizar refactors estructurales. Úsala para arquitectura, carpetas, features, límites y dependencias; no para cambios visuales aislados.
---

# Arquitectura de Riff Valley

Usa esta skill antes de crear, mover o extraer código en `src/`. Riff Valley es un sitio Astro 6 estático con islas Vue 3, TypeScript, WordPress headless mediante WPGraphQL, Google Calendar y un backend propio. Netlify adapta las rutas y endpoints que requieren SSR bajo demanda.

La precedencia general entre skills está definida en `riffvalley-refactoring`.

El destino es modular y orientado a features, sin imponer Clean Architecture por ceremonia:

```text
src/
├── app/
├── features/
├── shared/
├── pages/
└── styles/
```

No reorganices código existente sólo para satisfacer esta forma. Haz cambios incrementales, dentro del alcance de la tarea, y conserva el comportamiento de Astro estático, las islas hidratadas y los endpoints SSR.

## Flujo

1. Identifica el dominio y el runtime: build estático/servidor Astro, endpoint SSR o navegador dentro de una isla Vue.
2. Consulta [boundaries.md](references/boundaries.md) para ubicar el código y decidir si nace una feature.
3. Consulta [dependency-rules.md](references/dependency-rules.md) antes de crear imports entre módulos o exponer una API.
4. Para extraer o ampliar un dominio, sigue [feature-structure.md](references/feature-structure.md).
5. Para una reorganización o revisión, busca primero los casos relevantes en [anti-patterns.md](references/anti-patterns.md).

La página Astro es el composition root de su ruta: coordina layout, datos de servidor e islas; no absorbe reglas de negocio. Las islas Vue presentan e interactúan; sus componentes no deben depender de DTOs de WordPress, Google Calendar o el backend de Riff Valley.

## Checklist antes de crear o mover un archivo

- ¿A qué dominio pertenece?
- ¿Es realmente compartido?
- ¿Qué dependencias introduce?
- ¿Rompe la dirección de dependencias?
- ¿Se puede resolver dentro de la feature actual?
- ¿Estamos creando abstracción por necesidad o por anticipación?
