import {
  enrichLauncherApplications,
  resolveApplicationLaunchPath,
  type ApplicationResponseDto,
} from '@/features/system/applications/lib/api/applications';
import { isMultiLangEnabled } from '@/i18n/locale-flags';

describe('enrichLauncherApplications', () => {
  const storeHome = isMultiLangEnabled ? '/ar/store' : '/store';
  const hrApp: ApplicationResponseDto = {
    id: 'hr-1',
    code: 'hr',
    nameAr: 'الموارد البشرية',
    nameEn: 'HR',
    description: null,
    icon: 'users',
    routePath: '/hr',
    sortOrder: 1,
    isActive: true,
    status: 'active',
  };

  it('does not invent store-admin / inventory / contacts when missing from backend list', () => {
    const apps = enrichLauncherApplications([hrApp], 'company-1');
    expect(apps).toHaveLength(1);
    expect(apps[0]!.code).toBe('hr');
    expect(apps.some((app) => app.code === 'store-admin')).toBe(false);
    expect(apps.some((app) => app.code === 'inventory')).toBe(false);
    expect(apps.some((app) => app.code === 'contacts')).toBe(false);
  });

  it('keeps backend-seeded contacts, store-admin, and inventory as-is', () => {
    const seeded: ApplicationResponseDto[] = [
      hrApp,
      {
        ...hrApp,
        id: 'contacts-1',
        code: 'contacts',
        nameAr: 'جهات الاتصال',
        nameEn: 'Contacts',
        routePath: '/contacts',
        sortOrder: 40,
      },
      {
        ...hrApp,
        id: 'sa-1',
        code: 'store-admin',
        nameAr: 'إدارة المتجر',
        nameEn: 'Store Admin',
        routePath: '/store-admin',
        sortOrder: 55,
      },
      {
        ...hrApp,
        id: 'inv-1',
        code: 'inventory',
        nameAr: 'المخازن',
        nameEn: 'Inventory',
        routePath: '/inventory',
        sortOrder: 30,
      },
    ];
    const apps = enrichLauncherApplications(seeded, 'company-1');
    expect(apps.map((app) => app.code)).toEqual(['hr', 'inventory', 'contacts', 'store-admin']);
    expect(apps.find((app) => app.code === 'contacts')!.nameAr).toBe('جهات الاتصال');
    expect(apps.find((app) => app.code === 'store-admin')!.routePath).toBe('/store-admin');
    expect(apps.find((app) => app.code === 'inventory')!.nameAr).toBe('المخازن');
  });

  it('removes legacy ecommerce tile and keeps store-admin from backend', () => {
    const withBoth: ApplicationResponseDto[] = [
      hrApp,
      {
        ...hrApp,
        id: 'eco-1',
        code: 'ecommerce',
        nameAr: 'المتجر الإلكتروني',
        nameEn: 'Online Store',
        routePath: '/overview',
        sortOrder: 2,
      },
      {
        ...hrApp,
        id: 'sa-1',
        code: 'store-admin',
        nameAr: 'إدارة المتجر',
        nameEn: 'Store Admin',
        routePath: '/store-admin',
        sortOrder: 3,
      },
    ];
    const apps = enrichLauncherApplications(withBoth, 'company-1');
    expect(apps.filter((app) => app.code === 'ecommerce')).toHaveLength(0);
    expect(apps.filter((app) => app.code === 'store-admin')).toHaveLength(1);
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'store-admin')!)).toBe(
      '/orders',
    );
  });

  it('drops inactive apps', () => {
    const inactive: ApplicationResponseDto = {
      ...hrApp,
      id: 'inv-off',
      code: 'inventory',
      isActive: false,
      sortOrder: 2,
    };
    const apps = enrichLauncherApplications([hrApp, inactive], 'company-1');
    expect(apps.map((app) => app.code)).toEqual(['hr']);
  });

  it('maps Arabic-named contacts tile to /contacts/list even with unknown code', () => {
    const named: ApplicationResponseDto = {
      ...hrApp,
      id: 'x-1',
      code: 'crm-contacts',
      nameAr: 'جهات الاتصال',
      nameEn: 'Contacts',
      routePath: '/system/organization/contacts',
      sortOrder: 4,
    };
    expect(resolveApplicationLaunchPath(named)).toBe('/contacts/list');
  });

  it('maps backend /contacts seed to /contacts/list on navigate', () => {
    const seeded: ApplicationResponseDto = {
      ...hrApp,
      id: 'contacts-db',
      code: 'contacts',
      nameAr: 'جهات الاتصال',
      nameEn: 'Contacts',
      routePath: '/contacts',
      sortOrder: 40,
    };
    const apps = enrichLauncherApplications([seeded], null);
    expect(apps.find((app) => app.code === 'contacts')!.routePath).toBe('/contacts');
    expect(resolveApplicationLaunchPath(apps[0]!)).toBe('/contacts/list');
  });

  it('maps store-admin /store-admin path to orders home', () => {
    const app: ApplicationResponseDto = {
      ...hrApp,
      id: 'sa',
      code: 'store-admin',
      nameAr: 'إدارة المتجر',
      routePath: '/store-admin',
    };
    expect(resolveApplicationLaunchPath(app)).toBe('/orders');
  });

  it('opens the public storefront under the locale prefix', () => {
    const app: ApplicationResponseDto = {
      ...hrApp,
      id: 'sf',
      code: 'storefront',
      nameAr: 'المتجر',
      nameEn: 'Store',
      routePath: '/store',
    };
    expect(resolveApplicationLaunchPath(app)).toBe(storeHome);
  });

  it('defaults empty storefront routePath to the store home', () => {
    const app: ApplicationResponseDto = {
      ...hrApp,
      id: 'sf-empty',
      code: 'storefront',
      nameAr: 'المتجر',
      routePath: '',
    };
    expect(resolveApplicationLaunchPath(app)).toBe(storeHome);
  });

  it('opens المتجر even when backend code is store and English name is present', () => {
    const app: ApplicationResponseDto = {
      ...hrApp,
      id: 'sf-store-code',
      code: 'store',
      nameAr: 'المتجر',
      nameEn: 'Store',
      routePath: '/store',
    };
    expect(resolveApplicationLaunchPath(app)).toBe(storeHome);
  });

  it('opens المتجر when routePath is empty and names are bilingual', () => {
    const app: ApplicationResponseDto = {
      ...hrApp,
      id: 'sf-named',
      code: 'shop',
      nameAr: 'المتجر',
      nameEn: 'Store',
      routePath: '',
    };
    expect(resolveApplicationLaunchPath(app)).toBe(storeHome);
  });

  it('does not treat store-admin as the public storefront', () => {
    const app: ApplicationResponseDto = {
      ...hrApp,
      id: 'sa-keep',
      code: 'store-admin',
      nameAr: 'إدارة المتجر',
      nameEn: 'Store Admin',
      routePath: '/store',
    };
    expect(resolveApplicationLaunchPath(app)).toBe('/orders');
  });
});
