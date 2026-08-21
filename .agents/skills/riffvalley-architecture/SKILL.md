---
name: riffvalley-architecture
description: Define o aplica la arquitectura modular orientada a features de Riff Valley al crear, reorganizar o extraer módulos, decidir dónde ubicar código o realizar refactors estructurales. Úsala para arquitectura, carpetas, features, límites y dependencias; no para cambios visuales aislados.
---

# Arquitectura de Riff Valley

Guardrails operativos de ownership, ubicación y dirección de dependencias.
Para el mapa completo de `src/` (qué vive en `pages/`, `app/`, `features/`,
`shared/`, `lib/`, `components/`) y sus ejemplos reales, ver
[`docs/technical/architecture.md`](../../../docs/technical/architecture.md). Para decidir si
algo es una feature nueva, extiende una existente o va a `shared`, ver
[`docs/technical/feature-development.md`](../../../docs/technical/feature-development.md) y
`riffvalley-feature-module` — esta skill no repite esa decisión. La
precedencia general entre skills está definida en `riffvalley-refactoring`.

## Dirección de dependencias

```text
pages ──→ app / features / shared / lib
app   ──→ features / shared / lib
features ──→ shared / lib
```

Prohibido siempre, sin excepción:

- `shared → features` (tampoco `→ app` ni `→ pages`).
- `lib → features`.
- `feature A → internals de feature B` (solo su `index.ts` público, y solo
  cuando exista una relación de producto explícita).
- Reglas/modelos puros de dominio dependiendo de componentes, Astro o Vue
  — la UI depende de la regla, nunca al revés.

Romper cualquiera de estas cuatro no es un detalle de estilo: invierte de
qué depende qué, y un cambio en un módulo "de abajo" puede romper todo lo
que se apoya en él silenciosamente.

## Composición frente a lógica de producto

**Componer** es elegir qué se muestra, en qué orden y con qué API pública
de qué features — eso vive en `pages/`, `app/` o en la propia composición
de una Island.

**Es lógica de producto** cualquier regla que calcule, normalice,
seleccione o valide algo del dominio — agrupar, paginar, mapear una
respuesta externa, decidir qué contenido destaca. Eso vive dentro de la
feature dueña, nunca en una página, en un layout o en el shell de `app/`.

## DTO externo → modelo interno

Un componente nunca debe conocer la forma cruda de un proveedor externo;
recibe el modelo que su feature ya normalizó:

```ts
// Mal: el componente aprende la forma de WPGraphQL
defineProps<{ post: { featuredImage: { node: { sourceUrl: string } } | null } }>();

// Bien: el adaptador de la feature ya normalizó el dato
defineProps<{ post: { title: string; imageUrl: string | null } }>();
```

## Checklist antes de crear o mover un archivo

- ¿A qué dominio pertenece?
- ¿Es realmente compartido, con reutilización demostrada, o solo lo
  parece?
- ¿Qué dependencias introduce y en qué dirección?
- ¿Rompe alguna de las cuatro prohibiciones de arriba?
- ¿Se puede resolver dentro de la feature actual en vez de moverlo?
- ¿Es una abstracción por necesidad real o por anticipación?

## Anti-patrones operativos

- **`lib` como cajón de sastre** — cualquier lógica que conozca un
  dominio de producto (no solo transporte/infraestructura técnica)
  colándose en `lib/` porque "no encaja en ningún otro sitio". Acércala a
  la feature dueña.
- **Imports profundos entre features** — una feature (o una página)
  importando rutas internas de otra en vez de componer desde
  `pages`/`app` o pasar por un `index.ts` público. Nunca hagas que una
  feature conozca la estructura interna de otra.
- **Lógica de producto filtrándose a una página o a `app/`** — una
  ruta o el shell global calculando/normalizando/seleccionando algo del
  dominio en vez de delegarlo a la feature dueña (ver
  "Composición frente a lógica de producto" arriba).
