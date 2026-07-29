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

  it('adds ecommerce when enabled and missing from backend list', () => {
    const apps = enrichLauncherApplications([hrApp], 'company-1');
    expect(apps.some((app) => app.code === 'ecommerce')).toBe(true);
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'ecommerce')!)).toBe('/overview');
  });

  it('adds inventory when enabled and missing from backend list', () => {
    const apps = enrichLauncherApplications([hrApp], 'company-1');
    expect(apps.some((app) => app.code === 'inventory')).toBe(true);
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'inventory')!)).toBe('/inventory');
  });

  it('does not duplicate ecommerce when backend already returns it', () => {
    const withEcommerce: ApplicationResponseDto = {
      ...hrApp,
      id: 'eco-1',
      code: 'ecommerce',
      nameAr: 'المتجر',
      nameEn: 'Store',
      routePath: '/overview',
      sortOrder: 2,
    };
    const apps = enrichLauncherApplications([hrApp, withEcommerce], 'company-1');
    expect(apps.filter((app) => app.code === 'ecommerce')).toHaveLength(1);
  });

  it('skips ecommerce when no company is selected', () => {
    const apps = enrichLauncherApplications([hrApp], null);
    expect(apps.some((app) => app.code === 'ecommerce')).toBe(false);
    expect(apps.some((app) => app.code === 'inventory')).toBe(false);
    expect(apps.some((app) => app.code === 'contacts')).toBe(false);
  });

  it('adds contacts when enabled and missing from backend list', () => {
    const apps = enrichLauncherApplications([hrApp], 'company-1');
    expect(apps.some((app) => app.code === 'contacts')).toBe(true);
    expect(resolveApplicationLaunchPath(apps.find((app) => app.code === 'contacts')!)).toBe('/contacts/list');
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
});
