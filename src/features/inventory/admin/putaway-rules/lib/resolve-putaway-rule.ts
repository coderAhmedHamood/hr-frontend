import type {
  PutawayMatchContext,
  PutawayRule,
} from '@/features/inventory/domain/types/putaway-rule';

function packagingMatches(rule: PutawayRule, packagingType?: string | null): boolean {
  if (!rule.packagingType) return true;
  if (!packagingType) return false;
  return rule.packagingType === packagingType;
}

function specificityScore(rule: PutawayRule): number {
  if (rule.appliesTo === 'product') return 300;
  if (rule.appliesTo === 'category') return 200;
  return 100;
}

/**
 * Picks the best putaway rule for a receipt context.
 * Priority: product > category > all, then packaging match, then lower sequence.
 */
export function resolvePutawayRule(
  rules: PutawayRule[],
  context: PutawayMatchContext,
): PutawayRule | null {
  const candidates = rules
    .filter((rule) => rule.isActive !== false)
    .filter((rule) => rule.warehouseId === context.warehouseId)
    .filter((rule) => rule.arriveLocationId === context.arriveLocationId)
    .filter((rule) => packagingMatches(rule, context.packagingType))
    .filter((rule) => {
      if (rule.appliesTo === 'product') {
        return Boolean(context.productId) && rule.productId === context.productId;
      }
      if (rule.appliesTo === 'category') {
        return Boolean(context.categoryId) && rule.categoryId === context.categoryId;
      }
      return true;
    });

  if (candidates.length === 0) return null;

  return [...candidates].sort((a, b) => {
    const bySpec = specificityScore(b) - specificityScore(a);
    if (bySpec !== 0) return bySpec;
    const aHasPack = a.packagingType ? 1 : 0;
    const bHasPack = b.packagingType ? 1 : 0;
    if (bHasPack !== aHasPack) return bHasPack - aHasPack;
    return (a.sequence ?? 10) - (b.sequence ?? 10);
  })[0]!;
}

/** Effective storage destination: sub-location if set, otherwise store location. */
export function resolvePutawayDestination(rule: PutawayRule): string {
  return rule.subLocationId || rule.storeLocationId;
}
