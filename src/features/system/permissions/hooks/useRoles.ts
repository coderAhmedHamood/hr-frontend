'use client';

import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '@/features/system/permissions/lib/api/roles';
import { PERMISSIONS_KEYS } from '@/features/system/permissions/hooks/query-keys';

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: PERMISSIONS_KEYS.roles,
    queryFn: () => rolesApi.getAll({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
