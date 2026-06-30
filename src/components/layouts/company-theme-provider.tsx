'use client';

import * as React from 'react';
import { useCompanyThemeColors } from '@/features/auth/hooks/use-default-company-branding';
import { applyCompanyTheme } from '@/shared/company-theme';

/** Keeps `<html>` theme vars in sync after hydration (boot script applies them before paint). */
export function CompanyThemeProvider({ children }: { children: React.ReactNode }) {
  const { primaryColor, secondaryColor } = useCompanyThemeColors();

  React.useLayoutEffect(() => {
    applyCompanyTheme({ primary: primaryColor, secondary: secondaryColor });
  }, [primaryColor, secondaryColor]);

  return children;
}
