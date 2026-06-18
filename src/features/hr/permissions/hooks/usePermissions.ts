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

/** Fetches GET /permissions (no applicationId query param) and scopes to HR client-side. */
export function usePermissions(hrApplicationId?: string, queryEnabled = true) {
  const query = useQuery({
    queryKey: ['permissions', 'all-pages'],
    queryFn: loadAllPermissions,
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
    enabled: queryEnabled && hasAuthToken(),
  });

  const catalog = React.useMemo(
    () => scopeToHrApplication(query.data?.items ?? [], hrApplicationId || undefined),
    [query.data, hrApplicationId],
  );

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          items: catalog.items,
          applicationId: catalog.resolvedApplicationId,
        }
      : undefined,
  };
}
