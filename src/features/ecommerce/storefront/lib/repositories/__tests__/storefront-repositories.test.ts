import { storefrontSearchRepository } from '@/features/ecommerce/storefront/lib/repositories/search-repository';
import { storefrontProductsRepository } from '@/features/ecommerce/storefront/lib/repositories/products-repository';

const LOCALE = 'ar' as const;
const COMPANY_ID = '76e5bc4f-5adb-434d-a886-bcff05a9680b';

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
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 200,
        message: 'Success',
        data: {
          items: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              companyId: COMPANY_ID,
              slug: 'the-ordinary',
              nameAr: 'ذا أوردينري',
              nameEn: 'The Ordinary',
              description: null,
              logoUrl: null,
              logoAlt: null,
              websiteUrl: null,
              seoMetaTitle: null,
              seoMetaDescription: null,
              seoCanonicalPath: null,
              seoOgImage: null,
              seoKeywords: null,
              displayOrder: 0,
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          pagination: { page: 1, limit: 6, total: 1, totalPages: 1 },
        },
        error: null,
      }),
    } as Response);

    try {
      const result = await storefrontSearchRepository.search(COMPANY_ID, LOCALE, 'ذا أوردينري');
      expect(result.brands.items.some((brand) => brand.slug === 'the-ordinary')).toBe(true);
    } finally {
      fetchSpy.mockRestore();
    }
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
