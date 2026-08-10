import type { Brand, CreateBrandInput } from '@/features/ecommerce/domain/types/brand';
import {
  BRAND_FORM_DEFAULT_VALUES,
  buildBrandSlug,
  type BrandFormValues,
} from '@/features/ecommerce/admin/brands/schemas/brand-schema';

export function brandToFormValues(brand: Brand): BrandFormValues {
  return {
    nameAr: brand.nameAr,
    nameEn: brand.nameEn ?? '',
    slug: brand.slug,
    description: brand.description ?? '',
    websiteUrl: brand.websiteUrl ?? '',
    logoUrl: brand.logo?.url ?? '',
    isActive: brand.isActive,
    metaTitle: brand.seo.metaTitle ?? '',
    metaDescription: brand.seo.metaDescription ?? '',
  };
}

export function formValuesToCreateBrandInput(values: BrandFormValues, companyId: string): CreateBrandInput {
  const slug = buildBrandSlug(values);

  return {
    companyId,
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn?.trim() || undefined,
    slug,
    description: values.description?.trim() || undefined,
    websiteUrl: values.websiteUrl?.trim() || undefined,
    logo: values.logoUrl?.trim()
      ? {
          id: `media-${Math.random().toString(36).slice(2, 10)}`,
          url: values.logoUrl.trim(),
          alt: values.nameAr.trim(),
          type: 'image',
          position: 0,
          isPrimary: true,
        }
      : undefined,
    isActive: values.isActive,
    seo: {
      metaTitle: values.metaTitle?.trim() || undefined,
      metaDescription: values.metaDescription?.trim() || undefined,
    },
  };
}

export { BRAND_FORM_DEFAULT_VALUES };
