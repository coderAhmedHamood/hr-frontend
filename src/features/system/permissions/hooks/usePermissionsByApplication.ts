'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { PermissionResponseDto } from '@/features/system/permissions/lib/api/permissions';
import { permissionsByApplicationFromCatalog } from '@/features/system/permissions/lib/api/permission-response';
import { loadPermissionsByApplication } from '@/features/system/permissions/services/permissions.service';
import { PERMISSIONS_KEYS } from '@/features/system/permissions/hooks/query-keys';
import type { ApplicationWithPermissionItemsDto } from '@/features/system/permissions/lib/api/permission-response';

function hasAuthToken(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c.startsWith('access_token='));
}

type Options = {
  /** When GET /applications already returned nested permission items, skip the extra fetch. */
  catalogApplications?: ApplicationWithPermissionItemsDto[];
};

/**
 * Resolves permission nodes for one application.
 * Uses embedded `items` from the applications catalog when present,
 * otherwise GET /permissions?applicationId=…
 */
export function usePermissionsByApplication(
  applicationId: string | null,
  queryEnabled = true,
  options?: Options,
) {
  const catalogApplications = options?.catalogApplications ?? [];
  const embeddedItems = React.useMemo(
    () => (applicationId ? permissionsByApplicationFromCatalog(catalogApplications, applicationId) : []),
    [applicationId, catalogApplications],
  );
  const hasEmbeddedCatalog = embeddedItems.length > 0;

  const query = useQuery({
    queryKey: PERMISSIONS_KEYS.byApplication(applicationId),
    queryFn: () => loadPermissionsByApplication(applicationId!),
    staleTime: 60 * 1000,
    refetchOnMount: 'always',
    enabled: queryEnabled && !!applicationId && hasAuthToken() && !hasEmbeddedCatalog,
  });

  const items: PermissionResponseDto[] = hasEmbeddedCatalog
    ? embeddedItems
    : (query.data?.items ?? []);

  return {
    ...query,
    data: applicationId ? { items, pagination: query.data?.pagination } : undefined,
    items,
    isLoading: hasEmbeddedCatalog ? false : query.isLoading,
    isError: hasEmbeddedCatalog ? false : query.isError,
  };
}
