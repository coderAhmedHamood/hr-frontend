import { brandToFormValues, formValuesToCreateBrandInput } from '@/features/ecommerce/admin/brands/lib/brand-form-mapping';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import type { BrandFormValues } from '@/features/ecommerce/admin/brands/schemas/brand-schema';

const BASE_BRAND: Brand = {
  id: 'brand-1',
  companyId: 'demo-company',
  slug: 'royal-wood',
  nameAr: 'رويال وود',
  seo: {},
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('brandToFormValues', () => {
  it('maps a brand with no logo/website to empty-string form defaults', () => {
    const values = brandToFormValues(BASE_BRAND);
    expect(values.logoUrl).toBe('');
    expect(values.websiteUrl).toBe('');
    expect(values.nameEn).toBe('');
  });

  it('maps an existing logo url', () => {
    const brand: Brand = {
      ...BASE_BRAND,
      logo: { id: 'm1', url: 'https://example.com/logo.png', alt: 'شعار', type: 'image', position: 0, isPrimary: true },
    };
    expect(brandToFormValues(brand).logoUrl).toBe('https://example.com/logo.png');
  });
});

describe('formValuesToCreateBrandInput', () => {
  const BASE_VALUES: BrandFormValues = {
    nameAr: 'مودرن لاين',
    nameEn: '',
    slug: 'modern-line',
    description: '',
    websiteUrl: '',
    logoUrl: '',
    isActive: true,
    metaTitle: '',
    metaDescription: '',
  };

  it('injects the given companyId and collapses empty optional strings to undefined', () => {
    const input = formValuesToCreateBrandInput(BASE_VALUES, 'demo-company');
    expect(input.companyId).toBe('demo-company');
    expect(input.nameEn).toBeUndefined();
    expect(input.websiteUrl).toBeUndefined();
    expect(input.logo).toBeUndefined();
    expect(input.seo.metaTitle).toBeUndefined();
  });

  it('builds a primary logo MediaItem when logoUrl is present', () => {
    const input = formValuesToCreateBrandInput({ ...BASE_VALUES, logoUrl: 'https://example.com/logo.png' }, 'demo-company');
    expect(input.logo).toMatchObject({ url: 'https://example.com/logo.png', isPrimary: true, type: 'image' });
  });

  it('auto-generates slug from English name when slug is left empty', () => {
    const input = formValuesToCreateBrandInput(
      { ...BASE_VALUES, slug: '', nameEn: 'Royal Wood' },
      'demo-company',
    );
    expect(input.slug).toBe('royal-wood');
  });
});
