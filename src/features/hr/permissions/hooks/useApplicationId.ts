'use client';

import { useQuery } from '@tanstack/react-query';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { applicationsApi } from '@/features/hr/permissions/lib/api/applications';

export type UseApplicationIdResult = {
  applicationId: string;
  isLoading: boolean;
};

/**
 * Returns the id of the HR application from the backend.
 * Looks for the application whose code is 'hr' (case-insensitive).
 * Falls back to the first active application if none matches.
 */
export function useApplicationId(): UseApplicationIdResult {
  const { data, isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: async () =>
      ensurePaginatedResult(await applicationsApi.getAll({ limit: 50 })),
    staleTime: 60 * 60 * 1000,
  });

  const items = data?.items ?? [];
  const hr = items.find((a) => a.code.toLowerCase() === 'hr' && a.isActive)
    ?? items.find((a) => a.isActive)
    ?? items[0];

  return {
    applicationId: hr?.id ?? '',
    isLoading,
  };
}
