// Endpoint SSR bajo demanda (no prerenderizado) que devuelve los eventos de
// un mes dado, usado por el calendario embebido en la home (que se hidrata
// y pide sus propios datos por fetch, en vez de recibirlos por props del
// servidor como /agenda-conciertos — así la home sigue siendo estática).
export const prerender = false;

import type { APIRoute } from 'astro';
import type { AgendaMonthResponse } from '../../features/agenda/model/agendaApi.types';
import { parseAgendaMonthRequest } from '../../features/agenda/utils/agendaMonthRequest';
import { fetchRegionEvents } from '../../features/agenda/server/googleCalendar';
import { calendars } from '../../features/agenda/model/agendaCalendars';

export const GET: APIRoute = async ({ url }) => {
  const result = parseAgendaMonthRequest(url.searchParams, new Date());
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { year, month } = result.request;

  const monthStart = new Date(year, month - 1, 1);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startOffset);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 42);

  const apiKey = import.meta.env.GOOGLE_CALENDAR_API_KEY;
  const events = apiKey ? await fetchRegionEvents(calendars, gridStart, gridEnd, apiKey) : [];
  const response: AgendaMonthResponse = { events };

  return new Response(JSON.stringify(response), {
    headers: {
      'content-type': 'application/json',
      // Los conciertos no cambian segundo a segundo — cachea un rato para
      // no golpear la API de Google en cada visita a la home.
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
};
