import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { resolveSystemAppLaunchPath } from '@/features/system/constants/app-launch';

export type ApplicationResponseDto = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  icon: string | null;
  routePath: string | null;
  sortOrder: number;
  isActive: boolean;
  status: string;
};

export const applicationsApi = {
  getLauncher() {
    return apiRequest<ApplicationResponseDto[]>('/applications/launcher');
  },

  getAll(query?: { limit?: number }) {
    return apiRequest<PaginatedResult<ApplicationResponseDto>>('/applications', { query });
  },
};

/**
 * Launcher tiles come only from `GET /applications/launcher`.
 * Do not invent ecommerce/inventory tiles on the client — those apps appear when the backend seeds them.
 */
export function enrichLauncherApplications(
  apps: ApplicationResponseDto[],
  _companyId?: string | null,
): ApplicationResponseDto[] {
  return [...apps].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Where the app tile navigates — HR lands on employees list. */
export function resolveApplicationLaunchPath(app: ApplicationResponseDto): string {
  const base = app.routePath?.trim();
  if (app.code === 'hr') return '/hr/organization/employees';
  if (app.code === 'ecommerce') return ecommerceAdminRoutes.overview;
  if (app.code === 'inventory') return inventoryAdminRoutes.overview;
  if (app.code === 'accounting') return '/accounting';
  if (app.code === 'system' && (!base || base === '/system')) {
    return resolveSystemAppLaunchPath();
  }
  return base || '/';
}
