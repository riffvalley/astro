---
name: riffvalley-feature-module
description: Crea o modulariza features de Riff Valley por capacidad de producto, decide su frontera, estructura mínima, API pública y posible extracción a shared. Úsala al crear un módulo, aislar funcionalidad por dominio, mover código a features o dividir una funcionalidad existente.
---

# Features de Riff Valley

Una feature es una **capacidad coherente de producto**, no una carpeta de
tecnología ni de componentes visualmente parecidos. Para el flujo completo
de construir una capacidad nueva (requirement → inspect → ownership →
boundary → ...) y ejemplos reales, ver
[`docs/technical/feature-development.md`](../../../docs/technical/feature-development.md); para
el mapa de `src/` y la dirección de dependencias, ver
[`docs/technical/architecture.md`](../../../docs/technical/architecture.md). Esta skill no los
resume: da el checklist operativo para decidir y construir en el momento.

## Dónde vive el código

```
¿Es una capacidad de producto reconocible (datos + UI + evolución propia)?
│
├─ Sí → ¿ya existe una feature dueña de esa capacidad?
│         ├─ Sí → extiéndela ahí
│         └─ No → créala (estructura mínima, ver abajo)
│
└─ No → ¿la necesitan de verdad 2+ features con el mismo contrato?
          ├─ Sí → shared/
          └─ No → ¿es shell global de toda la app (header, footer, nav)?
                    ├─ Sí → app/
                    └─ No → ¿es fetch/layout de una sola ruta?
                              ├─ Sí → page
                              └─ No → ¿es infraestructura sin
                                        conocimiento de dominio?
                                        ├─ Sí → lib/
                                        └─ No → mantenlo local
                                                donde se usa
```

Si necesita Vue o Astro puro, esa decisión es de `riffvalley-astro-vue`,
no de esta skill.

## Estructura emergente, nunca por plantilla

Empieza con la forma mínima que representa trabajo real —
`components/`/`model/`/`index.ts` cuando basta; añade `api/` al mover
comunicación propia, `composables/` con estado Vue coherente, `utils/`
para funciones puras. No crees `domain/`, `application/`,
`infrastructure/`, `repositories/` ni carpetas vacías "por si acaso" o
"para que se parezca a" otra feature. Una estructura profunda solo se
justifica con complejidad real que separar — varios proveedores, reglas
densas, infraestructura significativa —, nunca por plantilla.

Un DTO refleja al proveedor; el modelo usa el vocabulario de la feature.
Separa DTO → modelo solo cuando normaliza campos, elimina datos que la UI
no necesita o protege contra cambios de proveedor — no inventes
`FooDto`/`FooMapper`/`FooModel` si ambas formas ya son idénticas.

## Ownership y dependencias

Cada capacidad tiene un dueño claro: sus modelos, datos, reglas y UI viven
juntos en su feature. **Ninguna feature importa los internals de otra**
(`features/a/components/... → features/b/model/...` está prohibido,
siempre). Antes de que `feature-a` necesite algo de `feature-b`, evalúa en
orden:

1. ¿pueden `pages`/`app` componer ambas capacidades?
2. ¿puede `feature-b` exponer un contrato mínimo en su `index.ts`?
3. ¿el concepto es agnóstico y hay reutilización real → `shared`?
4. ¿en realidad es una sola capacidad mal partida?

Un `index.ts` (API pública) solo aporta valor cuando una feature tiene
consumidores externos reales, expone más de una pieza, o necesita proteger
sus internals — no lo añadas a una feature diminuta de uso puramente
local solo por convención.

## Shared

Extrae a `shared/` solo cuando se cumplan a la vez: hay 2+ consumidores
reales (o dos usos inmediatos y confirmados), el concepto se entiende sin
vocabulario de la feature de origen, puede definirse una API estable, y
moverlo reduce duplicación o acoplamiento reales. Si solo hay un
consumidor actual, el nombre "suena genérico", o el único motivo es
acortar imports — no lo extraigas: duplicar conscientemente es más barato
que deshacer una abstracción equivocada.

## Anti-patrones

- **Feature dumping ground** — un `features/common` (o similar) que
  absorbe cualquier código sin dueño claro.
- **Circular ownership** — dos features que se necesitan mutuamente;
  señal de una frontera equivocada, no un caso a resolver con más imports.
  Reconsidera composición desde `pages`/`app` o un contrato compartido.
- **Barrel explosion** — un `index.ts` que reexporta todos los internals
  en vez de un contrato pequeño y deliberado.
- **Wrapper explosion** — una capa que solo reenvía una llamada sin
  aportar semántica, protección ni simplificación real.

## Checklist de verificación

- ¿La feature representa una capacidad clara con frontera explícita?
- ¿Solo tiene las carpetas que responsabilidades reales justifican?
- ¿Cero imports a internals de otra feature; `shared` sigue sin conocer
  features?
- ¿La API pública, si existe, es pequeña y estable?
- ¿La decisión de Astro/Vue siguió `riffvalley-astro-vue`?
- ¿Se preservó el comportamiento? (procedimiento: `riffvalley-refactoring`)
