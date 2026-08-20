# Hotfixes

Un hotfix es una excepción para un bug urgente de producción. Si puede esperar al flujo normal, usa `fix/<descripcion>` desde `dev` y promuévelo mediante `dev → main`.

## Flujo

```text
main
 ↓
hotfix/<descripcion>
 ↓ PR
main
 ↓
sincronizar dev
```

La task branch de hotfix nace de `main` y su PR apunta a `main`. Después de integrarla, sincroniza la corrección hacia `dev`; un hotfix no puede quedar únicamente en producción mientras `dev` continúa sin él.

Los mismos requisitos de autorización aplican: terminar una corrección local no autoriza commit, push, PR ni merge. Revisa el comportamiento afectado, los checks proporcionales y el diff antes de publicar.
