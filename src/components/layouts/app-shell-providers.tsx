'use client';

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { getAppQueryClient } from '@/components/layouts/query-client';

/** Ensures admin shell always has a QueryClient (same browser singleton as root Providers). */
export function AppShellProviders({ children }: { children: ReactNode }) {
  const queryClient = getAppQueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
