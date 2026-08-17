import type { PaginatedResult } from '@/features/hr/lib/api/client';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import {
  normalizeApplicationsList,
  normalizePermissionsList,
  normalizePermissionsPagination,
  toPaginatedPermissions,
} from '@/features/system/permissions/lib/api/permission-response';
import {
  permissionsApi,
  type PermissionResponseDto,
} from '@/features/system/permissions/lib/api/permissions';

const PAGE_SIZE = 200;

function resolvePermissionsCompanyId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const { accessProfile, activeCompanyId } = useAuthStore.getState();
  return activeCompanyId || accessProfile?.defaultCompanyId || undefined;
}

async function fetchPermissionPage(page: number, applicationId?: string, companyId?: string) {
  const scopedCompanyId = companyId || resolvePermissionsCompanyId();
  return permissionsApi.getAll({
    page,
    limit: PAGE_SIZE,
    applicationId,
    ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}),
  });
}

async function loadAllPermissionPages(companyId?: string): Promise<PaginatedResult<PermissionResponseDto>> {
  const firstRaw = await fetchPermissionPage(1, undefined, companyId);
  const firstItems = normalizePermissionsList(firstRaw);
  const pagination = normalizePermissionsPagination(firstRaw, firstItems.length);
  const totalPages = Math.max(pagination.totalPages, 1);

  if (totalPages <= 1) {
    return { items: firstItems, pagination: { ...pagination, total: firstItems.length } };
  }

  const pageNumbers = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
  const rest = await Promise.all(pageNumbers.map((page) => fetchPermissionPage(page, undefined, companyId)));
  const items = [...firstItems, ...rest.flatMap((raw) => normalizePermissionsList(raw))];

  return {
    items,
    pagination: {
      page: 1,
      limit: items.length,
      total: pagination.total || items.length,
      totalPages: 1,
    },
  };
}

/** Loads every page from GET /permissions — backend paginates the catalog. */
export async function loadAllPermissions(): Promise<PaginatedResult<PermissionResponseDto>> {
  return loadAllPermissionPages();
}

/** Catalog scoped to a company's enabled applications (`GET /permissions?companyId=`). */
export async function loadAllPermissionsForCompany(
  companyId: string,
): Promise<PaginatedResult<PermissionResponseDto>> {
  return loadAllPermissionPages(companyId);
}

/** Single-request catalog load (all applications). */
export async function loadPermissionsCatalog(): Promise<PaginatedResult<PermissionResponseDto>> {
  return loadAllPermissions();
}

/** Loads GET /permissions?applicationId=… — grouped or flat API shapes. */
export async function loadPermissionsByApplication(
  applicationId: string,
): Promise<PaginatedResult<PermissionResponseDto>> {
  const firstRaw = await fetchPermissionPage(1, applicationId);
  const first = toPaginatedPermissions(firstRaw, applicationId);
  const totalPages = Math.max(first.pagination.totalPages, 1);

  if (totalPages <= 1) {
    return first;
  }

  const pageNumbers = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
  const rest = await Promise.all(
    pageNumbers.map(async (page) => {
      const raw = await fetchPermissionPage(page, applicationId);
      return normalizePermissionsList(raw, applicationId);
    }),
  );

  const items = [...first.items, ...rest.flat()];

  return {
    items,
    pagination: {
      page: 1,
      limit: items.length,
      total: first.pagination.total || items.length,
      totalPages: 1,
    },
  };
}

export { normalizeApplicationsList };
