// Las reviews usan el bloque de Gutenberg "Let's Review", que no expone la
// nota final como campo propio de WPGraphQL — hay que extraerla del HTML
// embebido en post.content. El marcado es consistente en todas las reviews:
// <div class="score__wrap ..." style="..."><div class="score">8.8</div></div>
export function extractReviewScore(content: string): number | null {
  const match = content.match(/class="score__wrap[^"]*"[^>]*><div class="score">([\d.]+)<\/div>/);
  return match ? parseFloat(match[1]) : null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// El último trozo de la lista de nombres viene unido por " y " en vez de
// coma ("Converge y Art|est") o, con coma de Oxford, como su propio trozo
// ("y Dagger Threat") — de ahí los dos casos por separado.
function splitTrailingY(text: string): string[] {
  const leading = text.match(/^y\s+(.+)$/i);
  if (leading) return [leading[1].trim()];

  const mid = text.match(/^(.+?)\s+y\s+(.+)$/i);
  if (mid) return [mid[1].trim(), mid[2].trim()];

  return [text];
}

// Los posts de "Mejores discos del mes" abren siempre con un párrafo tipo
// "Os hablaremos de los nuevos trabajos de A, B y C." — en vez de repetir
// esa prosa en la home, extraemos solo los nombres de banda para listarlos
// aparte.
export function extractHighlightedBands(content: string): string[] {
  const firstParagraph = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  if (!firstParagraph) return [];

  const plain = decodeHtmlEntities(firstParagraph.replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();

  const namesText = plain.match(/trabajos de\s+(.+?)\./i)?.[1];
  if (!namesText) return [];

  const parts = namesText.split(',').map(s => s.trim()).filter(Boolean);
  const last = parts.pop();
  if (last) parts.push(...splitTrailingY(last));

  return parts;
}
