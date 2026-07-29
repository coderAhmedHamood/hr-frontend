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
  /** External URL (e.g. storefront). When set, launcher opens it instead of `routePath`. */
  launchUrl?: string | null;
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

  // Normalize Partners Master Data onto `/contacts/list` — never under `/system/...`.
  // Rewrite whenever the backend already granted the tile (do not depend on companyId timing).
  const contactsIdx = next.findIndex((app) => looksLikePartnersContactsApp(app));
  if (contactsIdx >= 0) {
    const existing = next[contactsIdx]!;
    next[contactsIdx] = {
      ...existing,
      code: 'contacts',
      nameAr: MODULE_REGISTRY.contacts.labelAr,
      nameEn: existing.nameEn?.trim() || 'Contacts',
      icon: existing.icon?.trim() || 'contacts',
      routePath: contactsAdminRoutes.overview,
      launchUrl: null,
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

/** True when the app should open an absolute external URL (`launchUrl`). */
export function resolveApplicationExternalUrl(app: ApplicationResponseDto): string | null {
  const url = app.launchUrl?.trim();
  if (!url) return null;
  if (looksLikePartnersContactsApp(app)) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Where the app tile navigates inside this Next app (ignores external `launchUrl`). */
export function resolveApplicationLaunchPath(app: ApplicationResponseDto): string {
  const code = normalizeAppCode(app.code);
  const base = app.routePath?.trim() ?? '';

  // Standalone Contacts (Partners) — `/contacts/list`, never `/system/...`.
  if (looksLikePartnersContactsApp(app)) {
    return contactsAdminRoutes.overview;
  }

  if (code === 'hr') return '/hr/organization/employees';
  if (code === 'ecommerce' || code === 'store-admin') {
    return base && base.startsWith('/') ? base : ecommerceAdminRoutes.overview;
  }
  if (code === 'inventory') return inventoryAdminRoutes.overview;
  if (code === 'accounting') return '/accounting';
  if (code === 'storefront') {
    // Prefer launchUrl via resolveApplicationExternalUrl; internal fallback unused.
    return base && base.startsWith('/') ? base : '/';
  }
  if (code === 'system' && (!base || base === '/system' || isSystemUsersDirectoryPath(base))) {
    return resolveSystemAppLaunchPath();
  }

  // Mis-seeded path that pointed Partners at the old System users URL.
  if (isSystemUsersDirectoryPath(base) && /جهات الاتصال|contacts|partners/i.test(`${app.nameAr} ${app.nameEn}`)) {
    return contactsAdminRoutes.overview;
  }

  // Backend may still seed `/contacts` — remapped entry avoids cached 308 poison.
  if (base === '/contacts' || base === '/contacts/') {
    return contactsAdminRoutes.overview;
  }

  return base || '/';
}
