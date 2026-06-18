'use client';

import * as React from 'react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { usersApi } from '@/features/hr/organization/lib/api/users';
import {
  getAuthAvatarFallback,
  getAuthDisplayName,
  getAuthSubtitle,
} from '@/features/auth/utils/auth-display';
import { getActiveRoleLabel, type AuthUser } from '@/features/auth/types/access-profile';
function mergeUserProfile(base: AuthUser, profile: AuthUser | null): AuthUser {
  if (!profile) return base;
  return {
    ...base,
    fullNameAr: base.fullNameAr ?? profile.fullNameAr,
    fullNameEn: base.fullNameEn ?? profile.fullNameEn,
    avatarUrl: base.avatarUrl ?? profile.avatarUrl,
    userType: base.userType ?? profile.userType,
    positionAr: base.positionAr ?? profile.positionAr,
  };
}

function hasDisplayName(user: AuthUser): boolean {
  return Boolean(user.fullNameAr?.trim() || user.fullNameEn?.trim());
}

export function useAuthUserDisplay() {
  const user = useAuthStore((s) => s.user);
  const accessProfile = useAuthStore((s) => s.accessProfile);
  const defaultCompanyId = useAuthStore((s) => s.accessProfile?.defaultCompanyId ?? s.activeCompanyId);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const [enriched, setEnriched] = React.useState<AuthUser | null>(null);
  React.useEffect(() => {
    if (!user?.id) {
      setEnriched(null);
      return;
    }
    if (hasDisplayName(user)) {
      setEnriched(null);
      return;
    }

    let cancelled = false;
    void usersApi
      .getById(user.id)
      .then((dto) => {
        if (cancelled) return;
        setEnriched({
          id: dto.id,
          email: dto.email,
          phone: dto.phone,
          fullNameAr: dto.fullNameAr,
          fullNameEn: dto.fullNameEn,
          avatarUrl: dto.avatarUrl,
          userType: dto.userType,
        });
      })
      .catch(() => {
        if (!cancelled) setEnriched(null);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.fullNameAr, user?.fullNameEn]);

  const resolved = user ? mergeUserProfile(user, enriched) : null;
  const roleLabel = getActiveRoleLabel(accessProfile, defaultCompanyId);
  const subtitle = getAuthSubtitle(resolved) ?? roleLabel;

  return {
    user: resolved,
    accessProfile,
    defaultCompanyId,
    activeBranchId,
    displayName: getAuthDisplayName(resolved),
    subtitle,
    roleLabel,
    avatarFallback: getAuthAvatarFallback(resolved),
    avatarUrl: resolved?.avatarUrl ?? null,
    email: resolved?.email ?? accessProfile?.email ?? null,
    phone: resolved?.phone ?? accessProfile?.phone ?? null,
  };
}