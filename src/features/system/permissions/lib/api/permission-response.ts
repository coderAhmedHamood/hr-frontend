import type { PaginatedResult, PaginationMeta } from '@/features/hr/lib/api/client';
import type { ApplicationResponseDto } from '@/features/system/permissions/lib/api/applications';
import type { PermissionResponseDto } from '@/features/system/permissions/lib/api/permissions';

export type ApplicationWithPermissionItemsDto = ApplicationResponseDto & {
  items?: PermissionResponseDto[];
};

type ApplicationsEnvelope = {
  applications?: ApplicationWithPermissionItemsDto[];
  items?: ApplicationWithPermissionItemsDto[];
  pagination?: PaginationMeta;
};

type PermissionsEnvelope = {
  applications?: ApplicationWithPermissionItemsDto[];
  items?: PermissionResponseDto[];
  pagination?: PaginationMeta;
};

function isActiveApplication(app: ApplicationWithPermissionItemsDto): boolean {
  return app.isActive !== false && app.status !== 'inactive';
}

/** GET /applications — supports `{ items }` or `{ applications }`. */
export function normalizeApplicationsList(data: unknown): ApplicationWithPermissionItemsDto[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as ApplicationsEnvelope;
  if (Array.isArray(record.applications)) return record.applications.filter(isActiveApplication);
  if (Array.isArray(record.items)) return record.items.filter(isActiveApplication);
  return [];
}

/**
 * GET /permissions — supports flat `{ items }` or grouped `{ applications: [{ items }] }`.
 * When applicationId is set, returns only that application's permission nodes.
 */
export function normalizePermissionsList(
  data: unknown,
  applicationId?: string,
): PermissionResponseDto[] {
  if (!data || typeof data !== 'object') return [];
  const record = data as PermissionsEnvelope;

  if (Array.isArray(record.applications)) {
    const apps = applicationId
      ? record.applications.filter((app) => app.id === applicationId)
      : record.applications;
    return apps.flatMap((app) => app.items ?? []);
  }

  if (Array.isArray(record.items)) {
    return applicationId
      ? record.items.filter((item) => item.applicationId === applicationId)
      : record.items;
  }

  return [];
}

export function normalizePermissionsPagination(
  data: unknown,
  itemCount: number,
): PaginationMeta {
  if (data && typeof data === 'object') {
    const pagination = (data as PermissionsEnvelope).pagination;
    if (pagination) return pagination;
  }
  return {
    page: 1,
    limit: itemCount,
    total: itemCount,
    totalPages: 1,
  };
}

export function toPaginatedPermissions(
  data: unknown,
  applicationId?: string,
): PaginatedResult<PermissionResponseDto> {
  const items = normalizePermissionsList(data, applicationId);
  return {
    items,
    pagination: normalizePermissionsPagination(data, items.length),
  };
}

export function permissionsByApplicationFromCatalog(
  applications: ApplicationWithPermissionItemsDto[],
  applicationId: string,
): PermissionResponseDto[] {
  const app = applications.find((entry) => entry.id === applicationId);
  return app?.items ?? [];
}
