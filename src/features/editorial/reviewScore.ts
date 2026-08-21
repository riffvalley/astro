export function scoreColor(score: number): string {
  if (score >= 8) return '#3fae6a';
  if (score >= 6) return '#d9a233';
  return '#d93259';
}

export function formatScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}
