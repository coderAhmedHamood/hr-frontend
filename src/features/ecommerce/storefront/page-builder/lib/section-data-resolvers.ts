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
import { storefrontBrandsRepository } from '@/features/ecommerce/storefront/lib/repositories/brands-repository';
import { storefrontCategoriesRepository } from '@/features/ecommerce/storefront/lib/repositories/categories-repository';
import { storefrontProductsRepository } from '@/features/ecommerce/storefront/lib/repositories/products-repository';
import type { StorefrontLocale } from '@/i18n/routing';

export type SectionResolverContext = {
  companyId: string;
  locale: StorefrontLocale;
};

async function resolveProducts(ctx: SectionResolverContext, dataSource: DataSourceConfig) {
  const { companyId, locale } = ctx;

  if (dataSource.kind === 'manual') {
    return storefrontProductsRepository.getByIds(companyId, dataSource.entityIds, locale);
  }

  if (dataSource.kind === 'tag') {
    const result = await storefrontProductsRepository.list({
      companyId,
      locale,
      page: 1,
      limit: dataSource.limit,
      tag: dataSource.tag,
    });
    return result.items;
  }

  if (dataSource.kind === 'query') {
    const sort = dataSource.sort === 'sales' ? 'createdAt' : dataSource.sort;
    const result = await storefrontProductsRepository.list({
      companyId,
      locale,
      page: 1,
      limit: dataSource.limit,
      sort,
      sortDirection: dataSource.sortDirection,
      categoryId: dataSource.categoryId ?? undefined,
      tag: dataSource.tag ?? undefined,
    });
    return result.items;
  }

  if (dataSource.kind === 'category') {
    const result = await storefrontProductsRepository.list({
      companyId,
      locale,
      page: 1,
      limit: dataSource.limit,
      categoryId: dataSource.categoryId,
    });
    return result.items;
  }

  return [];
}

async function resolveCategories(ctx: SectionResolverContext, dataSource: DataSourceConfig) {
  const { companyId, locale } = ctx;

  if (dataSource.kind === 'manual') {
    const result = await storefrontCategoriesRepository.list({ companyId, locale, limit: 50 });
    const byId = new Map(result.items.map((category) => [category.id, category]));
    return dataSource.entityIds.map((id) => byId.get(id)).filter((category) => category !== undefined);
  }

  if (dataSource.kind === 'collection' || dataSource.kind === 'query') {
    // Shop-by-category needs the full adjacency tree (roots + children), not just
    // the first N rows of the flat mock list.
    const configuredLimit = dataSource.limit;
    const limit = Math.max(configuredLimit, 200);
    const result = await storefrontCategoriesRepository.list({ companyId, locale, limit });
    return result.items;
  }

  return [];
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
