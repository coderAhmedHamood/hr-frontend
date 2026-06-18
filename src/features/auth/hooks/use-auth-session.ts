'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { authApi } from '@/features/auth/lib/api/auth';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

function hasCookie(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('access_token='));
}

export function useAuthSession() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const { isLoading, isError } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: async () => {
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    // Skip the network call if the store is already populated
    enabled: !user && hasCookie(),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    isLoading: !user && isLoading,
    isError: !user && isError,
    data: user ?? null,
  };
}
