'use client';

import * as React from 'react';
import { useLoginPageBranding } from '@/features/auth/hooks/use-default-company-branding';
import { APP_TITLE } from '@/shared/app-title';

/**
 * Browser tab title = the company's name from its settings (session, else the
 * last sign-in on this device). Only the app's default title is replaced, so
 * pages with a title of their own (privacy, careers, store) keep it — also
 * after Next.js rewrites the title on navigation.
 */
export function CompanyDocumentTitle() {
  const { companyNameAr } = useLoginPageBranding();

  React.useEffect(() => {
    const name = companyNameAr?.trim();
    if (!name) return;
    const apply = () => {
      if (document.title === APP_TITLE) document.title = name;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (document.title === name) document.title = APP_TITLE;
    };
  }, [companyNameAr]);

  return null;
}
