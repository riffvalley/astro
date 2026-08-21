// Prerenderizado (estático, no SSR): la geometría del mapa no depende de
// datos en vivo, así que se calcula una vez en build y se sirve como JSON
// estático — lo usa el calendario embebido en la home para no tener que
// mandar toda la lógica de d3-geo/es-atlas/world-atlas al cliente.
import type { APIRoute } from 'astro';
import { buildSpainMap } from '../../features/agenda/server/spainMap';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(buildSpainMap()), {
    headers: { 'content-type': 'application/json' },
  });
};
