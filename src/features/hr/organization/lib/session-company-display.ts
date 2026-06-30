import { useAuthStore } from '@/features/auth/lib/auth-store';

/** Company name fields already available in persisted auth session — no GET /companies needed. */
export function getSessionCompanyDisplay(companyId: string | null | undefined): {
  nameAr: string;
  nameEn: string | null;
} {
  if (!companyId) return { nameAr: '', nameEn: null };

  const company = useAuthStore.getState().accessProfile?.companies.find(
    (c) => c.companyId === companyId,
  );

  return {
    nameAr: company?.companyNameAr?.trim() ?? '',
    nameEn: company?.companyNameEn?.trim() ?? null,
  };
}
