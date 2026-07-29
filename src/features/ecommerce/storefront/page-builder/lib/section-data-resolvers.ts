import { resolveLocalizedText } from '@/features/ecommerce/storefront/domain/localizable';
import type { DataSourceConfig } from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import type {
  NormalizedSection,
  ResolvedSection,
  StorefrontPage,
} from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import type { SectionType } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import {
  mapFeatureItems,
  mapHeroSlides,
} from '@/features/ecommerce/storefront/page-builder/lib/mappers/page-mapper';
import {
  resolveCatalogCategoriesForStorefront,
  resolveCatalogProductsForStorefront,
  type CatalogPickerCategory,
  type CatalogPickerProduct,
} from '@/features/ecommerce/admin/cms/homepage/lib/catalog-picker-actions';
import { storefrontBrandsRepository } from '@/features/ecommerce/storefront/lib/repositories/brands-repository';
import type {
  StorefrontCategory,
  StorefrontProduct,
} from '@/features/ecommerce/storefront/domain/storefront-models';
import type { StorefrontLocale } from '@/i18n/routing';

export type SectionResolverContext = {
  companyId: string;
  locale: StorefrontLocale;
};

function mapPickerProduct(
  item: CatalogPickerProduct,
  companyId: string,
  locale: StorefrontLocale,
): StorefrontProduct {
  const name = locale === 'en' && item.nameEn ? item.nameEn : item.nameAr;
  const currency = item.priceCurrency || 'YER';
  const compareAt =
    item.compareAtPriceAmount != null && item.compareAtPriceAmount > item.priceAmount
      ? { amount: item.compareAtPriceAmount, currency }
      : null;

  return {
    id: item.id,
    companyId,
    slug: item.slug || item.sku,
    sku: item.sku,
    name,
    description: name,
    brandId: null,
    categoryId: item.categoryId ?? null,
    status: 'active',
    stockStatus: item.stockStatus ?? 'in_stock',
    inventory: {
      trackInventory: true,
      quantity: 1,
      lowStockThreshold: 0,
      allowBackorder: false,
    },
    price: { amount: item.priceAmount, currency },
    compareAtPrice: compareAt,
    media: item.imageUrl
      ? [
          {
            id: `${item.id}-img`,
            url: item.imageUrl,
            alt: name,
            type: 'image' as const,
            position: 0,
            isPrimary: true,
          },
        ]
      : [],
    imageUrl: item.imageUrl ?? null,
    imageAlt: name,
    tags: item.tags ?? [],
    metaTitle: name,
    metaDescription: name,
    rating: null,
    reviewCount: 0,
    attributes: [],
    variants: [],
  };
}

function mapPickerCategory(
  item: CatalogPickerCategory,
  companyId: string,
  locale: StorefrontLocale,
): StorefrontCategory {
  const name = locale === 'en' && item.nameEn ? item.nameEn : item.nameAr;
  return {
    id: item.id,
    companyId,
    slug: item.slug,
    name,
    description: name,
    parentId: item.parentId ?? null,
    imageUrl: item.imageUrl ?? null,
    imageAlt: name,
    displayOrder: 0,
    featuredBrandIds: [],
    metaTitle: name,
    metaDescription: name,
  };
}

async function resolveProducts(ctx: SectionResolverContext, dataSource: DataSourceConfig) {
  const { companyId, locale } = ctx;
  let items: CatalogPickerProduct[] = [];

  if (dataSource.kind === 'manual') {
    items = await resolveCatalogProductsForStorefront(companyId, {
      ids: dataSource.entityIds,
      limit: dataSource.entityIds.length || 24,
    });
  } else if (dataSource.kind === 'tag') {
    items = await resolveCatalogProductsForStorefront(companyId, {
      tag: dataSource.tag,
      limit: dataSource.limit,
    });
  } else if (dataSource.kind === 'query') {
    const sort = dataSource.sort === 'sales' ? 'createdAt' : dataSource.sort;
    items = await resolveCatalogProductsForStorefront(companyId, {
      limit: dataSource.limit,
      sort,
      sortDirection: dataSource.sortDirection,
      categoryId: dataSource.categoryId ?? undefined,
      tag: dataSource.tag ?? undefined,
    });
  } else if (dataSource.kind === 'category') {
    items = await resolveCatalogProductsForStorefront(companyId, {
      categoryId: dataSource.categoryId,
      limit: dataSource.limit,
    });
  } else if (dataSource.kind === 'recommendation') {
    items = await resolveCatalogProductsForStorefront(companyId, {
      limit: dataSource.limit,
      sort: 'createdAt',
      sortDirection: 'desc',
    });
  }

  return items.map((item) => mapPickerProduct(item, companyId, locale));
}

