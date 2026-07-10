'use client';

import { useQuery } from '@tanstack/react-query';
import {
  applicationsApi,
  type ApplicationResponseDto,
} from '@/features/system/permissions/lib/api/applications';
import type { ApplicationWithPermissionItemsDto } from '@/features/system/permissions/lib/api/permission-response';
import { normalizeApplicationsList } from '@/features/system/permissions/lib/api/permission-response';
import { PERMISSIONS_KEYS } from '@/features/system/permissions/hooks/query-keys';

function hasAuthToken(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('access_token='));
}

function sortApplications(
  items: ApplicationWithPermissionItemsDto[],
): ApplicationWithPermissionItemsDto[] {
  return [...items].sort((a, b) => {
    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.nameAr.localeCompare(b.nameAr, 'ar');
  });
}

/** Active applications for role creation — ordered by sortOrder then name. */
export function useApplications(queryEnabled = true) {
  const query = useQuery({
    queryKey: PERMISSIONS_KEYS.applications,
    queryFn: async () =>
      sortApplications(normalizeApplicationsList(await applicationsApi.getAll({ limit: 50 }))),
    staleTime: 60 * 60 * 1000,
    enabled: queryEnabled && hasAuthToken(),
  });

  return {
    ...query,
    applications: query.data ?? [],
  };
}

/** First application by sortOrder — used as default when creating a role. */
export function resolveDefaultApplicationId(applications: ApplicationResponseDto[]): string {
  return applications[0]?.id ?? '';
}
