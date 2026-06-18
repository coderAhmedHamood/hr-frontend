import { ensurePaginatedResult, type PaginatedResult } from '@/features/hr/lib/api/client';
import {
  permissionsApi,
  type PermissionResponseDto,
} from '@/features/hr/permissions/lib/api/permissions';

const PAGE_SIZE = 200;

/** Loads every page from GET /permissions — backend paginates the catalog. */
export async function loadAllPermissions(): Promise<PaginatedResult<PermissionResponseDto>> {
  const first = ensurePaginatedResult(
    await permissionsApi.getAll({ page: 1, limit: PAGE_SIZE }),
  );

  const items = [...first.items];
  const totalPages = Math.max(first.pagination?.totalPages ?? 1, 1);

  for (let page = 2; page <= totalPages; page++) {
    const next = ensurePaginatedResult(
      await permissionsApi.getAll({ page, limit: PAGE_SIZE }),
    );
    items.push(...next.items);
  }

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
