import { storefrontSearchRepository } from '@/features/ecommerce/storefront/lib/repositories/search-repository';
import { storefrontProductsRepository } from '@/features/ecommerce/storefront/lib/repositories/products-repository';

const LOCALE = 'ar' as const;
const COMPANY_ID = 'demo-company';

describe('storefrontSearchRepository', () => {
  it('returns empty results for blank query', async () => {
    const result = await storefrontSearchRepository.search(COMPANY_ID, LOCALE, '   ');
    expect(result.query).toBe('');
    expect(result.products.items).toHaveLength(0);
    expect(result.categories.items).toHaveLength(0);
    expect(result.brands.items).toHaveLength(0);
  });

  it('finds products by Arabic name', async () => {
    const result = await storefrontSearchRepository.search(COMPANY_ID, LOCALE, 'سيرافي');
    expect(result.products.items.length).toBeGreaterThan(0);
    expect(result.products.items[0]?.name).toContain('سيرافي');
  });

  it('finds brands by slug-related name', async () => {
    const result = await storefrontSearchRepository.search(COMPANY_ID, LOCALE, 'ذا أوردينري');
    expect(result.brands.items.some((brand) => brand.slug === 'the-ordinary')).toBe(true);
  });
});

describe('storefrontProductsRepository', () => {
  it('returns only active products', async () => {
    const result = await storefrontProductsRepository.list({ companyId: COMPANY_ID, locale: LOCALE, limit: 50 });
    expect(result.items.every((product) => product.status === 'active')).toBe(true);
  });

  it('filters by brandId', async () => {
    const result = await storefrontProductsRepository.list({
      companyId: COMPANY_ID,
      locale: LOCALE,
      brandId: 'brand-pepsi',
      limit: 50,
    });
    expect(result.items.every((product) => product.brandId === 'brand-pepsi')).toBe(true);
  });
});
