'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyThemeProvider } from '@/components/layouts/company-theme-provider';
import { DynamicFavicon } from '@/components/layouts/dynamic-favicon';
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

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

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
