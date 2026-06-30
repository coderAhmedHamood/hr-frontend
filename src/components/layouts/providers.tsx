'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyThemeProvider } from '@/components/layouts/company-theme-provider';
import { ThemeProvider } from '@/components/layouts/theme-provider';

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
      <ThemeProvider>
        <CompanyThemeProvider>{children}</CompanyThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
