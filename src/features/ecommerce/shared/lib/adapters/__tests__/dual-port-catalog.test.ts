import { productsApi } from '@/features/ecommerce/admin/products/lib/api/products';
import { storefrontProductsRepository } from '@/features/ecommerce/storefront/lib/repositories/products-repository';
import { storefrontPageRepository } from '@/features/ecommerce/storefront/page-builder/lib/repositories/page-repository';

const COMPANY_ID = 'demo-company';
const LOCALE = 'ar' as const;

describe('shared catalog store (AdminProductsPort ↔ StorefrontProductsPort)', () => {
  it('hides a product from the storefront after admin archives it', async () => {
    const listed = await storefrontProductsRepository.list({
      companyId: COMPANY_ID,
      locale: LOCALE,
      limit: 50,
    });
    const target = listed.items[0];
    expect(target).toBeDefined();
    if (!target) return;

    await productsApi.archive(COMPANY_ID, target.id);

    const after = await storefrontProductsRepository.getById(COMPANY_ID, target.id, LOCALE);
    expect(after).toBeNull();

    // Restore for other tests sharing the module-level store
    await productsApi.unarchive(COMPANY_ID, target.id);
  });
});

describe('page dual ports (draft vs published)', () => {
  it('keeps draft pages invisible to storefront reads', async () => {
    const record = await storefrontPageRepository.getRecordByPageType(COMPANY_ID, 'homepage');
    expect(record).not.toBeNull();
    if (!record) return;

    const draft = await storefrontPageRepository.saveRecord({
      ...record,
      status: 'draft',
    });
    expect(draft.status).toBe('draft');

    const publicPage = await storefrontPageRepository.getByPageType(COMPANY_ID, 'homepage', LOCALE);
    expect(publicPage).toBeNull();

    await storefrontPageRepository.saveRecord({
      ...draft,
      status: 'published',
      publishedAt: draft.publishedAt ?? new Date().toISOString(),
    });

    const restored = await storefrontPageRepository.getByPageType(COMPANY_ID, 'homepage', LOCALE);
    expect(restored).not.toBeNull();
    expect(restored?.status).toBe('published');
  });
});
