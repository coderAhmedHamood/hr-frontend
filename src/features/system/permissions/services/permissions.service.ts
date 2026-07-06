import { ensurePaginatedResult, type PaginatedResult } from '@/features/hr/lib/api/client';
import {
  permissionsApi,
  type PermissionResponseDto,
} from '@/features/system/permissions/lib/api/permissions';

const PAGE_SIZE = 500;

/** Loads every page from GET /permissions — backend paginates the catalog. */
export async function loadAllPermissions(): Promise<PaginatedResult<PermissionResponseDto>> {
  const first = ensurePaginatedResult(
    await permissionsApi.getAll({ page: 1, limit: PAGE_SIZE }),
  );

  const totalPages = Math.max(first.pagination?.totalPages ?? 1, 1);
  if (totalPages <= 1) {
    return first;
  }

  const pageNumbers = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
  const rest = await Promise.all(
    pageNumbers.map(async (page) =>
      ensurePaginatedResult(await permissionsApi.getAll({ page, limit: PAGE_SIZE })),
    ),
  );

  const items = [...first.items, ...rest.flatMap((page) => page.items)];

  return {
    items,
    pagination: {
      page: 1,
      limit: items.length,
      total: first.pagination?.total ?? items.length,
      totalPages: 1,
    },
  };
}

/** Single-request catalog load (all applications). */
export async function loadPermissionsCatalog(): Promise<PaginatedResult<PermissionResponseDto>> {
  return loadAllPermissions();
}
