'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { QueryClientProvider } from '@tanstack/react-query';
import { CompanyThemeProvider } from '@/components/layouts/company-theme-provider';
import { DynamicFavicon } from '@/components/layouts/dynamic-favicon';
import { getAppQueryClient } from '@/components/layouts/query-client';
import { ThemeProvider } from '@/components/layouts/theme-provider';
import { NavigationHistoryTracker } from '@/shared/navigation/navigation-history-tracker';

function isStorefrontPath(pathname: string): boolean {
  return (
    pathname === '/store' ||
    pathname.startsWith('/store/') ||
    /^\/(ar|en)\/store(\/|$)/.test(pathname)
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStorefront = isStorefrontPath(pathname);
  // TanStack Next.js pattern: call during render (not useState) so the browser
  // singleton and QueryClientProvider always share the same client instance.
  const queryClient = getAppQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {!isStorefront ? <DynamicFavicon /> : null}
      <ThemeProvider>
        {isStorefront ? (
          children
        ) : (
          <CompanyThemeProvider>
            <NavigationHistoryTracker />
            {children}
          </CompanyThemeProvider>
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
