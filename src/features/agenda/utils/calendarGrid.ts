type CalendarGridDay = {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
};

export function buildCalendarGrid(year: number, month: number, todayKey: string): CalendarGridDay[][] {
  const first = new Date(year, month - 1, 1);
  const startOffset = (first.getDay() + 6) % 7; // lunes = 0
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days: CalendarGridDay[] = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push({
      key,
      day: d.getDate(),
      inMonth: d.getMonth() === month - 1,
      isToday: key === todayKey,
    });
  }

  const result: CalendarGridDay[][] = [];
  for (let i = 0; i < 42; i += 7) result.push(days.slice(i, i + 7));
  return result;
}
