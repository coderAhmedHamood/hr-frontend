import { formValuesToCreateInput, productToFormValues } from '@/features/ecommerce/admin/products/lib/product-form-mapping';
import { createDefaultUomLines } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { Product } from '@/features/ecommerce/domain/types/product';
import type { ProductFormValues } from '@/features/ecommerce/admin/products/schemas/product-schema';

const BASE_PRODUCT: Product = {
  id: 'prod-1',
  companyId: 'demo-company',
  sku: 'SKU-1',
  slug: 'test-product',
  nameAr: 'منتج تجريبي',
  media: [],
  price: { amount: 100, currency: 'SAR' },
  categoryId: 'cat-1',
  brandId: 'brand-1',
  status: 'active',
  stockStatus: 'in_stock',
  inventory: { trackInventory: true, quantity: 5, lowStockThreshold: 5, allowBackorder: false },
  tags: ['مطبخ', 'خشب'],
  seo: {},
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('productToFormValues', () => {
  it('maps a product with no media and no optional fields to empty-array/empty-string form defaults', () => {
    const values = productToFormValues({ ...BASE_PRODUCT, tags: undefined });
    expect(values.media).toEqual([]);
    expect(values.nameEn).toBe('');
    expect(values.categoryId).toBe('cat-1');
    expect(values.brandId).toBe('brand-1');
    expect(values.status).toBe('active');
    expect(values.stockQuantity).toBe(5);
    expect(values.tagsInput).toBe('');
    expect(values.attributes).toEqual([]);
    expect(values.uomLines.length).toBeGreaterThan(0);
  });

  it('maps media items sorted by position, preserving each isPrimary flag', () => {
    const product: Product = {
      ...BASE_PRODUCT,
      media: [
        { id: 'm2', url: 'https://example.com/b.jpg', alt: 'ب', type: 'image', position: 1, isPrimary: true },
        { id: 'm1', url: 'https://example.com/a.jpg', alt: 'صورة أ', type: 'image', position: 0, isPrimary: false },
      ],
    };
    const values = productToFormValues(product);
    expect(values.media).toEqual([
      { url: 'https://example.com/a.jpg', alt: 'صورة أ', isPrimary: false },
      { url: 'https://example.com/b.jpg', alt: 'ب', isPrimary: true },
    ]);
  });

  it('formats tags as a comma-separated string for the input', () => {
    expect(productToFormValues(BASE_PRODUCT).tagsInput).toBe('مطبخ, خشب');
  });

  it('maps a null categoryId/brandId to undefined (not null) for the select fields', () => {
    const product: Product = { ...BASE_PRODUCT, categoryId: null, brandId: null };
    expect(productToFormValues(product).categoryId).toBeUndefined();
    expect(productToFormValues(product).brandId).toBeUndefined();
  });

  it('maps attributes and uom lines when present', () => {
    const product: Product = {
      ...BASE_PRODUCT,
      attributes: [
        {
          id: 'a1',
          nameAr: 'اللون',
          displayType: 'color',
          createVariant: 'always',
          values: [{ id: 'v1', nameAr: 'أحمر', extra: '#f00' }],
        },
      ],
      uomLines: [
        {
          id: 'u1',
          nameAr: 'قطعة',
          relativeQuantity: 1,
          isReference: true,
          packagingType: 'unit',
        },
      ],
    };
    const values = productToFormValues(product);
    expect(values.attributes[0]?.nameAr).toBe('اللون');
    expect(values.uomLines[0]?.nameAr).toBe('قطعة');
  });
});

describe('formValuesToCreateInput', () => {
  const BASE_VALUES: ProductFormValues = {
    sku: 'SKU-2',
    nameAr: 'منتج آخر',
    nameEn: '',
    slug: 'another-product',
    shortDescription: '',
    description: '',
    categoryId: undefined,
    brandId: undefined,
    status: 'active',
    stockStatus: 'in_stock',
    stockQuantity: 3,
    trackInventory: true,
    allowBackorder: false,
    lowStockThreshold: 5,
    tagsInput: '',
    media: [],
    metaTitle: '',
    metaDescription: '',
    productType: 'goods',
    tracking: 'none',
    invoicePolicy: 'ordered',
    listPrice: 0,
    costPrice: 0,
    compareAtPrice: undefined,
    barcode: '',
    weightKg: undefined,
    lengthCm: undefined,
    widthCm: undefined,
    heightCm: undefined,
    posAvailable: false,
    saleOk: true,
    purchaseOk: true,
    attributes: [],
    variants: [],
    uomLines: createDefaultUomLines(),
  };

  it('injects the given companyId and maps a missing category/brand to null', () => {
    const input = formValuesToCreateInput(BASE_VALUES, 'demo-company');
    expect(input.companyId).toBe('demo-company');
    expect(input.categoryId).toBeNull();
    expect(input.brandId).toBeNull();
    expect(input.media).toEqual([]);
  });

  it('maps listPrice and costPrice into catalog money fields', () => {
    const input = formValuesToCreateInput(
      { ...BASE_VALUES, listPrice: 25.5, costPrice: 18 },
      'demo-company',
    );
    expect(input.price).toEqual({ amount: 25.5, currency: 'SAR' });
    expect(input.costPrice).toEqual({ amount: 18, currency: 'SAR' });
  });

  it('maps invoice policy through to create input', () => {
    const input = formValuesToCreateInput(
      { ...BASE_VALUES, invoicePolicy: 'delivered' },
      'demo-company',
    );
    expect(input.invoicePolicy).toBe('delivered');
  });

  it('maps compare-at price from the form when provided', () => {
    const input = formValuesToCreateInput(
      { ...BASE_VALUES, listPrice: 80, compareAtPrice: 120 },
      'demo-company',
    );
    expect(input.price).toEqual({ amount: 80, currency: 'SAR' });
    expect(input.compareAtPrice).toEqual({ amount: 120, currency: 'SAR' });
  });

  it('maps barcode, short description, purchaseOk, and logistics fields', () => {
    const input = formValuesToCreateInput(
      {
        ...BASE_VALUES,
        barcode: '6281000000000',
        shortDescription: 'وصف قصير',
        purchaseOk: false,
        weightKg: 1.5,
        lengthCm: 10,
        widthCm: 5,
        heightCm: 2,
        lowStockThreshold: 8,
      },
      'demo-company',
    );
    expect(input.barcode).toBe('6281000000000');
    expect(input.shortDescription).toBe('وصف قصير');
    expect(input.purchaseOk).toBe(false);
    expect(input.weightKg).toBe(1.5);
    expect(input.dimensions).toEqual({ lengthCm: 10, widthCm: 5, heightCm: 2 });
    expect(input.inventory.lowStockThreshold).toBe(8);
  });

  it('passes status/stockStatus through unchanged', () => {
    expect(formValuesToCreateInput(BASE_VALUES, 'demo-company').status).toBe('active');
    expect(formValuesToCreateInput({ ...BASE_VALUES, status: 'draft' }, 'demo-company').status).toBe('draft');
  });

  it('builds inventory from stockQuantity/trackInventory/allowBackorder', () => {
    const input = formValuesToCreateInput(BASE_VALUES, 'demo-company');
    expect(input.inventory).toEqual({ trackInventory: true, quantity: 3, lowStockThreshold: 5, allowBackorder: false });
  });

  it('parses comma-separated tagsInput into a string array, trimming whitespace', () => {
    const input = formValuesToCreateInput({ ...BASE_VALUES, tagsInput: ' مطبخ ,  خشب ,' }, 'demo-company');
    expect(input.tags).toEqual(['مطبخ', 'خشب']);
  });

  it('maps an empty tagsInput to undefined, not an empty array', () => {
    expect(formValuesToCreateInput(BASE_VALUES, 'demo-company').tags).toBeUndefined();
  });

  it('maps each media entry with its array index as position', () => {
    const input = formValuesToCreateInput(
      {
        ...BASE_VALUES,
        media: [
          { url: 'https://example.com/a.jpg', alt: '', isPrimary: false },
          { url: 'https://example.com/b.jpg', alt: 'ب', isPrimary: true },
        ],
      },
      'demo-company',
    );
    expect(input.media).toHaveLength(2);
    expect(input.media[0]).toMatchObject({ url: 'https://example.com/a.jpg', alt: 'منتج آخر', position: 0, isPrimary: false });
    expect(input.media[1]).toMatchObject({ url: 'https://example.com/b.jpg', alt: 'ب', position: 1, isPrimary: true });
  });

  it('defaults the first media entry to primary when none is explicitly marked', () => {
    const input = formValuesToCreateInput(
      { ...BASE_VALUES, media: [{ url: 'https://example.com/a.jpg', alt: '', isPrimary: false }] },
      'demo-company',
    );
    expect(input.media[0].isPrimary).toBe(true);
  });

  it('collapses empty-string optional fields to undefined rather than storing blank strings', () => {
    const input = formValuesToCreateInput(BASE_VALUES, 'demo-company');
    expect(input.nameEn).toBeUndefined();
    expect(input.description).toBeUndefined();
    expect(input.seo.metaTitle).toBeUndefined();
    expect(input.seo.metaDescription).toBeUndefined();
  });
});
