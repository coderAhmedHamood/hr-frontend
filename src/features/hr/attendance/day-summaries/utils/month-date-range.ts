/** First and last calendar day of a month as YYYY-MM-DD. `month` is 1–12. */
export function monthDateBounds(year: number, month: number): { from: string; to: string } {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return {
    from: `${year}-${mm}-01`,
    to: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function yearOptions(anchorYear?: number): number[] {
  const center = anchorYear ?? new Date().getFullYear();
  const years: number[] = [];
  for (let y = center - 5; y <= center + 2; y += 1) years.push(y);
  return years;
}
