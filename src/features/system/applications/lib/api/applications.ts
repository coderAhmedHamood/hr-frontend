import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { resolveSystemAppLaunchPath } from '@/features/system/constants/app-launch';
import { systemOwnerRoutes } from '@/features/system-owner/constants/routes';

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

  getAll(query?: { page?: number; limit?: number }) {
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

/** Legacy duplicate of store admin — hide from launcher; content is under `store-admin`. */
function isLegacyEcommerceAdminApp(app: ApplicationResponseDto): boolean {
  const code = normalizeAppCode(app.code);
  if (code === 'ecommerce') return true;
  const name = `${app.nameAr ?? ''} ${app.nameEn ?? ''}`.trim();
  return /المتجر الإلكتروني|online\s*store|e-?commerce/i.test(name);
}

function looksLikeStoreAdminApp(app: ApplicationResponseDto): boolean {
  const code = normalizeAppCode(app.code);
  if (code === 'store-admin' || code === 'storeadmin') return true;
  const name = `${app.nameAr ?? ''} ${app.nameEn ?? ''}`.trim();
  return /إدارة المتجر|store\s*admin/i.test(name);
}

function isSystemUsersDirectoryPath(path: string): boolean {
  return (
    path === '/system/organization/contacts' ||
    path.startsWith('/system/organization/contacts/') ||
    path === '/system/organization/users' ||
    path.startsWith('/system/organization/users/')
  );
}

/** Client-side POS tile until the backend applications catalog seeds `pos`. */
const POS_CASHIER_APP: ApplicationResponseDto = {
  id: 'client-app-pos-cashier',
  code: 'pos',
  nameAr: 'الكاشير',
  nameEn: 'POS Cashier',
  description: 'نقطة بيع لخصم الكمية من المخزون',
  icon: 'shopping-cart',
  routePath: '/pos',
  sortOrder: 35,
  isActive: true,
  status: 'active',
};

function isPosCashierApp(app: ApplicationResponseDto): boolean {
  const code = normalizeAppCode(app.code);
  return code === 'pos' || code === 'cashier' || code === 'point-of-sale';
}

/**
 * Launcher tiles come from `GET /applications`, plus a POS cashier tile when missing.
 * Drops the legacy `ecommerce` duplicate (same UI as `store-admin`).
 */
export function enrichLauncherApplications(
  apps: ApplicationResponseDto[],
  _companyId?: string | null,
): ApplicationResponseDto[] {
  const list = apps
    .filter((app) => app.isActive !== false)
    .filter((app) => !isLegacyEcommerceAdminApp(app))
    .slice();

  if (!list.some(isPosCashierApp)) {
    list.push(POS_CASHIER_APP);
  }

  return list.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** True when the app should open an absolute external URL (`launchUrl`). */
export function resolveApplicationExternalUrl(app: ApplicationResponseDto): string | null {
  const url = app.launchUrl?.trim();
  if (!url) return null;
  if (looksLikePartnersContactsApp(app)) return null;
  if (isLegacyEcommerceAdminApp(app) || looksLikeStoreAdminApp(app)) return null;
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

  // Store back-office (إدارة المتجر) — orders Kanban is the home screen.
  if (
    code === 'store-admin' ||
    code === 'storeadmin' ||
    code === 'ecommerce' ||
    looksLikeStoreAdminApp(app) ||
    isLegacyEcommerceAdminApp(app)
  ) {
    return ecommerceAdminRoutes.orders;
  }

  if (code === 'inventory') return inventoryAdminRoutes.overview;
  if (code === 'pos' || code === 'cashier' || code === 'point-of-sale') {
    return inventoryAdminRoutes.pos;
  }
  if (code === 'accounting') return '/accounting';
  if (code === 'storefront') {
    return base && base.startsWith('/') ? base : '/';
  }
  if (code === 'system' && (!base || base === '/system' || isSystemUsersDirectoryPath(base))) {
    return resolveSystemAppLaunchPath();
  }
  if (code === 'system-owner') return systemOwnerRoutes.companies;
  if (code === 'company-apps') return '/company-apps';

  if (isSystemUsersDirectoryPath(base) && /جهات الاتصال|contacts|partners/i.test(`${app.nameAr} ${app.nameEn}`)) {
    return contactsAdminRoutes.overview;
  }

  if (base === '/contacts' || base === '/contacts/') {
    return contactsAdminRoutes.overview;
  }

  // Backend may still seed `/store-admin` or `/overview` — map to orders home.
  if (
    base === '/store-admin' ||
    base.startsWith('/store-admin/') ||
    base === '/overview' ||
    base.startsWith('/overview/')
  ) {
    return ecommerceAdminRoutes.orders;
  }

  return base || '/';
}
