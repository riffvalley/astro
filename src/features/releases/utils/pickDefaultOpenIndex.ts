import type { DiscDateGroup } from '../../../lib/discs';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// En la carga inicial se abre el grupo de hoy (o el más cercano a hoy si hoy
// no tiene lanzamientos). Un cambio de mes o de filtros posterior deja todo
// comprimido. Extraída tal cual de GuiaLanzamientosIsland.vue (misma lógica,
// mismo comportamiento) para poder testearla: lo que antes leía de refs
// (`viewYear.value`, `viewMonth.value`, `today` module-level) ahora se recibe
// como parámetros explícitos.
export function pickDefaultOpenIndex(
  groupList: DiscDateGroup[],
  isInitial: boolean,
  viewYear: number,
  viewMonth: number,
  today: Date
): number {
  if (!isInitial) return -1;
  if (viewYear === today.getFullYear() && viewMonth === today.getMonth()) {
    const todayIso = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const todayTime = new Date(`${todayIso}T00:00:00`).getTime();
    let closestIdx = 0;
    let closestDiff = Infinity;
    groupList.forEach((g, i) => {
      const diff = Math.abs(new Date(`${g.releaseDate}T00:00:00`).getTime() - todayTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIdx = i;
      }
    });
    return closestIdx;
  }
  return 0;
}
