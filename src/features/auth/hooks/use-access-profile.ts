import { useQuery } from '@tanstack/react-query';
import { useAuthHydrated } from '@/features/auth/hooks/use-auth-hydrated';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { authApi } from '@/features/auth/lib/api/auth';
import type { AccessProfile } from '@/features/auth/types/access-profile';

export const ACCESS_PROFILE_KEY = ['auth', 'access-profile'] as const;

export function useAccessProfile() {
  const hydrated = useAuthHydrated();
  const user = useAuthStore((s) => s.user);
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const setAccessProfile = useAuthStore((s) => s.setAccessProfile);

  return useQuery({
    queryKey: ACCESS_PROFILE_KEY,
    queryFn: async () => {
      const profile = await authApi.getAccessProfile(user!.id);
      setAccessProfile(profile);
      return profile;
    },
    enabled: hydrated && !!user?.id && !accessProfile,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export type { AccessProfile };
