import { APP, companyAppsFrom } from '@/shared/modules/company-apps';

const TABS = [
  { value: 'general' },
  { value: 'orders', requiresApp: APP.storeAdmin },
  { value: 'stock', requiresAnyApp: [APP.inventory, APP.storeAdmin] },
  { value: 'sync', requiresAllApps: [APP.inventory, APP.storeAdmin] },
] as const;

describe('companyAppsFrom', () => {
  it('shows only what needs no app while the apps are not known', () => {
    const apps = companyAppsFrom(null);
    expect(apps.ready).toBe(false);
    expect(apps.isEnabled(APP.inventory)).toBe(false);
    expect(apps.filter(TABS).map((t) => t.value)).toEqual(['general']);
  });

  it('hides parts of a disabled app (inventory off, store on)', () => {
    const apps = companyAppsFrom(['catalog', 'store-admin', 'system']);
    expect(apps.ready).toBe(true);
    expect(apps.filter(TABS).map((t) => t.value)).toEqual(['general', 'orders', 'stock']);
  });

  it('shows everything once both apps are on', () => {
    const apps = companyAppsFrom(['catalog', 'inventory', 'store-admin']);
    expect(apps.filter(TABS).map((t) => t.value)).toEqual(['general', 'orders', 'stock', 'sync']);
  });

  it('an empty list means nothing is enabled, not everything', () => {
    const apps = companyAppsFrom([]);
    expect(apps.ready).toBe(true);
    expect(apps.filter(TABS).map((t) => t.value)).toEqual(['general']);
  });

  it('reads older codes as the same apps', () => {
    const apps = companyAppsFrom(['ECOMMERCE', 'partners', 'sale-deduct']);
    expect(apps.isEnabled(APP.storeAdmin)).toBe(true);
    expect(apps.isEnabled(APP.contacts)).toBe(true);
    expect(apps.isEnabled(APP.shopSales)).toBe(true);
  });
});
