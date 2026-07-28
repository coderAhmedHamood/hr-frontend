import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';
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

function normalizeAppCode(code: string | null | undefined): string {
  return (code ?? '').trim().toLowerCase();
}

function isPartnersContactsCode(code: string): boolean {
  return code === 'contacts' || code === 'partners';
}

/** True for the standalone Partners Master Data app (never System users). */
function looksLikePartnersContactsApp(app: ApplicationResponseDto): boolean {
  const code = normalizeAppCode(app.code);
  if (isPartnersContactsCode(code)) return true;
  const name = `${app.nameAr ?? ''} ${app.nameEn ?? ''}`.trim();
  return /جهات الاتصال|^contacts$|^partners$/i.test(name);
}

function isSystemUsersDirectoryPath(path: string): boolean {
  return (
    path === '/system/organization/contacts' ||
    path.startsWith('/system/organization/contacts/') ||
    path === '/system/organization/users' ||
    path.startsWith('/system/organization/users/')
  );
}

/**
 * Supplements backend launcher tiles with frontend-registered installable modules
 * (e.g. ecommerce) until the applications catalog seeds them.
 */
export function enrichLauncherApplications(
  apps: ApplicationResponseDto[],
  companyId: string | null | undefined,
): ApplicationResponseDto[] {
  const next = apps.map((app) => ({ ...app }));
  const codes = new Set(next.map((app) => normalizeAppCode(app.code)));

  // Force Partners Master Data onto `/contacts` — never under `/system/...`.
  const contactsIdx = next.findIndex((app) => looksLikePartnersContactsApp(app));
  if (contactsIdx >= 0 && isModuleEnabledFor('contacts', companyId)) {
    const existing = next[contactsIdx]!;
    next[contactsIdx] = {
      ...existing,
      code: 'contacts',
      nameAr: MODULE_REGISTRY.contacts.labelAr,
      nameEn: existing.nameEn?.trim() || 'Contacts',
      icon: existing.icon?.trim() || 'contact',
      routePath: contactsAdminRoutes.overview,
      isActive: true,
      status: existing.status || 'active',
    };
  } else if (!codes.has('contacts') && !codes.has('partners') && isModuleEnabledFor('contacts', companyId)) {
    const maxSort = next.reduce((max, app) => Math.max(max, app.sortOrder), 0);
    next.push({
      id: 'module-contacts',
      code: 'contacts',
      nameAr: MODULE_REGISTRY.contacts.labelAr,
      nameEn: 'Contacts',
      description: null,
      icon: 'contact',
      routePath: contactsAdminRoutes.overview,
      sortOrder: maxSort + 10,
      isActive: true,
      status: 'active',
    });
  }

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
  const code = normalizeAppCode(app.code);
  const base = app.routePath?.trim() ?? '';

  // Standalone Contacts (Partners) — always top-level `/contacts`, never `/system/...`.
  if (looksLikePartnersContactsApp(app)) {
    return contactsAdminRoutes.overview;
  }

  if (code === 'hr') return '/hr/organization/employees';
  if (code === 'ecommerce') return ecommerceAdminRoutes.overview;
  if (code === 'inventory') return inventoryAdminRoutes.overview;
  if (code === 'accounting') return '/accounting';
  if (code === 'system' && (!base || base === '/system' || isSystemUsersDirectoryPath(base))) {
    return resolveSystemAppLaunchPath();
  }

  // Mis-seeded path that pointed Partners at the old System users URL.
  if (isSystemUsersDirectoryPath(base) && /جهات الاتصال|contacts|partners/i.test(`${app.nameAr} ${app.nameEn}`)) {
    return contactsAdminRoutes.overview;
  }

  return base || '/';
}
