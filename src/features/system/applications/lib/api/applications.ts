import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { resolveSystemAppLaunchPath } from '@/features/system/constants/app-launch';
import { isModuleEnabledFor, MODULE_REGISTRY } from '@/shared/modules/registry';

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
 * Supplements backend launcher tiles with frontend-registered installable modules
 * (e.g. ecommerce) until the applications catalog seeds them.
 */
export function enrichLauncherApplications(
  apps: ApplicationResponseDto[],
  companyId: string | null | undefined,
): ApplicationResponseDto[] {
  const codes = new Set(apps.map((app) => app.code.trim().toLowerCase()));
  const next = [...apps];

  if (!codes.has('ecommerce') && isModuleEnabledFor('ecommerce', companyId)) {
    const maxSort = next.reduce((max, app) => Math.max(max, app.sortOrder), 0);
    next.push({
      id: 'module-ecommerce',
      code: 'ecommerce',
      nameAr: MODULE_REGISTRY.ecommerce.labelAr,
      nameEn: 'Online Store',
      description: null,
      icon: 'shopping-cart',
      routePath: ecommerceAdminRoutes.overview,
      sortOrder: maxSort + 10,
      isActive: true,
      status: 'active',
    });
  }

  if (!codes.has('inventory') && isModuleEnabledFor('inventory', companyId)) {
    const maxSort = next.reduce((max, app) => Math.max(max, app.sortOrder), 0);
    next.push({
      id: 'module-inventory',
      code: 'inventory',
      nameAr: MODULE_REGISTRY.inventory.labelAr,
      nameEn: 'Inventory',
      description: null,
      icon: 'package',
      routePath: inventoryAdminRoutes.overview,
      sortOrder: maxSort + 10,
      isActive: true,
      status: 'active',
    });
  }

  return next.sort((a, b) => a.sortOrder - b.sortOrder);
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
