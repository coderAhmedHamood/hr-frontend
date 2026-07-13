'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyThemeProvider } from '@/components/layouts/company-theme-provider';
import { DynamicFavicon } from '@/components/layouts/dynamic-favicon';
import { ThemeProvider } from '@/components/layouts/theme-provider';
import { NavigationHistoryTracker } from '@/shared/navigation/navigation-history-tracker';

export function Providers({ children }: { children: React.ReactNode }) {

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
      <DynamicFavicon />
      <ThemeProvider>
        <CompanyThemeProvider>
          <NavigationHistoryTracker />
          {children}
        </CompanyThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
