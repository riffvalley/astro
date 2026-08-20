# API pública y dependencias de una feature

Una feature puede exponer `features/foo/index.ts` cuando otra zona necesita consumir más de una pieza o cuando conviene proteger sus internals. No lo añadas a una feature puramente local si sólo añade una capa.

```ts
import { AgendaCalendar, type CalendarEvent } from '@/features/agenda';
```

Es preferible a importar `components/calendar/internal/AgendaCalendar.vue`. Exporta sólo componentes raíz, contratos, tipos o funciones que los consumidores necesiten. No conviertas el barrel en una lista de todos los archivos de la feature: los internals deben poder cambiar sin romper a quien la consume.

## Dependencias entre features

La dirección de imports la define `riffvalley-architecture`. Antes de que `feature-a` use algo de `feature-b`, evalúa en orden:

1. ¿pueden `pages` o `app` coordinar ambas capacidades?
2. ¿`feature-b` puede exponer un contrato mínimo y claro?
3. ¿el concepto es realmente agnóstico y tiene reutilización que justifique `shared`?
4. ¿ambas piezas pertenecen en realidad a una sola capacidad?

No accedas a internals de otra feature. Evita la dependencia mutua: suele señalar una frontera equivocada o una composición que debe subir a `pages`/`app`.

## Cuándo usar una API pública

- Una página Astro puede importar el componente raíz o la consulta pública de una feature para componer una ruta.
- Un endpoint Astro conserva request, status y headers, y puede delegar una operación en la API pública de su feature.
- Una feature sólo consume el contrato público de otra cuando la relación de producto es explícita y la composición superior no resuelve mejor el caso.

La API no es un requisito ceremonial: su objetivo es expresar un contrato estable, no ocultar archivos sin necesidad.

## Anti-patrones relacionados

- **Deep imports:** consumir rutas internas de otra feature.
- **Barrel explosion:** reexportar todo desde `index.ts` sin distinguir contrato e implementación.
- **Wrapper explosion:** crear una fachada que sólo reenvía una llamada sin reducir acoplamiento ni dar semántica.
