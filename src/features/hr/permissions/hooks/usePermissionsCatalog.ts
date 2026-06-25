'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadPermissionsCatalog } from '@/features/hr/permissions/services/permissions.service';
import { scopeToHrApplication } from '@/features/hr/permissions/hooks/usePermissions';

function hasAuthToken(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('access_token='));
}

/** Catalog page — one GET /permissions call (limit 500), scoped to HR, no /applications. */
export function usePermissionsCatalog() {
  const query = useQuery({
    queryKey: ['permissions', 'catalog'],
    queryFn: loadPermissionsCatalog,
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
    enabled: hasAuthToken(),
  });

  const catalog = React.useMemo(
    () => scopeToHrApplication(query.data?.items ?? []),
    [query.data],
  );

  return {
    ...query,
    data: query.data
      ? {
          items: catalog.items,
          applicationId: catalog.resolvedApplicationId,
        }
      : undefined,
  };
}
