'use client';

import { useQuery } from '@tanstack/react-query';
import { hasAccessTokenCookie } from '@/features/auth/lib/auth-cookie';
import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { authApi } from '@/features/auth/lib/api/auth';
import type { AuthUser } from '@/features/auth/types/access-profile';

export const AUTH_ME_KEY = ['auth', 'me'] as const;

function userNeedsProfileRefresh(user: AuthUser | null): boolean {
  if (!user) return false;
  return !user.fullNameAr?.trim() && !user.fullNameEn?.trim();
}

export function useAuthSession() {
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const setUser = useAuthStore((s) => s.setUser);

  const needsBootstrap = !user && !accessProfile;
  const needsProfileRefresh = userNeedsProfileRefresh(user);

  const { isLoading, isError } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: async () => {
      const me = await authApi.me();
      setUser(me);
      return me;
    },
    // Wait for sessionStorage rehydrate — avoid /auth/me when login session is already restored.
    enabled: hydrated && hasAccessTokenCookie() && (needsBootstrap || needsProfileRefresh),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    isLoading: hydrated && needsBootstrap && isLoading,
    isError: hydrated && needsBootstrap && isError,
    data: user ?? null,
  };
}
