'use client';

import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  getAuthAvatarFallback,
  getAuthDisplayName,
  getAuthSubtitle,
} from '@/features/auth/utils/auth-display';
import { getActiveRoleLabel } from '@/features/auth/types/access-profile';

/** Topbar user chip — uses persisted login session only (no GET /users/{id}). */
export function useAuthUserDisplay() {
  const user = useAuthStore((s) => s.user);
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const defaultCompanyId = useAuthStore((s) => s.accessProfile?.defaultCompanyId ?? s.activeCompanyId);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);

  const roleLabel = getActiveRoleLabel(accessProfile, defaultCompanyId);
  const subtitle = getAuthSubtitle(user) ?? roleLabel;

  return {
    user,
    accessProfile,
    defaultCompanyId,
    activeBranchId,
    displayName: getAuthDisplayName(user),
    subtitle,
    roleLabel,
    avatarFallback: getAuthAvatarFallback(user),
    avatarUrl: user?.avatarUrl ?? null,
    email: user?.email ?? accessProfile?.email ?? null,
    phone: user?.phone ?? accessProfile?.phone ?? null,
  };
}
