/** Mirrors backend `resolveAttendanceRange` — defaults to current calendar month. */
export function resolveAttendanceDateRange(from?: string, to?: string): { from: string; to: string } {
  if (from && to) return { from, to };

  const now = new Date();
  const yearNum = now.getUTCFullYear();
  const monthNum = now.getUTCMonth();
  const firstDay = new Date(Date.UTC(yearNum, monthNum, 1));
  const lastDay = new Date(Date.UTC(yearNum, monthNum + 1, 0));
  const toIso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    from: from ?? toIso(firstDay),
    to: to ?? toIso(lastDay),
  };
}
