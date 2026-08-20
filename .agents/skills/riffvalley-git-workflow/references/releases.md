# Integración y promoción

## Dev como rama integrada

`dev` contiene cambios ya revisados que son candidatos a promoción. No es una rama personal ni un espacio para experimentos rotos. Todo lo que entra debe haber pasado su PR, tener alcance entendido y superar el quality gate actual.

## Promoción

La promoción crea una única PR:

```text
dev → main
```

No abras PRs paralelas de cada task branch a `main` después de integrarlas en `dev`. La PR de promoción representa el estado integrado que se publicará.

Antes de promover, confirma:

- CI verde;
- cambios incluidos conocidos;
- ausencia de trabajo experimental;
- validación manual necesaria para el alcance;
- estado de despliegue si aplica.

`main` debe seguir representando código estable.

## Sincronización posterior

Después de integrar `dev → main`, comprueba si ambas ramas siguen alineadas. Si el merge creó un commit adicional en `main`, sincroniza `dev` con `main` antes del siguiente ciclo cuando sea necesario.

Nunca resuelvas divergencias mediante force push sin motivo explícito y autorización. El objetivo es que la integración continúe desde una base coherente con producción.
