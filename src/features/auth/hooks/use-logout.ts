'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ACCESS_PROFILE_KEY } from '@/features/auth/hooks/use-access-profile';
import { AUTH_ME_KEY } from '@/features/auth/hooks/use-auth-session';
import { authApi } from '@/features/auth/lib/api/auth';
import { clearAccessTokenCookie } from '@/features/auth/lib/auth-cookie';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { toast } from 'sonner';

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'auth.logout');
      toast.error(displayMessage);
    } finally {
      queryClient.removeQueries({ queryKey: ACCESS_PROFILE_KEY });
      queryClient.removeQueries({ queryKey: AUTH_ME_KEY });
      useAuthStore.getState().clear();
      clearAccessTokenCookie();
      setLoading(false);
      router.push('/login');
    }
  }, [queryClient, router]);

  return { logout, loading };
}
