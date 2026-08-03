// Geometría del mapa de comunidades autónomas (+ Ceuta, Melilla y Portugal)
// usado por el filtro de la agenda de conciertos. Se calcula en servidor
// (Astro frontmatter) con d3-geo a partir de datos reales del IGN (es-atlas,
// CC-BY 4.0) y Natural Earth (world-atlas, dominio público) — no son
// coordenadas de un icono/logo, es la costa real proyectada. Mismo enfoque
// (fitExtent + inset de Canarias recortado por longitud) que ya usa
// Comunidad-bdsm/front/src/components/Map.astro para su mapa de España.
import { feature } from 'topojson-client';
import { geoMercator, geoPath, type GeoProjection } from 'd3-geo';
import type { Topology } from 'topojson-specification';
import type { FeatureCollection, Feature, Geometry, MultiPolygon } from 'geojson';
import autonomousRegionsTopo from 'es-atlas/es/autonomous_regions.json';
import worldData from 'world-atlas/countries-50m.json';

// Código INE de comunidad autónoma (2 primeros dígitos del NATCODE) -> mismo
// nombre usado en el array `calendars` de agenda-conciertos.astro. Ceuta (18)
// y Melilla (19) comparten un único calendario/filtro. El 20 es Gibraltar,
// que no es un filtro válido y se descarta.
const INE_TO_CALENDAR_NAME: Record<string, string> = {
  '01': 'Andalucía',
  '02': 'Aragón',
  '03': 'Asturias',
  '04': 'Islas Baleares',
  '05': 'Islas Canarias',
  '06': 'Cantabria',
  '07': 'Castilla y León',
  '08': 'Castilla-La Mancha',
  '09': 'Catalunya',
  '10': 'Comunidad Valenciana',
  '11': 'Extremadura',
  '12': 'Galicia',
  '13': 'Madrid',
  '14': 'Murcia',
  '15': 'Navarra',
  '16': 'País Vasco',
  '17': 'La Rioja',
  '18': 'Ceuta y Melilla',
  '19': 'Ceuta y Melilla',
};
const CANARY_ISLANDS_ID = '05';

export interface MapShape {
  id: string;
  calendarName: string;
  d: string;
}

export interface SpainMap {
  width: number;
  height: number;
  shapes: MapShape[];
  /** Recuadro discontinuo alrededor del inset de Canarias. */
  compositionBorder: string;
}

// world-atlas empaqueta el territorio completo de Portugal (incluidos
// Madeira/Azores, ~-31 a -17 de longitud) como un único MultiPolygon, que
// quedaría fuera de la proyección centrada en la península. Nos quedamos
// sólo con los polígonos de Portugal continental.
const MAINLAND_MIN_LON = -12;
function mainlandOnly(geometry: Geometry): Geometry {
  if (geometry.type !== 'MultiPolygon') return geometry;
  const isMainlandPolygon = (polygon: number[][][]) => polygon[0].some(([lon]) => lon >= MAINLAND_MIN_LON);
  return {
    type: 'MultiPolygon',
    coordinates: (geometry as MultiPolygon).coordinates.filter(isMainlandPolygon),
  };
}

let cached: SpainMap | null = null;

export function buildSpainMap(width = 613, height = 544, padding = 18): SpainMap {
  if (cached) return cached;

  const topology = autonomousRegionsTopo as unknown as Topology;
  const regionsFC = feature(topology, topology.objects.autonomous_regions) as unknown as FeatureCollection;
  const regionFeatures = regionsFC.features.filter((f) => INE_TO_CALENDAR_NAME[String(f.id)]);

  const canaryFeature = regionFeatures.find((f) => String(f.id) === CANARY_ISLANDS_ID)!;
  const mainlandFeatures = regionFeatures.filter((f) => String(f.id) !== CANARY_ISLANDS_ID);

  // Canarias real: ~1500km al suroeste de la península. Como en cualquier
  // mapa impreso de España, se dibuja aparte en un recuadro fijo (abajo a la
  // izquierda), y la península se desplaza a la derecha para dejarle sitio.
  const insetBox = { x: padding, y: height - padding - 128, width: 172, height: 128 };
  const insetGap = 16;

  const mainlandProjection = geoMercator().fitExtent(
    [
      [insetBox.x + insetBox.width + insetGap, padding],
      [width - padding, height - padding],
    ],
    { type: 'FeatureCollection', features: mainlandFeatures },
  );
  const mainlandPathGen = geoPath(mainlandProjection as GeoProjection);

  const canaryProjection = geoMercator().fitExtent(
    [
      [insetBox.x + 8, insetBox.y + 8],
      [insetBox.x + insetBox.width - 8, insetBox.y + insetBox.height - 8],
    ],
    { type: 'FeatureCollection', features: [canaryFeature] },
  );
  const canaryPathGen = geoPath(canaryProjection as GeoProjection);

  const shapes: MapShape[] = [
    ...mainlandFeatures.map((f) => ({
      id: String(f.id),
      calendarName: INE_TO_CALENDAR_NAME[String(f.id)],
      d: mainlandPathGen(f as Feature) ?? '',
    })),
    {
      id: CANARY_ISLANDS_ID,
      calendarName: INE_TO_CALENDAR_NAME[CANARY_ISLANDS_ID],
      d: canaryPathGen(canaryFeature as Feature) ?? '',
    },
  ];

  // Portugal no forma parte de es-atlas (es sólo España). Se proyecta con la
  // misma instancia de mainlandProjection, así queda alineado con el resto
  // del mapa sin necesidad de recalcular escala/traslación a mano.
  const worldTopology = worldData as unknown as Topology;
  const countries = feature(worldTopology, worldTopology.objects.countries) as unknown as FeatureCollection;
  const portugalFeature = countries.features.find((f) => String(f.id) === '620');

  if (portugalFeature) {
    const portugalMainland: Feature = { ...portugalFeature, geometry: mainlandOnly(portugalFeature.geometry) };
    shapes.push({ id: 'PT', calendarName: 'Portugal', d: mainlandPathGen(portugalMainland) ?? '' });
  }

  const b = insetBox;
  const compositionBorder = `M${b.x},${b.y} H${b.x + b.width} V${b.y + b.height} H${b.x} Z`;

  cached = { width, height, shapes, compositionBorder };
  return cached;
}
