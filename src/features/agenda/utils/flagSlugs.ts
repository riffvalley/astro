// Banderas oficiales (Wikimedia Commons, dominio público / uso libre como
// símbolo oficial), servidas como estáticos desde /public/flags.
const flagSlugByCalendarName: Record<string, string> = {
  'Andalucía': 'andalucia',
  'Aragón': 'aragon',
  'Asturias': 'asturias',
  'Cantabria': 'cantabria',
  'Castilla y León': 'castilla-y-leon',
  'Castilla-La Mancha': 'castilla-la-mancha',
  'Catalunya': 'catalunya',
  'Comunidad Valenciana': 'comunidad-valenciana',
  'Extremadura': 'extremadura',
  'Galicia': 'galicia',
  'Islas Baleares': 'islas-baleares',
  'Islas Canarias': 'islas-canarias',
  'La Rioja': 'la-rioja',
  'Madrid': 'madrid',
  'Murcia': 'murcia',
  'Navarra': 'navarra',
  'País Vasco': 'pais-vasco',
  'Portugal': 'portugal',
};

export function flagSlugsFor(calendarName: string): string[] {
  if (calendarName === 'Ceuta y Melilla') return ['ceuta', 'melilla'];
  const slug = flagSlugByCalendarName[calendarName];
  return slug ? [slug] : [];
}
