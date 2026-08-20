# Seguridad de refactor y regresiones

Cuando aparezca un bug, intenta seguir este ciclo proporcional: reproducir → test que falla cuando aporte valor → corregir → test verde. El test documenta el comportamiento correcto y evita su regreso.

Antes de cambiar código complejo sin tests:

1. identifica su comportamiento observable y los edge cases de riesgo;
2. ejecuta pruebas relevantes existentes;
3. añade characterization tests si una modificación podría cambiarlo por accidente.

Durante un refactor, trabaja en slices pequeños y conserva las pruebas relevantes verdes. Después revisa comportamiento y diff; ejecuta typecheck, build o E2E sólo cuando el alcance/riesgo lo justifique. `riffvalley-refactoring` tiene autoridad sobre la granularidad y la verificación operacional.

## Anti-patrones

- **Snapshot abuse:** snapshots enormes que nadie revisa.
- **Implementation testing:** acoplar el test a estado/estructura interna.
- **Mock everything:** probar una simulación del propio código.
- **E2E everything:** usar navegador para una regla pura.
- **Real provider dependency:** unit tests que necesitan WordPress, Google o backend real.
- **Sleep based tests:** esperar milisegundos en lugar de condiciones observables.
- **Fragile selectors:** depender de estructura CSS accidental.
