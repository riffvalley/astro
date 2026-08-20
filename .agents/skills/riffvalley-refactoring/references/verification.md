# Verificación y calidad del diff

Usa la verificación más barata capaz de detectar el riesgo:

```text
focused unit test
        ↓
related test suite
        ↓
typecheck
        ↓
component/integration test
        ↓
build
        ↓
E2E/smoke
```

No ejecutes siempre todos los peldaños. Una función pura puede requerir focused tests + typecheck; WordPress build-time puede justificar tests + typecheck + build; Agenda crítica puede requerir tests + typecheck + componente/E2E relevante.

El build consulta WordPress y es costoso. No lo ejecutes por cada movimiento trivial, pero sí considéralo cuando cambien routing, SSG, queries WordPress, Astro config, build-time o compilación server/client. Explica por qué se ejecutó o se omitió.

## Revisión del diff

Debe poder responderse:

- ¿qué responsabilidad cambió y por qué?
- ¿qué comportamiento permanece?
- ¿qué dependencias aparecen/desaparecen?
- ¿cómo se verificó?

Evita ocultar arquitectura entre formateo, renombrados masivos, CSS, copy o limpieza vecina. Revisa dirección de dependencias, deep imports, ciclos, `shared → feature`, `feature → app` y acceso de una feature a internals de otra.

## Reporting

Entrega de forma compacta:

```text
Changed
- ...

Preserved
- ...

Verified
- ...

Not changed
- ...

Next candidate
- ...
```

No confundas que el código compile con que el comportamiento esté protegido.
