import type { Category } from '@/features/ecommerce/domain/types/category';
import type { StorefrontCategory } from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';
import { resolveLocalizedOptional, resolveLocalizedText, type LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';

function resolveName(category: Category, locale: StorefrontLocale): string {
  const localized = (category as Category & { name?: LocalizableString }).name;
  if (localized) return resolveLocalizedText(localized, locale);
  return locale === 'en' && category.nameEn ? category.nameEn : category.nameAr;
}

function resolveDescription(category: Category, locale: StorefrontLocale): string {
  const localized = (category as Category & { description?: LocalizableString }).description;
  if (localized && typeof localized === 'object') return resolveLocalizedText(localized, locale);
  if (typeof category.description === 'string') return category.description;
  return '';
}

export function mapStorefrontCategory(category: Category, locale: StorefrontLocale): StorefrontCategory {
  const name = resolveName(category, locale);
  const image = category.image ?? null;

  return {
    id: category.id,
    companyId: category.companyId,
    slug: category.slug,
    name,
    description: resolveDescription(category, locale),
    parentId: category.parentId ?? null,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt || name,
    displayOrder: category.displayOrder,
    featuredBrandIds: category.featuredBrandIds ?? [],
    metaTitle: category.seo.metaTitle || name,
    metaDescription: category.seo.metaDescription || resolveDescription(category, locale),
  };
}

export function mapStorefrontCategories(categories: Category[], locale: StorefrontLocale): StorefrontCategory[] {
  return categories.map((category) => mapStorefrontCategory(category, locale));
}
