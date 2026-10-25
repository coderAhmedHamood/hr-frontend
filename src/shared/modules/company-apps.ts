import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { findCompanyAccess, profileIsSystemOwner } from '@/features/auth/types/access-profile';

/**
 * Which applications the current company has enabled — the one source for
 * showing an app's parts inside another app (AGENTS.md §1).
 *
 * - The criterion is the company's enablement (`company_applications.is_enabled`
 *   and the app active), never the viewer: the System Owner sees what the
 *   company has, not the whole platform.
 * - An app enabled and hidden from the launcher still counts as enabled.
 * - Until the company's apps are known, nothing that requires an app shows
 *   (no flash of parts that then disappear).
 *
 * Usage, declared on the element itself:
 *   { value: 'orders', label: 'طلبات المتجر', requiresApp: APP.storeAdmin }
 *   { value: 'stock', label: 'توفر', requiresAnyApp: [APP.inventory, APP.storeAdmin] }
 *   const apps = useCompanyApps();
 *   const tabs = apps.filter(ALL_TABS);              // hide, don't disable
 *   useQuery({ ..., enabled: apps.isEnabled(APP.inventory) }); // don't fetch it either
 *
 * Bridges (store-stock-sync, pos-stock-sync) can only be enabled with both of
 * their sides (the backend enforces `dependsOn`), so `requiresApp: bridge` is
 * enough for parts about the link itself.
 */
export const APP = {
  hr: 'hr',
  catalog: 'catalog',
  contacts: 'contacts',
  inventory: 'inventory',
  storeAdmin: 'store-admin',
  storefront: 'storefront',
  storeStockSync: 'store-stock-sync',
  pos: 'pos',
  posStockSync: 'pos-stock-sync',
  shopSales: 'shop-sales',
  accounting: 'accounting',
  expenses: 'expenses',
} as const;

export type AppCode = (typeof APP)[keyof typeof APP];

/** What an element needs enabled to show. No requirement: always shown. */
export type AppRequirement = {
  requiresApp?: AppCode;
  requiresAnyApp?: readonly AppCode[];
  requiresAllApps?: readonly AppCode[];
};

export type CompanyApps = {
  /** False while the company's apps are not known yet. */
  ready: boolean;
  isEnabled: (code: AppCode) => boolean;
  meets: (requirement: AppRequirement | null | undefined) => boolean;
  /** Elements declare `requiresApp` / `requiresAnyApp` / `requiresAllApps` (none: always kept). */
  filter: <T extends object>(items: readonly T[]) => T[];
};

/** Older names some sessions still carry for the same apps. */
const LEGACY_CODES: Record<string, AppCode> = {
  ecommerce: APP.storeAdmin,
  storeadmin: APP.storeAdmin,
  partners: APP.contacts,
  'sale-deduct': APP.shopSales,
};

function normalize(code: string): string {
  const lower = code.trim().toLowerCase();
  return LEGACY_CODES[lower] ?? lower;
}

function hasRequirement(requirement: AppRequirement): boolean {
  return Boolean(
    requirement.requiresApp ||
      requirement.requiresAnyApp?.length ||
      requirement.requiresAllApps?.length,
  );
}

/** Pure form of `useCompanyApps` (tests, non-React code). `null`: not known yet. */
export function companyAppsFrom(codes: readonly string[] | null | undefined): CompanyApps {
  const ready = codes != null;
  const enabled = new Set((codes ?? []).map(normalize));
  const isEnabled = (code: AppCode) => enabled.has(code);
  const meets = (requirement: AppRequirement | null | undefined) => {
    if (!requirement || !hasRequirement(requirement)) return true;
    if (!ready) return false;
    if (requirement.requiresApp && !isEnabled(requirement.requiresApp)) return false;
    if (requirement.requiresAllApps?.some((code) => !isEnabled(code))) return false;
    if (requirement.requiresAnyApp?.length && !requirement.requiresAnyApp.some(isEnabled)) {
      return false;
    }
    return true;
  };
  return {
    ready,
    isEnabled: (code) => ready && isEnabled(code),
    meets,
    filter: (items) => items.filter((item) => meets(item as AppRequirement)),
  };
}

/** The current company's enabled apps (see the module comment). */
export function useCompanyApps(): CompanyApps {
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const userType = useAuthStore((s) => s.user?.userType);
  const company = findCompanyAccess(accessProfile, activeCompanyId);

  let codes: string[] | null = null;
  if (company?.companyApplicationCodes) {
    codes = company.companyApplicationCodes;
  } else if (company?.enabledApplicationCodes && !profileIsSystemOwner(accessProfile, userType)) {
    // A profile from before `companyApplicationCodes`: for a company member
    // the two lists are the same. The System Owner's list is the platform's,
    // so it waits for a fresh profile instead.
    codes = company.enabledApplicationCodes;
  }

  const key = codes ? [...codes].sort().join(',') : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures `codes`.
  return React.useMemo(() => companyAppsFrom(codes), [key]);
}
