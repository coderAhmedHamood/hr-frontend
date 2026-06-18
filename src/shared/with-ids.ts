/**
 * Removes holes / invalid rows so `.map((x) => x.id)` never runs on `undefined`.
 * Typical after corrupted or cross-version `localStorage` + Zustand `persist`.
 */
export function withIds<T extends { id: string }>(rows: readonly T[] | null | undefined): T[] {
  if (rows == null || !Array.isArray(rows)) return [];
  return rows.filter((r): r is T => r != null && typeof r === 'object' && typeof r.id === 'string' && r.id.length > 0);
}
