export function eventDateKey(iso: string): string {
  // Para eventos de día completo, "iso" ya es YYYY-MM-DD. Para eventos con
  // hora, se usa la fecha local del navegador que ve la página.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
