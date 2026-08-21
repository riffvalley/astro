import type { RegionCalendar } from './agenda.types';

// Calendarios públicos de Google Calendar, uno por comunidad autónoma (+
// Portugal). Mismos IDs que ya usaba el sitio anterior — añadir un
// concierto nuevo se sigue haciendo directamente en Google Calendar, en el
// calendario de la región correspondiente, y aparece en /agenda-conciertos
// y en el minicalendario de la home al instante (SSR bajo demanda, no hace
// falta rehacer el build).
export const calendars: RegionCalendar[] = [
  { name: 'Andalucía',            id: '36bb2d0aeec9c3eb932a3f083494e2b718993a40aa9509ad64b12fcb0d371186@group.calendar.google.com', color: '#117733' },
  { name: 'Aragón',                id: 'd9004de1795344be0a99402ebd0e9c35fd814a616d7044754cb2dd339034ad1e@group.calendar.google.com', color: '#44AA99' },
  { name: 'Asturias',              id: '9286b5ec3419b6083b858481e21bb8000b79fc024b524e4ded2a819e87ce7c33@group.calendar.google.com', color: '#88CCEE' },
  { name: 'Cantabria',             id: '110622101f0bb305021cad2fa522724c10c9dc75300f2b7fb2161b69902e90d7@group.calendar.google.com', color: '#DDCC77' },
  { name: 'Castilla y León',       id: '857f944d742bc27cdc5eb91166127072c4393b5c9a07eda316162c560006a9fd@group.calendar.google.com', color: '#999933' },
  { name: 'Castilla-La Mancha',    id: '5232eaa58b9ae643492de20dc1d1d73bfc7b94c4845e6bbad2be75c7027b7399@group.calendar.google.com', color: '#CC6677' },
  { name: 'Catalunya',             id: '8b2e1ce49c5b0131f0ff46546f0019ed55b2972be3857bf489a47a0fe38d0b13@group.calendar.google.com', color: '#882255' },
  { name: 'Ceuta y Melilla',       id: '76435755a15e9cd28643eb6fd364ebf400d351bfd01af4a13e443c735921a9c9@group.calendar.google.com', color: '#AA4499' },
  { name: 'Comunidad Valenciana',  id: '4404321273a9eb5fa959873628649a88b859021d105850069714cb67e75f3232@group.calendar.google.com', color: '#4477AA' },
  { name: 'Extremadura',           id: '21cf0820e77e582ca187c5cdc45677563e3e34bd03b36dad991f2ede95936e18@group.calendar.google.com', color: '#332288' },
  { name: 'Galicia',               id: '78f8cc3ce1642649683a6ba9fa386e6203652604cdf6ce8d3eabb170cab15b34@group.calendar.google.com', color: '#CCBB44' },
  { name: 'Islas Baleares',        id: 'aa35d23467f0d4e6cd0aca36166dfddc50e120a83d5332768f9a81eb6f55cdbe@group.calendar.google.com', color: '#AA4499' },
  { name: 'Islas Canarias',        id: 'd15321e5a2350eec2877f81d122ee5e33ec3c9140c1bea0645a83741ba392519@group.calendar.google.com', color: '#117733' },
  { name: 'La Rioja',              id: '3ed8e3311a8c406194d47e28a3a9c8eac60514cbc7b7e9f79ed4b19bf67062ce@group.calendar.google.com', color: '#44AA99' },
  { name: 'Madrid',                id: 'cf58aa79195b03bd5fd14f25dcadfc076b47ffefee657c1e4571baa7a915b5e3@group.calendar.google.com', color: '#88CCEE' },
  { name: 'Murcia',                id: '16c19d378c7e958c8452d04f151b06c3d42d9cd6082d4e48de8d6b614dbe63e1@group.calendar.google.com', color: '#DDCC77' },
  { name: 'Navarra',               id: '49ac625e8b56338033f0f150c1dad6577eab1cb507a7fa42e36119c0fa30c649@group.calendar.google.com', color: '#999933' },
  { name: 'País Vasco',            id: '88957f1b7b8329168befa18e4ed762f161a6ce3a842768595194d4eb7bda52ef@group.calendar.google.com', color: '#CC6677' },
  { name: 'Portugal',              id: '0d0ec4013326aafea90e227beef8a396e7f999ff5bc2080eac83029504db1acc@group.calendar.google.com', color: '#AA4499' },
];
