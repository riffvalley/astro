# Límites y decisión de ubicación

## Mapa objetivo

```text
src/
├── app/       # composición global
├── features/  # dominios de negocio
├── shared/    # reutilización real e infraestructura transversal
├── pages/     # rutas y composition roots de Astro
└── styles/    # estilos globales y tokens
```

La forma es una dirección de evolución, no una orden de migrar todo `src/` de una vez. Al tocar una pieza, muévela sólo si mejora claramente su límite y entra en el alcance autorizado.

## `app/`: composición global

Aquí vive lo que define la aplicación completa, no un dominio concreto:

- `layouts/` (por ejemplo, el actual `Layout.astro` migraría a `app/layouts/`), shell, header/footer y navegación global.
- configuración ligada a la composición global, como tema o metadatos transversales.
- componentes de aplicación que ensamblan varias features sin convertirse en dueños de sus reglas.

`app/` puede consumir APIs públicas de features y `shared/`. No es un segundo cajón de sastre para componentes ni lógica de negocio.

## `features/`: comportamiento por dominio

Una feature posee una capacidad reconocible para usuarios y negocio, con sus modelos, comunicación con proveedores, reglas, componentes y composables cuando los necesita. Dominios actuales naturales:

- `agenda`: calendarios regionales de Google, eventos, mapa y calendario Vue.
- `editorial`: posts, categorías, páginas y presentación del contenido de WordPress.
- `releases`: guía de lanzamientos globales y discos.
- `national-releases`: novedades nacionales y propuesta de lanzamientos.
- `redactores`: perfiles curatoriales y sus reels.
- `social`: feeds de Instagram y Telegram.
- `search`: búsqueda del contenido editorial.

Una feature puede contener Astro y Vue si son representación propia de ese dominio. Su código privado no se importa desde otra feature.

### Cuándo crear una feature

Crea una feature cuando hay una capacidad de producto con vocabulario propio, datos/reglas propios o una evolución independiente. Normalmente reúne al menos dos de: integración, modelo, interacción, componentes, endpoint o reglas de transformación.

Ejemplos: añadir filtros y listados de un nuevo catálogo musical; gestionar una agenda de festivales; publicar propuestas de lanzamientos nacionales.

### Cuándo no crear una feature

No crees una feature para:

- una variante visual local de una feature existente;
- una utilidad genérica pequeña;
- un único bloque de composición de una ruta que no tiene comportamiento ni ciclo de vida propios;
- agrupar archivos porque tienen la misma tecnología (`vue/`, `api/`, `utils/`).

Mantén esa pieza junto a su feature actual o, si es global de verdad, en `app/` o `shared/`.

## `shared/`: sólo reutilización demostrada

Contiene contratos y utilidades independientes de un dominio: UI realmente genérica, utilidades puras, infraestructura transversal y configuración compartida.

Ejemplos potenciales: un `shared/ui/MonthYearPicker.vue` sólo si lo mantienen y consumen al menos dos features; un cliente base del backend propio que no modele un dominio; utilidades de fecha puras sin semántica de lanzamientos.

### Cuándo mover a `shared/`

Muévelo cuando ya tenga dos consumidores independientes —o una necesidad inmediata, concreta y confirmada de dos— y su contrato no exponga términos ni datos del dominio de origen. Define una API pequeña y estable.

### Cuándo no mover a `shared/`

No lo muevas «por si acaso», porque visualmente se parece, o para reducir imports relativos. `ReleaseGroup`, `DiscModal`, DTOs de WordPress, la paleta de tipos de lanzamiento y la configuración de calendarios siguen perteneciendo a su dominio mientras sus conceptos lo hagan.

Evita directorios vagos como `shared/helpers`, `shared/common`, `shared/misc`, `components/utils` o `lib`. Usa subáreas con propósito: `shared/ui`, `shared/http`, `shared/date`, y sólo cuando su contenido justifique el área.

## `pages/`: rutas de Astro

`pages/` conserva el routing y los endpoints de Astro. Una página debe:

- declarar el modo de render necesario (`prerender = false` cuando proceda);
- leer parámetros de ruta o query;
- coordinar layout, APIs públicas de features e islas Vue;
- devolver la respuesta HTTP cuando sea un endpoint.

No debe implementar reglas de selección editorial, mapeos de proveedor, paginación, estado de UI complejo ni detalles de un dominio que puedan vivir en la feature. La página puede calcular el rango técnico necesario para una ruta, pero, si ese cálculo también pertenece a la agenda o se repite, debe extraerse a `features/agenda`.

## `styles/`

Mantiene tokens, reset/base, estilos globales y estilos transversales. Los estilos de una feature viven junto a su componente Astro/Vue; no se trasladan a globales sólo para centralizarlos. El `global.css` actual contiene tokens Tailwind y estilos globales de Gutenberg: ambos son transversales y encajan aquí.

## Cómo decidir un archivo nuevo

1. Nombra la capacidad, no la tecnología: «agenda», «lanzamientos nacionales», «editorial».
2. Si la respuesta es una feature existente, crea el archivo dentro de ella.
3. Si coordina la aplicación completa, usa `app/`; si registra una ruta, `pages/`.
4. Sólo elige `shared/` si es agnóstico del dominio y hay reutilización real.
5. Comprueba que sus imports respetan las reglas de dependencia.

Si quedan dudas, conserva el archivo en el módulo más cercano al dominio. Es más fácil extraer una pieza validada que deshacer una abstracción genérica prematura.
