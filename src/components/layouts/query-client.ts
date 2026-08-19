'use client';

import { QueryClient } from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Shared app QueryClient — same instance for Providers and logout cache clears. */
export function getAppQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always a fresh client per request (no shared cache across users).
    return makeQueryClient();
  }
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
