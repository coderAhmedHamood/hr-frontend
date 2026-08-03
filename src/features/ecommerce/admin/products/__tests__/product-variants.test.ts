import {
  buildCombinationKey,
  buildLabelCombinationKey,
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

    const existingKey = buildLabelCombinationKey(['أحمر']);
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
          salePrice: { amount: 150, currency: 'YER' },
          costPrice: { amount: 55, currency: 'YER' },
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
    expect(blue?.combinationKey).toBe(buildLabelCombinationKey(['أزرق']));
  });

  it('uses Arabic label combination keys in attribute order', () => {
    const variants = syncProductVariants({
      productNameAr: 'غسول',
      productSku: 'ND',
      listPrice: 65,
      costPrice: 35,
      attributes: [
        {
          id: 'a-color',
          nameAr: 'اللون',
          displayType: 'color',
          createVariant: 'always',
          values: [{ id: 'c-yellow', nameAr: 'اصفر' }],
        },
        {
          id: 'a-size',
          nameAr: 'الحجم',
          displayType: 'select',
          createVariant: 'always',
          values: [{ id: 's-small', nameAr: 'صغير' }],
        },
      ],
    });
    expect(variants).toHaveLength(1);
    expect(variants[0]?.combinationKey).toBe('اصفر|صغير');
    expect(buildCombinationKey(['c-yellow', 's-small'])).toBe('c-yellow|s-small');
  });

  it('dedupes duplicate value names so color×size does not repeat combinationKey', () => {
    const variants = syncProductVariants({
      productNameAr: 'غسول',
      productSku: 'ND',
      listPrice: 65,
      costPrice: 35,
      attributes: [
        {
          id: 'a-color',
          nameAr: 'اللون',
          displayType: 'color',
          createVariant: 'always',
          values: [
            { id: 'c-yellow', nameAr: 'اصفر' },
            { id: 'c-black', nameAr: 'أسود' },
          ],
        },
        {
          id: 'a-size',
          nameAr: 'الحجم',
          displayType: 'select',
          createVariant: 'always',
          values: [
            { id: 's-small-1', nameAr: 'صغير' },
            { id: 's-large', nameAr: 'كبير' },
            { id: 's-small-2', nameAr: 'صغير' },
          ],
        },
      ],
    });
    expect(variants).toHaveLength(4);
    const keys = variants.map((variant) => variant.combinationKey);
    expect(keys).toEqual(['اصفر|صغير', 'اصفر|كبير', 'أسود|صغير', 'أسود|كبير']);
    expect(new Set(keys).size).toBe(keys.length);
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
