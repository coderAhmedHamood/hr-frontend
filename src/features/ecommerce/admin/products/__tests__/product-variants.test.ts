import {
  buildCombinationKey,
  syncProductVariants,
} from '@/features/ecommerce/admin/products/lib/product-variants';

describe('syncProductVariants', () => {
  it('builds one variant per value combination and preserves prices for existing keys', () => {
    const attributes = [
      {
        id: 'a-color',
        nameAr: 'اللون',
        displayType: 'color' as const,
        createVariant: 'always' as const,
        values: [
          { id: 'v-red', nameAr: 'أحمر', colorHex: '#f00', defaultExtraPrice: 10 },
          { id: 'v-blue', nameAr: 'أزرق', colorHex: '#00f' },
        ],
      },
    ];

    const existingKey = buildCombinationKey(['v-red']);
    const first = syncProductVariants({
      productNameAr: 'تجربة',
      productSku: 'TEST',
      listPrice: 100,
      costPrice: 40,
      attributes,
      existing: [
        {
          id: 'var-red',
          combinationKey: existingKey,
          sku: 'TEST-RED',
          nameAr: 'تجربة (أحمر)',
          attributeValueIds: ['v-red'],
          attributeLabels: [{ attributeNameAr: 'اللون', valueNameAr: 'أحمر', colorHex: '#f00' }],
          salePrice: { amount: 150, currency: 'SAR' },
          costPrice: { amount: 55, currency: 'SAR' },
          quantity: 7,
          stockStatus: 'in_stock',
          isActive: true,
        },
      ],
    });

    expect(first).toHaveLength(2);
    const red = first.find((variant) => variant.combinationKey === existingKey);
    const blue = first.find((variant) => variant.attributeValueIds.includes('v-blue'));
    expect(red?.salePrice.amount).toBe(150);
    expect(red?.quantity).toBe(7);
    expect(blue?.salePrice.amount).toBe(100);
    expect(blue?.nameAr).toContain('أزرق');
  });

  it('returns empty when attributes do not create variants', () => {
    const variants = syncProductVariants({
      productNameAr: 'خدمة',
      productSku: 'SVC',
      listPrice: 10,
      costPrice: 0,
      attributes: [
        {
          id: 'a1',
          nameAr: 'ملاحظة',
          displayType: 'select',
          createVariant: 'never',
          values: [{ id: 'v1', nameAr: 'عادي' }],
        },
      ],
    });
    expect(variants).toEqual([]);
  });
});
