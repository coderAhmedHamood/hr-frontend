'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { usersApi } from '@/features/hr/organization/lib/api/users';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export function useSwitchDefaultCompany() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const setAccessProfile = useAuthStore((s) => s.setAccessProfile);
  const [switchingToId, setSwitchingToId] = React.useState<string | null>(null);

  const switchCompany = React.useCallback(async (companyId: string) => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    const currentId = useAuthStore.getState().accessProfile?.defaultCompanyId;
    if (currentId === companyId || switchingToId) return;

    setSwitchingToId(companyId);
    try {
      const profile = await usersApi.setDefaultCompany(userId, { companyId });
      setAccessProfile(profile);
      await queryClient.invalidateQueries();
      router.refresh();
      toast.success('تم تبديل الشركة بنجاح');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'auth.switch-company');
      toast.error(displayMessage);
    } finally {
      setSwitchingToId(null);
    }
  }, [queryClient, router, setAccessProfile, switchingToId, userId]);

  return {
    switchCompany,
    switching: switchingToId !== null,
    switchingToId,
  };
}
