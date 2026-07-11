'use client';

import { useLayoutEffect, useMemo } from 'react';
import {
  useDefaultCompanyBranding,
  useLoginPageBranding,
} from '@/features/auth/hooks/use-default-company-branding';
import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { DEFAULT_APP_LOGO_PATH } from '@/shared/constants/branding';
import { setDocumentFavicon } from '@/shared/set-document-favicon';

/** Keeps the document favicon in sync with the company logo shown in the top navigation. */
export function DynamicFavicon() {
  const authHydrated = useAuthHydrated();
  const hasSession = useAuthStore((s) => !!s.accessProfile);
  const sessionBranding = useDefaultCompanyBranding();
  const loginBranding = useLoginPageBranding();

  const href = useMemo(() => {
    if (hasSession) {
      return sessionBranding.logoUrl ?? DEFAULT_APP_LOGO_PATH;
    }
    return loginBranding.logoUrl ?? DEFAULT_APP_LOGO_PATH;
  }, [hasSession, sessionBranding.logoUrl, loginBranding.logoUrl]);

  useLayoutEffect(() => {
    if (!authHydrated) return;
    setDocumentFavicon(href);
  }, [authHydrated, href]);

  return null;
}
