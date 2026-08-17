'use client';

import type { ReactNode } from 'react';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { useIsSystemOwner } from '@/features/auth/hooks/use-system-owner';

export function SystemOwnerGuard({ children }: { children: ReactNode }) {
  const allowed = useIsSystemOwner();
  if (!allowed) {
    return (
      <ForbiddenState
        title="لوحة System Owner"
        description="هذه الشاشات متاحة لحساب platform_admin فقط."
      />
    );
  }
  return <>{children}</>;
}
