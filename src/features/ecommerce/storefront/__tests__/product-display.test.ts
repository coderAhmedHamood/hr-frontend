import {
  buildProductDisplay,
  getWarehouseOnHand,
  hasProductDeal,
  resolvePurchaseStockStatus,
} from '@/features/ecommerce/storefront/lib/product-display';
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
    price: { amount: 80, currency: 'YER' },
    compareAtPrice: { amount: 100, currency: 'YER' },
    media: [{ id: 'm1', url: 'https://example.com/p.jpg', alt: 'Product', isPrimary: true, position: 0, type: 'image' }],
    imageUrl: 'https://example.com/p.jpg',
    imageAlt: 'Product',
    tags: [],
    metaTitle: 'Test',
    metaDescription: 'Test',
    rating: null,
    reviewCount: 0,
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
    expect(display.promoBadges).toEqual(['best-seller']);
    expect(display.sellingFast).toBe(true);
    expect(display.rating).toBeNull();
  });

  it('collects all active promo badges', () => {
    const display = buildProductDisplay(
      makeProduct({
        isNewProductActive: true,
        isTodayDealActive: true,
        isWholesaleActive: true,
        isDiscountActive: true,
      }),
    );
    expect(display.promoBadges).toEqual(['new', 'deals', 'wholesale', 'discount']);
  });

  it('shows rating only when catalog provides ratingAvg', () => {
    const display = buildProductDisplay(makeProduct({ rating: 4.5, reviewCount: 12 }));
    expect(display.rating).toBe(4.5);
    expect(display.reviewCount).toBe(12);
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

describe('getWarehouseOnHand', () => {
  it('falls back to product qty when variants exist but none are stocked', () => {
    const variant = {
      id: 'v1',
      combinationKey: 's',
      sku: 'SKU-1-S',
      nameAr: 'صغير',
      attributeValueIds: ['a1'],
      attributeLabels: [{ attributeNameAr: 'حجم', valueNameAr: 'صغير' }],
      price: { amount: 65, currency: 'YER' as const },
      quantity: 0,
      stockStatus: 'out_of_stock' as const,
      isActive: true,
    };
    const product = makeProduct({
      inventory: { quantity: 210, trackInventory: true, lowStockThreshold: 10, allowBackorder: false },
      variants: [variant],
    });
    expect(getWarehouseOnHand(product, variant)).toBe(210);
    expect(resolvePurchaseStockStatus(product, variant)).toBe('in_stock');
  });

  it('uses zero for an unstocked variant when siblings have stock', () => {
    const empty = {
      id: 'v1',
      combinationKey: 's',
      sku: 'SKU-1-S',
      nameAr: 'صغير',
      attributeValueIds: ['a1'],
      attributeLabels: [{ attributeNameAr: 'حجم', valueNameAr: 'صغير' }],
      price: { amount: 65, currency: 'YER' as const },
      quantity: 0,
      stockStatus: 'out_of_stock' as const,
      isActive: true,
    };
    const stocked = {
      ...empty,
      id: 'v2',
      combinationKey: 'l',
      sku: 'SKU-1-L',
      nameAr: 'كبير',
      quantity: 40,
      stockStatus: 'in_stock' as const,
    };
    const product = makeProduct({
      inventory: { quantity: 40, trackInventory: true, lowStockThreshold: 5, allowBackorder: false },
      variants: [empty, stocked],
    });
    expect(getWarehouseOnHand(product, empty)).toBe(0);
    expect(getWarehouseOnHand(product, stocked)).toBe(40);
  });
});
