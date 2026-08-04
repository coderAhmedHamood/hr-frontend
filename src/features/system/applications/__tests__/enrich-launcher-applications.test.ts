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
  });
});
