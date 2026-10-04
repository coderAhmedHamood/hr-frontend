'use client';

import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor, type ModuleEnablementContext } from '@/shared/modules/registry';

/**
 * Which apps' sections the product screens show (phase 2.5). The product
 * itself is the catalog's; stock fields (warehouse, cost, tracking, quantity,
 * batches, stock moves) are inventory's and listing fields (compare-at price,
 * promos, stockStatus, reviews) are the store's. A section shows only when
 * its app is enabled for the active company — its API refuses otherwise.
 */
export type ProductAppSections = { inventory: boolean; store: boolean };

export function productAppSectionsFor(
  companyId: string | null | undefined,
  context: ModuleEnablementContext,
): ProductAppSections {
  return {
    inventory: isModuleEnabledFor('inventory', companyId, context),
    store: isModuleEnabledFor('ecommerce', companyId, context),
  };
}

export function useProductAppSections(): ProductAppSections {
  const { companyId, ...context } = useModuleEnablementContext();
  return productAppSectionsFor(companyId, context);
}

/** Product form tabs owned by one app (other tabs are the catalog's). */
const TAB_APP: Record<string, keyof ProductAppSections> = {
  batches: 'inventory',
  reviews: 'store',
};

export function visibleProductTabs<T extends { value: string }>(
  tabs: readonly T[],
  sections: ProductAppSections,
): T[] {
  return tabs.filter((tab) => {
    if (tab.value === 'availability') return sections.inventory || sections.store;
    const app = TAB_APP[tab.value];
    return app ? sections[app] : true;
  });
}

/** Related-document shortcuts that open inventory screens. */
const INVENTORY_DOCS = new Set(['replenish', 'receipts', 'issues', 'internals', 'moves', 'putaway']);

export function visibleRelatedDocs<T extends { key: string }>(
  docs: readonly T[],
  sections: ProductAppSections,
): T[] {
  return docs.filter((doc) => sections.inventory || !INVENTORY_DOCS.has(doc.key));
}
