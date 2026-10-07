import { useAuthStore } from '@/features/auth/lib/auth-store';
import type { AccessProfile } from '@/features/auth/types/access-profile';

/** Until the access profile is loaded (the default country's currency). */
export const DEFAULT_COMPANY_CURRENCY = 'YER';

function currencyOf(profile: AccessProfile | null, companyId: string | null): string {
  const companies = profile?.companies ?? [];
  const company =
    companies.find((c) => c.companyId === companyId) ??
    companies.find((c) => c.companyId === profile?.defaultCompanyId) ??
    companies[0];
  return company?.companyCurrencyCode?.trim().toUpperCase() || DEFAULT_COMPANY_CURRENCY;
}

/**
 * The active company's base currency (العملة الأساسية), set in the company
 * settings. Every screen that shows or sends a currency uses it; outside
 * React (API mappers) read it with this function.
 */
export function companyCurrencyCode(companyId?: string | null): string {
  const state = useAuthStore.getState();
  return currencyOf(state.accessProfile, companyId ?? state.activeCompanyId);
}

/**
 * Whether the active company's currency is known (its access profile is
 * loaded): code that rewrites stored currencies runs only then, never on the
 * fallback.
 */
export function companyCurrencyKnown(): boolean {
  const { accessProfile, activeCompanyId } = useAuthStore.getState();
  const company = accessProfile?.companies?.find((c) => c.companyId === activeCompanyId);
  return Boolean(company?.companyCurrencyCode?.trim());
}

/** Same, re-rendering when the active company (or its profile) changes. */
export function useCompanyCurrency(): string {
  return useAuthStore((state) => currencyOf(state.accessProfile, state.activeCompanyId));
}
