'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';
import { loadAllPermissions } from '@/features/hr/permissions/services/permissions.service';

function hasAuthToken(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('access_token='));
}

/** Resolves HR application id from catalog root (`hr.module`) or first hr.* node. */
export function resolveHrApplicationId(
  all: PermissionResponseDto[],
  applicationIdHint?: string,
): string {
  return (
    all.find((p) => p.code.toLowerCase() === 'hr.module')?.applicationId ??
    all.find((p) => p.code.toLowerCase().startsWith('hr.'))?.applicationId ??
    applicationIdHint ??
    ''
  );
}

/** Arabic label for an application id (from its module root node). */
export function resolveApplicationLabel(
  all: PermissionResponseDto[],
  applicationId: string,
): string {
  if (!applicationId) return '';
  const root = all.find((p) => p.parentId === null && p.applicationId === applicationId);
  return root?.nameAr?.trim() || root?.nameEn?.trim() || applicationId.slice(0, 8);
}

/** Keeps permission nodes belonging to one application (GROUP + ACTION). */
export function scopePermissionsToApplication(
  all: PermissionResponseDto[],
  applicationId: string,
): PermissionResponseDto[] {
  if (!applicationId) return all;
  return all.filter((p) => p.applicationId === applicationId);
}

/** Splits selected ids into assignable vs blocked for a role's application. */
export function filterPermissionIdsForApplication(
  permissionIds: string[],
  all: PermissionResponseDto[],
  applicationId: string,
): { allowed: string[]; rejected: PermissionResponseDto[] } {
  if (!applicationId) {
    return { allowed: permissionIds, rejected: [] };
  }
  const byId = new Map(all.map((p) => [p.id, p]));
  const allowed: string[] = [];
  const rejected: PermissionResponseDto[] = [];
  for (const id of permissionIds) {
    const perm = byId.get(id);
    if (perm && perm.applicationId === applicationId) allowed.push(id);
    else if (perm) rejected.push(perm);
  }
  return { allowed, rejected };
}

/** Keeps all permission nodes for the HR application (GROUP + ACTION). */
export function scopeToHrApplication(all: PermissionResponseDto[], applicationIdHint?: string) {
  const resolvedApplicationId = resolveHrApplicationId(all, applicationIdHint);

  let items: PermissionResponseDto[];
  if (resolvedApplicationId) {
    items = all.filter((p) => p.applicationId === resolvedApplicationId);
  } else {
    items = all.filter((p) => p.code.toLowerCase().startsWith('hr.'));
    if (items.length === 0 && all.length > 0) items = all;
  }

  return { items, resolvedApplicationId };
}

/** Fetches GET /permissions — returns the full catalog (all applications). */
export function usePermissions(hrApplicationId?: string, queryEnabled = true) {
  const query = useQuery({
    queryKey: ['permissions', 'all-pages'],
    queryFn: loadAllPermissions,
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
    enabled: queryEnabled && hasAuthToken(),
  });

  const items = query.data?.items ?? [];
  const resolvedHrApplicationId = React.useMemo(
    () => resolveHrApplicationId(items, hrApplicationId || undefined),
    [items, hrApplicationId],
  );

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          items,
          applicationId: resolvedHrApplicationId,
        }
      : undefined,
  };
}
