export function groupByDay<T extends { releaseDay: string }>(items: T[]): { releaseDay: string; entries: T[] }[] {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    if (!map.has(item.releaseDay)) map.set(item.releaseDay, []);
    map.get(item.releaseDay)!.push(item);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([releaseDay, entries]) => ({ releaseDay, entries }));
}

export const TYPE_LABELS: Record<string, string> = { single: 'Single', ep: 'EP', album: 'Álbum' };

// Colores fijos por tipo de lanzamiento, repartidos en el círculo cromático
// para que se distingan claramente entre sí (morado y rosa quedaban demasiado
// cerca, así que el tercero es un dorado). Oscurecidos lo justo para que el
// texto blanco tenga siempre contraste WCAG AA (≥4.5:1).
export const TYPE_COLORS: Record<string, string> = { single: '#d93259', ep: '#0064d6', album: '#956c1c' };

// El género es texto libre (lo escribe quien propone la novedad), así que no
// tiene sentido derivar un color distinto por nombre — un único color fijo
// para todas las etiquetas de género, también oscurecido para texto blanco.
export const GENRE_COLOR = '#2a818d';
