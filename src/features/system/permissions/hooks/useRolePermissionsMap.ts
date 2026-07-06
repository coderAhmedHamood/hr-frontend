'use client';

import * as React from 'react';
import { useQueries } from '@tanstack/react-query';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { rolesApi } from '@/features/system/permissions/lib/api/roles';
import { PERMISSIONS_KEYS } from '@/features/system/permissions/hooks/query-keys';

/** Fetches granted permission ids per role via GET /roles/{id}/permissions. */
export function useRolePermissionsMap(roleIds: string[]) {
  const queries = useQueries({
    queries: roleIds.map((roleId) => ({
      queryKey: PERMISSIONS_KEYS.rolePermissions(roleId),
      queryFn: async () =>
        ensurePaginatedResult(await rolesApi.getPermissions(roleId)),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const grantedMap = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    roleIds.forEach((roleId, index) => {
      const items = queries[index]?.data?.items ?? [];
      map[roleId] = items.map((link) => link.permissionId);
    });
    return map;
  }, [roleIds, queries]);

  const isLoading = queries.some((q) => q.isLoading);

  return { grantedMap, isLoading };
}
