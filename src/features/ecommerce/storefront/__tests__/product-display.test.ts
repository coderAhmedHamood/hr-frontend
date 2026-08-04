import { buildProductDisplay, hasProductDeal } from '@/features/ecommerce/storefront/lib/product-display';
import type { StorefrontProduct } from '@/features/ecommerce/storefront/domain/storefront-models';

function makeProduct(overrides: Partial<StorefrontProduct> = {}): StorefrontProduct {
  return {
    id: 'p1',
    companyId: 'demo',
    slug: 'test-product',
    sku: 'SKU-1',
    name: 'Test Product',
    description: 'Description',
    brandId: null,
    categoryId: null,
    status: 'active',
    stockStatus: 'in_stock',
    inventory: { quantity: 10, trackInventory: true, lowStockThreshold: 5, allowBackorder: false },
    price: { amount: 80, currency: 'SAR' },
    compareAtPrice: { amount: 100, currency: 'SAR' },
    media: [{ id: 'm1', url: 'https://example.com/p.jpg', alt: 'Product', isPrimary: true, position: 0, type: 'image' }],
    imageUrl: 'https://example.com/p.jpg',
    imageAlt: 'Product',
    tags: [],
    metaTitle: 'Test',
    metaDescription: 'Test',
    attributes: [],
    variants: [],
    ...overrides,
  };
}

describe('buildProductDisplay', () => {
  it('derives primary image and discount percent', () => {
    const display = buildProductDisplay(makeProduct());
    expect(display.imageUrl).toBe('https://example.com/p.jpg');
    expect(display.hasDeal).toBe(true);
    expect(display.discountPercent).toBe(20);
    expect(display.outOfStock).toBe(false);
  });

  it('marks discontinued products as out of stock', () => {
    const display = buildProductDisplay(makeProduct({ stockStatus: 'discontinued' }));
    expect(display.outOfStock).toBe(true);
  });

  it('derives promo badge and selling-fast from tags/inventory', () => {
    const display = buildProductDisplay(
      makeProduct({
        tags: ['best-seller'],
        inventory: { quantity: 3, trackInventory: true, lowStockThreshold: 5, allowBackorder: false },
      }),
    );
    expect(display.promoBadge).toBe('best-seller');
    expect(display.sellingFast).toBe(true);
    expect(display.rating).toBeGreaterThan(0);
  });

  it('builds ordered gallery images from media', () => {
    const display = buildProductDisplay(
      makeProduct({
        media: [
          { id: 'm2', url: 'https://example.com/b.jpg', alt: 'B', isPrimary: false, position: 1, type: 'image' },
          { id: 'm1', url: 'https://example.com/a.jpg', alt: 'A', isPrimary: true, position: 0, type: 'image' },
        ],
      }),
    );
    expect(display.images).toEqual([
      { url: 'https://example.com/a.jpg', alt: 'A' },
      { url: 'https://example.com/b.jpg', alt: 'B' },
    ]);
    expect(display.imageUrl).toBe('https://example.com/a.jpg');
  });
});

describe('hasProductDeal', () => {
  it('returns false when compareAt is missing', () => {
    expect(hasProductDeal(makeProduct({ compareAtPrice: null }))).toBe(false);
  });
});
