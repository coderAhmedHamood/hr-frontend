import type { Category, CreateCategoryInput } from '@/features/ecommerce/domain/types/category';
import type { CategoryFormValues } from '@/features/ecommerce/admin/categories/schemas/category-schema';

export function categoryToFormValues(category: Category): CategoryFormValues {
  return {
    nameAr: category.nameAr,
    nameEn: category.nameEn ?? '',
    slug: category.slug,
    description: category.description ?? '',
    parentId: category.parentId ?? null,
    imageUrl: category.image?.url ?? '',
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    featuredBrandIds: category.featuredBrandIds ?? [],
    metaTitle: category.seo.metaTitle ?? '',
    metaDescription: category.seo.metaDescription ?? '',
  };
}

export function formValuesToCreateCategoryInput(
  values: CategoryFormValues,
  companyId: string,
  existing?: Category | null,
): CreateCategoryInput {
  return {
    companyId,
    nameAr: values.nameAr.trim(),
    nameEn: values.nameEn?.trim() || undefined,
    slug: values.slug.trim(),
    description: values.description?.trim() || undefined,
    parentId: values.parentId,
    image: values.imageUrl
      ? {
          id: existing?.image?.id ?? `media-cat-${Date.now()}`,
          url: values.imageUrl.trim(),
          alt: values.nameAr.trim(),
          type: 'image',
          position: 0,
          isPrimary: true,
        }
      : undefined,
    featuredBrandIds: values.featuredBrandIds,
    seo: {
      metaTitle: values.metaTitle?.trim() || values.nameAr.trim(),
      metaDescription: values.metaDescription?.trim() || values.description?.trim() || values.nameAr.trim(),
    },
    displayOrder: values.displayOrder,
    isActive: values.isActive,
    // Preserve any legacy logistics payload; managed via inventory putaway rules going forward.
    logistics: existing?.logistics,
  };
}
