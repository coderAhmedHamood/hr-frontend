import { mapStorefrontProduct } from '@/features/ecommerce/storefront/lib/mappers/product-mapper';
import { buildProductDisplay } from '@/features/ecommerce/storefront/lib/product-display';
import type { Product, ProductVariant } from '@/features/ecommerce/domain/types/product';

const money = (amount: number) => ({ amount, currency: 'YER' });

function variant(id: string, price: number): ProductVariant {
  return {
    id,
    combinationKey: `size:${id}`,
    sku: `SKU-${id}`,
    nameAr: id,
    attributeValueIds: [],
    attributeLabels: [],
    salePrice: money(price),
    costPrice: money(0),
    quantity: 5,
    stockStatus: 'in_stock',
    isActive: true,
  };
}

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    companyId: 'c1',
    sku: 'SKU-1',
    slug: 'p1',
    nameAr: 'منتج',
    media: [],
    price: money(100),
    status: 'active',
    stockStatus: 'in_stock',
    inventory: { trackInventory: true, quantity: 5, lowStockThreshold: 1, allowBackorder: false },
    seo: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Product;
}

describe('storefront price of «تخفيضات اليوم» (same rule as the order)', () => {
  it('base 100, deal 80 active: shows 80 struck from 100, badge 20%', () => {
    const shown = mapStorefrontProduct(
      product({ isTodayDealActive: true, dealPrice: money(80) }),
      'ar',
    );
    expect(shown.price.amount).toBe(80);
    expect(shown.compareAtPrice?.amount).toBe(100);
    expect(buildProductDisplay(shown).discountPercent).toBe(20);
  });

  it('deal ended (not active): shows the base price 100', () => {
    const shown = mapStorefrontProduct(
      product({ isTodayDeal: true, isTodayDealActive: false, dealPrice: money(80) }),
      'ar',
    );
    expect(shown.price.amount).toBe(100);
    expect(shown.compareAtPrice).toBeNull();
  });

  it('variants 20 / 30 / 35 with a deal of 25: 20 / 25 / 25 — never above a variant price', () => {
    const shown = mapStorefrontProduct(
      product({
        price: money(30),
        isTodayDealActive: true,
        dealPrice: money(25),
        variants: [variant('xs', 20), variant('s', 30), variant('l', 35)],
      }),
      'ar',
    );
    expect(shown.variants.map((v) => v.price.amount)).toEqual([20, 25, 25]);
  });

  it('wholesale 70 with no other offer: the customer sees and can buy 70, struck from 100', () => {
    const shown = mapStorefrontProduct(
      product({ isWholesaleActive: true, wholesalePrice: money(70) }),
      'ar',
    );
    expect(shown.price.amount).toBe(70);
    expect(shown.compareAtPrice?.amount).toBe(100);
  });

  it('a deal of 80 wins over wholesale 60: the customer pays 80', () => {
    const shown = mapStorefrontProduct(
      product({
        isTodayDealActive: true,
        dealPrice: money(80),
        isWholesaleActive: true,
        wholesalePrice: money(60),
      }),
      'ar',
    );
    expect(shown.price.amount).toBe(80);
    expect(shown.compareAtPrice?.amount).toBe(100);
  });

  it('variants 30 / 35 with a 10% discount: 27 / 31.5', () => {
    const shown = mapStorefrontProduct(
      product({
        price: money(30),
        isDiscountActive: true,
        discountPercent: 10,
        variants: [variant('s', 30), variant('l', 35)],
      }),
      'ar',
    );
    expect(shown.variants.map((v) => v.price.amount)).toEqual([27, 31.5]);
  });
});
