'use client';

import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';

export const DEFAULT_COMPANY_ID_STORAGE_KEY = 'rose-hr-default-company-id';

export function persistDefaultCompanyId(companyId: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (companyId) {
    localStorage.setItem(DEFAULT_COMPANY_ID_STORAGE_KEY, companyId);
  } else {
    localStorage.removeItem(DEFAULT_COMPANY_ID_STORAGE_KEY);
  }
}

export function getDefaultCompanyId(): string | null {
  const store = useAuthStore.getState();
  const fromProfile = store.accessProfile?.defaultCompanyId ?? null;
  if (fromProfile) return fromProfile;

  if (typeof window !== 'undefined') {
    const fromStorage = localStorage.getItem(DEFAULT_COMPANY_ID_STORAGE_KEY);
    if (fromStorage) return fromStorage;
  }

  return store.activeCompanyId;
}

export function clearDefaultCompanyId(): void {
  persistDefaultCompanyId(null);
}

/** Default company from login accessProfile — used for org CRUD scoping. */
export function useDefaultCompanyId(): string | null {
  const profileCompanyId = useAuthStore((s) => s.accessProfile?.defaultCompanyId);
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);

  return React.useMemo(() => {
    if (profileCompanyId) return profileCompanyId;
    if (typeof window !== 'undefined') {
      const fromStorage = localStorage.getItem(DEFAULT_COMPANY_ID_STORAGE_KEY);
      if (fromStorage) return fromStorage;
    }
    return activeCompanyId;
  }, [profileCompanyId, activeCompanyId]);
}