async function resolveCategories(ctx: SectionResolverContext, dataSource: DataSourceConfig) {
  const { companyId, locale } = ctx;
  let items: CatalogPickerCategory[] = [];

  if (dataSource.kind === 'manual') {
    const selected = await resolveCatalogCategoriesForStorefront(companyId, {
      ids: dataSource.entityIds,
      limit: Math.max(dataSource.entityIds.length, 50),
    });
    const all = await resolveCatalogCategoriesForStorefront(companyId, { limit: 300 });
    const selectedIds = new Set(selected.map((item) => item.id));

    // Include descendants of selected parents so drill-down still works.
    const include = new Set(selectedIds);
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of all) {
        if (category.parentId && include.has(category.parentId) && !include.has(category.id)) {
          include.add(category.id);
          changed = true;
        }
      }
    }

    items = all
      .filter((item) => include.has(item.id))
      .map((item) =>
        // Promote manually picked rows to roots so the grid always has a top level.
        selectedIds.has(item.id)
          ? { ...item, parentId: null }
          : item,
      );

    if (items.length === 0) {
      items = selected.map((item) => ({ ...item, parentId: null }));
    }
  } else if (dataSource.kind === 'collection' || dataSource.kind === 'query') {
    const configuredLimit = dataSource.limit;
    items = await resolveCatalogCategoriesForStorefront(companyId, {
      limit: Math.max(configuredLimit, 200),
    });
  }

  return items.map((item) => mapPickerCategory(item, companyId, locale));
}

async function resolveBrands(ctx: SectionResolverContext, dataSource: DataSourceConfig) {
  const { companyId, locale } = ctx;

  if (dataSource.kind === 'manual') {
    const result = await storefrontBrandsRepository.list({ companyId, locale, limit: 50 });
    const byId = new Map(result.items.map((brand) => [brand.id, brand]));
    return dataSource.entityIds.map((id) => byId.get(id)).filter((brand) => brand !== undefined);
  }

  if (dataSource.kind === 'collection') {
    const result = await storefrontBrandsRepository.list({ companyId, locale, limit: dataSource.limit });
    return result.items;
  }

  return [];
}

type SectionDataResolver<T extends SectionType> = (
  ctx: SectionResolverContext,
  section: Extract<NormalizedSection, { type: T }>,
) => Promise<Extract<ResolvedSection, { type: T }>>;

const resolveHeroCarousel: SectionDataResolver<'hero-carousel'> = async (ctx, section) => ({
  ...section,
  data: { slides: mapHeroSlides(section, ctx.locale) },
});

const resolveCategoryGrid: SectionDataResolver<'category-grid'> = async (ctx, section) => {
  const categories = await resolveCategories(ctx, section.dataSource);
  return { ...section, data: { categories } };
};

const resolveProductCarousel: SectionDataResolver<'product-carousel'> = async (ctx, section) => {
  const products = await resolveProducts(ctx, section.dataSource);
  return { ...section, data: { products } };
};

const resolveFlashSale: SectionDataResolver<'flash-sale'> = async (ctx, section) => {
  const products = await resolveProducts(ctx, section.dataSource);
  return { ...section, data: { products } };
};

const resolveFeaturesGrid: SectionDataResolver<'features-grid'> = async (ctx, section) => ({
  ...section,
  data: { features: mapFeatureItems(section, ctx.locale) },
});

const resolveBrandSlider: SectionDataResolver<'brand-slider'> = async (ctx, section) => {
  const brands = await resolveBrands(ctx, section.dataSource);
  return { ...section, data: { brands } };
};

const resolveBanner: SectionDataResolver<'banner'> = async (ctx, section) => ({
  ...section,
  data: {
    imageUrl: section.content.imageUrl,
    mobileImageUrl: section.content.mobileImageUrl ?? section.content.imageUrl,
    alt: resolveLocalizedText(section.content.alt, ctx.locale),
    href: section.content.href,
    target: section.content.target,
  },
});

export const SECTION_DATA_RESOLVERS: {
  [K in SectionType]: SectionDataResolver<K>;
} = {
  'hero-carousel': resolveHeroCarousel,
  'category-grid': resolveCategoryGrid,
  'product-carousel': resolveProductCarousel,
  'flash-sale': resolveFlashSale,
  'features-grid': resolveFeaturesGrid,
  'brand-slider': resolveBrandSlider,
  banner: resolveBanner,
};

export async function resolveSection(
  ctx: SectionResolverContext,
  section: NormalizedSection,
): Promise<ResolvedSection> {
  const resolver = SECTION_DATA_RESOLVERS[section.type] as SectionDataResolver<typeof section.type>;
  return resolver(ctx, section as Extract<NormalizedSection, { type: typeof section.type }>);
}

export async function resolvePageSections(
  ctx: SectionResolverContext,
  page: StorefrontPage,
): Promise<ResolvedSection[]> {
  const results = await Promise.all(
    page.sections.map(async (section) => {
      try {
        return await resolveSection(ctx, section);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[page-builder] Failed to resolve section ${section.id}`, error);
        }
        return null;
      }
    }),
  );

  return results.filter((section): section is ResolvedSection => section !== null);
}
