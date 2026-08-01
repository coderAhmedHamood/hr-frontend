import {
  enrichLauncherApplications,
  resolveApplicationLaunchPath,
  type ApplicationResponseDto,
} from '@/features/system/applications/lib/api/applications';

describe('enrichLauncherApplications', () => {
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

  it('adds store-admin (not ecommerce) when enabled and missing from backend list', () => {
    const apps = enrichLauncherApplications([hrApp], 'company-1');
    expect(apps.some((app) => app.code === 'ecommerce')).toBe(false);
    expect(apps.some((app) => app.code === 'store-admin')).toBe(true);
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'store-admin')!)).toBe(
      '/orders',
    );
  });

  it('adds inventory when enabled and missing from backend list', () => {
    const apps = enrichLauncherApplications([hrApp], 'company-1');
    expect(apps.some((app) => app.code === 'inventory')).toBe(true);
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'inventory')!)).toBe(
      '/inventory',
    );
  });

  it('removes legacy ecommerce tile and keeps a single store-admin', () => {
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
    expect(apps.find((app) => app.code === 'store-admin')!.routePath).toBe('/orders');
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'store-admin')!)).toBe(
      '/orders',
    );
  });

  it('skips store-admin when no company is selected', () => {
    const apps = enrichLauncherApplications([hrApp], null);
    expect(apps.some((app) => app.code === 'store-admin')).toBe(false);
    expect(apps.some((app) => app.code === 'ecommerce')).toBe(false);
    expect(apps.some((app) => app.code === 'inventory')).toBe(false);
    expect(apps.some((app) => app.code === 'contacts')).toBe(false);
  });

  it('adds contacts when enabled and missing from backend list', () => {
    const apps = enrichLauncherApplications([hrApp], 'company-1');
    expect(apps.some((app) => app.code === 'contacts')).toBe(true);
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'contacts')!)).toBe(
      '/contacts/list',
    );
  });

  it('rewrites backend contacts seed that pointed at system users directory', () => {
    const legacyContacts: ApplicationResponseDto = {
      ...hrApp,
      id: 'contacts-1',
      code: 'Contacts',
      nameAr: 'جهات الاتصال',
      nameEn: 'Contacts',
      routePath: '/system/organization/contacts',
      sortOrder: 3,
    };
    const apps = enrichLauncherApplications([hrApp, legacyContacts], 'company-1');
    const contacts = apps.find((app) => app.code === 'contacts');
    expect(contacts).toBeTruthy();
    expect(contacts!.routePath).toBe('/contacts/list');
    expect(resolveApplicationLaunchPath(contacts!)).toBe('/contacts/list');
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

  it('rewrites backend /contacts seed to /contacts/list entry', () => {
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
    expect(apps.find((app) => app.code === 'contacts')!.routePath).toBe('/contacts/list');
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
});
