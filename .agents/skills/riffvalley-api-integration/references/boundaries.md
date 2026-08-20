# Propiedad y frontera de una integración

Aplica primero `riffvalley-feature-module`: la API pertenece normalmente a la capacidad que sirve, no a un directorio técnico. Por ejemplo, clientes de agenda tenderían a `features/agenda/api/`; lanzamientos, a sus features. Infraestructura realmente transversal puede llegar a `shared/api/` o `shared/config/`, pero no conviertas eso en un nuevo `src/lib` genérico.

## Representación externa y modelo interno

La representación externa refleja el contrato del proveedor. El modelo interno usa el vocabulario que consumen Riff Valley y su UI. Introduce la frontera DTO → modelo cuando aísla nombres/formatos malos, campos innecesarios, opcionales complejos, inconsistencias, varios proveedores para un mismo concepto o cambios previsibles del proveedor.

No la impongas si ambas formas son trivialmente iguales y no hay protección ni normalización que obtener. El principio es: **introduce una frontera cuando proteja al dominio, no porque un patrón la exija**.

## API pública y endpoints

Las rutas de `src/pages/api/` son fronteras HTTP de Riff Valley. Mantienen request, validación, status, headers y response; cuando la lógica crezca, delegan en una función de feature en lugar de convertirse en el dueño de reglas de negocio.

```text
request → validation → feature/application function → response
```

No hagas deep imports entre features para reutilizar una integración. Coordina desde `pages`/`app`, usa una API pública mínima o, sólo si es verdaderamente agnóstico y reutilizado, evalúa `shared`.

## Cliente HTTP común

Una futura ayuda pequeña puede centralizar timeout, `AbortSignal`, comprobación de status, parseo JSON, errores básicos o headers repetidos. No crees `IHttpClient`, fábricas, `BaseApiRepository` o clases abstractas hasta que varias integraciones tengan una necesidad concreta y estable. Un wrapper que sólo llama a `fetch` añade ceremonia, no valor.
