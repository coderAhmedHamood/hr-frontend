'use client';

import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '@/features/hr/permissions/lib/api/roles';

export function useRoles(enabled = true) {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
