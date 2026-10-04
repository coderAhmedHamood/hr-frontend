import {
  PRODUCT_FORM_DEFAULT_VALUES,
  productFormSchema,
} from '@/features/ecommerce/admin/products/schemas/product-schema';

const STORED_UPLOAD_PATH = '/uploads/products/seed-beauty/beauty-126.jpg';

function formWithImage(url: string) {
  return {
    ...PRODUCT_FORM_DEFAULT_VALUES,
    nameAr: 'أجهزة البخار',
    slug: 'viora-022',
    media: [{ url, alt: '', isPrimary: true }],
    uomLines: [
      {
        id: 'uom-1',
        catalogUomId: '11111111-1111-4111-8111-111111111111',
        nameAr: 'حبة',
        uneceCode: 'H87',
        relativeQuantity: 1,
        isReference: true,
        packagingType: 'unit' as const,
      },
    ],
  };
}

describe('product image url on save', () => {
  it('accepts a stored /uploads path so a units-only save is not blocked', () => {
    const result = productFormSchema.safeParse(formWithImage(STORED_UPLOAD_PATH));
    expect(result.success).toBe(true);
  });

  it('accepts absolute http and https image urls', () => {
    expect(productFormSchema.safeParse(formWithImage('https://cdn.example.com/p.jpg')).success).toBe(true);
    expect(productFormSchema.safeParse(formWithImage('http://localhost:3000/uploads/products/a.jpg')).success).toBe(
      true,
    );
  });

  it('rejects a value that is not a path or an http url', () => {
    const result = productFormSchema.safeParse(formWithImage('not a url'));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'رابط الصورة غير صالح')).toBe(true);
    }
  });
});
