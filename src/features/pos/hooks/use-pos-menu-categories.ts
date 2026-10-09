'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPosMenuCategories } from '@/features/pos/lib/pos-menu-categories-api';

export function posMenuCategoriesKey(companyId: string) {
  return ['pos', 'menu-categories', companyId] as const;
}

export function usePosMenuCategories(companyId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: posMenuCategoriesKey(companyId ?? ''),
    queryFn: () => fetchPosMenuCategories(companyId!),
    enabled: Boolean(companyId) && enabled,
    staleTime: 30_000,
  });
}
