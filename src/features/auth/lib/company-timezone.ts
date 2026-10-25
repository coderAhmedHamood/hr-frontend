import { useAuthStore } from '@/features/auth/lib/auth-store';
import type { AccessProfile } from '@/features/auth/types/access-profile';
import { timezoneOffsetMinutes } from '@/shared/timezone-offset';

const DEFAULT_TIMEZONE = 'Asia/Riyadh';

function timezoneOf(profile: AccessProfile | null, companyId: string | null): string {
  const companies = profile?.companies ?? [];
  const company =
    companies.find((c) => c.companyId === companyId) ??
    companies.find((c) => c.companyId === profile?.defaultCompanyId) ??
    companies[0];
  return company?.companyTimezone?.trim() || DEFAULT_TIMEZONE;
}

export function companyTimezone(companyId?: string | null): string {
  const state = useAuthStore.getState();
  return timezoneOf(state.accessProfile, companyId ?? state.activeCompanyId);
}

export function companyTimezoneOffsetMinutes(companyId?: string | null): number {
  return timezoneOffsetMinutes(companyTimezone(companyId));
}

export function useCompanyTimezoneOffsetMinutes(): number {
  return useAuthStore((state) =>
    timezoneOffsetMinutes(timezoneOf(state.accessProfile, state.activeCompanyId)),
  );
}
