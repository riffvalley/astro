// Calcula si el texto encima de un color de fondo arbitrario (nombre CSS,
// hex…) debe ser blanco o negro, comparando el contraste WCAG real contra
// ambos — un único umbral de luminancia falla con grises medios (p.ej.
// "DarkGray" pasaba el corte pero seguía leyéndose mal en blanco).
const cache = new Map<string, string>();

export function readableTextColor(cssColor: string): string {
  if (cache.has(cssColor)) return cache.get(cssColor)!;
  // Puede evaluarse durante el render a servidor de la isla Vue, donde no
  // existe `document` — en ese punto la lista siempre está vacía (los datos
  // se cargan en el cliente), así que esto no debería llegar a ejecutarse,
  // pero se protege igualmente.
  if (typeof document === 'undefined') return '#ffffff';

  const probe = document.createElement('span');
  probe.style.display = 'none';
  probe.style.color = cssColor;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);

  const match = resolved.match(/[\d.]+/g);
  let result = '#ffffff';
  if (match) {
    const [r, g, b] = match.map(Number);
    const toLinear = (c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    const contrastWithWhite = (1 + 0.05) / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / (0 + 0.05);
    result = contrastWithBlack > contrastWithWhite ? '#161616' : '#ffffff';
  }

  cache.set(cssColor, result);
  return result;
}
