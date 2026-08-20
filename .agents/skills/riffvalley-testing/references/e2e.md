# E2E, smoke, build y typecheck

Reserva E2E para journeys críticos que atraviesan varias capas, no para cada variante visual. Candidatos futuros: home carga/navegación, buscar y abrir contenido, agenda (mes, región y detalle), releases (mes, filtros y disco), novedades nacionales (listado/formulario) y abrir un artículo editorial.

Los smoke tests son aún más pequeños: home, post, agenda y API crítica responden. Dan una red barata tras build/deploy, sin sustituir tests de lógica.

`astro build` detecta compilación, imports, prerender e integraciones de build, pero no reglas incorrectas, carreras, filtros o UX. El build depende de WordPress y puede ser costoso: no se exige para cualquier cambio trivial. Typecheck (`astro check` o equivalente cuando se configure) comprueba tipos, no comportamiento.

No configures ahora Playwright ni otro runner. Cuando haya tooling, elige APIs y configuración con las skills/documentación correspondientes; esta skill sólo prioriza journeys y evita E2E everything, proveedores reales, selectores frágiles y waits por tiempo.
