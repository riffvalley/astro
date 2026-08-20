# Resiliencia: timeout, cancelación, retry y degradación

## Timeout y abort

Las llamadas externas que puedan bloquear build, SSR o una interacción deben tener un límite razonable cuando sea técnicamente aplicable. No hay un timeout universal: depende de proveedor, entorno, coste y UX. Usa `AbortController` o el mecanismo disponible y distingue un timeout/cancelación de un error de negocio.

En cliente, una petición puede quedar obsoleta al cambiar mes, filtro, búsqueda o estado. Si B expresa el estado actual, A no puede sobrescribir su resultado al terminar después. Cancela A con `AbortController` o conserva una identidad/version de request y acepta únicamente la última. Las race conditions son un riesgo explícito, no un detalle visual.

## Retry

Reintenta de forma limitada sólo fallos transitorios: red temporal, algunos 5xx o 429 con una estrategia apropiada. Usa backoff exponencial, máximo de espera, un número de intentos finito y logs con contexto.

No reintentes ciegamente 400, 401, 403, 404, errores de validación ni POST no idempotentes que podrían duplicar la operación. `submitNationalReleases` ya trata 429 como UX específica y no se reintenta automáticamente; es el comportamiento apropiado para una mutación pública. El manejo actual de WordPress (cola, espaciado, retries limitados de 429/5xx) es un caso real que se debe estudiar, no copiar de forma automática.

## Fallo parcial y degradación

Cuando varias fuentes son independientes, decide explícitamente si el producto puede responder de forma parcial. Los calendarios regionales de Google pueden permitir mostrar los que sí llegaron y registrar el fallo; `Promise.allSettled()` sería una opción si esa UX es válida. No lo apliques universalmente: si las fuentes forman una única transacción lógica, un resultado parcial puede ser engañoso.

Degrada con elegancia sólo las mejoras opcionales, como una red social o una miniatura externa. No ocultes un fallo que impide producir contenido crítico o un estado de negocio válido.

## Observabilidad

Registra de forma proporcional `provider`, operación, status, intento y duración cuando ayuden a diagnosticar. No vuelques JSON completos, secretos o payloads enormes. Un `catch {}` sólo es aceptable como decisión consciente y best-effort para una mejora opcional; no para silenciar un fallo importante.
