/**
 * A later homepage rail skips a product already shown above only when enough
 * other products exist to fill the rail (its limit, 10 by default). Otherwise
 * the product stays, so a short list is not emptied. «عرض الكل» is unchanged.
 */
export const HOMEPAGE_RAIL_MAX_PAGES = 4;

export function pickRailProducts<T extends { id: string }>(
  candidates: readonly T[],
  seen: ReadonlySet<string>,
  limit: number,
): T[] {
  const ordered: T[] = [];
  const orderedIds = new Set<string>();
  const fresh: T[] = [];
  for (const item of candidates) {
    if (orderedIds.has(item.id)) continue;
    orderedIds.add(item.id);
    ordered.push(item);
    if (!seen.has(item.id)) fresh.push(item);
  }
  if (fresh.length >= limit) return fresh.slice(0, limit);
  return ordered.slice(0, limit);
}
