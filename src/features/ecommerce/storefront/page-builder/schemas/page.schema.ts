import { z } from 'zod';
import {
  BANNER_LAYOUTS,
  BRAND_SLIDER_LAYOUTS,
  CATEGORY_GRID_LAYOUTS,
  FEATURES_GRID_LAYOUTS,
  FLASH_SALE_LAYOUTS,
  HERO_CAROUSEL_LAYOUTS,
  PRODUCT_CAROUSEL_LAYOUTS,
} from '@/features/ecommerce/storefront/page-builder/domain/layout-types';

export const localizableStringSchema = z.object({
  ar: z.string(),
  en: z.string(),
});

export const sectionVisibilitySchema = z.object({
  mobile: z.boolean(),
  tablet: z.boolean(),
  desktop: z.boolean(),
});

export const sectionStyleCoreSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  visibility: sectionVisibilitySchema,
});

/** @deprecated Prefer sectionStyleCoreSchema + typed layout per section */
export const sectionStyleBaseSchema = sectionStyleCoreSchema.extend({
  layout: z.string().min(1),
});

export const sectionMetadataSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'published', 'archived']),
  enabled: z.boolean(),
  order: z.number().int(),
  revision: z.number().int().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
});

export const manualDataSourceSchema = z.object({
  kind: z.literal('manual'),
  entityIds: z.array(z.string().uuid()),
});

export const categoryDataSourceSchema = z.object({
  kind: z.literal('category'),
  categoryId: z.string().uuid(),
  limit: z.number().int().min(1).max(24),
});

export const tagDataSourceSchema = z.object({
  kind: z.literal('tag'),
  tag: z.string().min(1),
  limit: z.number().int().min(1).max(24),
});

export const collectionDataSourceSchema = z.object({
  kind: z.literal('collection'),
  collectionId: z.string().min(1),
  limit: z.number().int().min(1).max(24),
});

export const queryDataSourceSchema = z.object({
  kind: z.literal('query'),
  sort: z.enum(['createdAt', 'price', 'sales', 'name']),
  sortDirection: z.enum(['asc', 'desc']),
  limit: z.number().int().min(1).max(24),
  categoryId: z.string().uuid().nullable(),
  tag: z.string().nullable(),
});

export const recommendationDataSourceSchema = z.object({
  kind: z.literal('recommendation'),
  slot: z.string().min(1),
  limit: z.number().int().min(1).max(24),
});

export const localizedHeadingSchema = z.object({
  title: localizableStringSchema.nullable(),
  subtitle: localizableStringSchema.nullable(),
});

const storePathSchema = z.string().regex(/^\/store/);

export const heroCarouselSectionSchema = sectionMetadataSchema.extend({
  type: z.literal('hero-carousel'),
  content: localizedHeadingSchema.extend({
    slides: z
      .array(
        z.object({
          id: z.string().uuid(),
          imageUrl: z.string().url(),
          mobileImageUrl: z.string().url().optional(),
          title: localizableStringSchema.optional(),
          alt: localizableStringSchema.optional(),
          href: storePathSchema.optional(),
        }),
      )
      .min(1),
  }),
  settings: z.object({
    autoplay: z.boolean(),
    intervalMs: z.number().int().min(1000).max(30000),
  }),
  style: sectionStyleCoreSchema.extend({
    height: z.string().min(1),
    layout: z.enum(HERO_CAROUSEL_LAYOUTS),
  }),
  dataSource: manualDataSourceSchema,
});

export const categoryGridSectionSchema = sectionMetadataSchema.extend({
  type: z.literal('category-grid'),
  content: localizedHeadingSchema,
  settings: z.object({
    showLabels: z.boolean(),
    columns: z.object({
      mobile: z.number().int().min(2).max(12),
      tablet: z.number().int().min(2).max(12),
      desktop: z.number().int().min(2).max(12),
    }),
  }),
  style: sectionStyleCoreSchema.extend({
    layout: z.enum(CATEGORY_GRID_LAYOUTS),
  }),
  dataSource: z.union([manualDataSourceSchema, collectionDataSourceSchema, queryDataSourceSchema]),
});

export const productCarouselSectionSchema = sectionMetadataSchema.extend({
  type: z.literal('product-carousel'),
  content: localizedHeadingSchema.extend({
    viewAllHref: storePathSchema.nullable(),
  }),
  settings: z.object({
    autoplay: z.boolean(),
    showPrice: z.boolean(),
    showBadge: z.boolean(),
  }),
  style: sectionStyleCoreSchema.extend({
    layout: z.enum(PRODUCT_CAROUSEL_LAYOUTS),
  }),
  dataSource: z.union([
    manualDataSourceSchema,
    queryDataSourceSchema,
    tagDataSourceSchema,
    categoryDataSourceSchema,
    collectionDataSourceSchema,
    recommendationDataSourceSchema,
  ]),
});

export const flashSaleSectionSchema = sectionMetadataSchema.extend({
  type: z.literal('flash-sale'),
  content: localizedHeadingSchema.extend({
    viewAllHref: storePathSchema.nullable(),
  }),
  settings: z.object({
    showPrice: z.boolean(),
    showCountdown: z.boolean(),
    endsAt: z.string().datetime().nullable(),
  }),
  style: sectionStyleCoreSchema.extend({
    layout: z.enum(FLASH_SALE_LAYOUTS),
  }),
  dataSource: z.union([tagDataSourceSchema, queryDataSourceSchema]),
});

export const featuresGridSectionSchema = sectionMetadataSchema.extend({
  type: z.literal('features-grid'),
  content: localizedHeadingSchema.extend({
    items: z
      .array(
        z.object({
          id: z.string().uuid(),
          icon: z.enum(['truck', 'shield', 'sparkles', 'headphones']),
          title: localizableStringSchema,
          description: localizableStringSchema,
        }),
      )
      .max(8),
  }),
  settings: z.object({
    columns: z.object({
      mobile: z.number().int().min(1).max(4),
      tablet: z.number().int().min(1).max(4),
      desktop: z.number().int().min(1).max(4),
    }),
  }),
  style: sectionStyleCoreSchema.extend({
    layout: z.enum(FEATURES_GRID_LAYOUTS),
  }),
  dataSource: manualDataSourceSchema,
});

export const brandSliderSectionSchema = sectionMetadataSchema.extend({
  type: z.literal('brand-slider'),
  content: localizedHeadingSchema.extend({
    viewAllHref: storePathSchema.nullable(),
  }),
  settings: z.object({
    showLogo: z.boolean(),
  }),
  style: sectionStyleCoreSchema.extend({
    layout: z.enum(BRAND_SLIDER_LAYOUTS),
  }),
  dataSource: z.union([manualDataSourceSchema, collectionDataSourceSchema]),
});

export const bannerSectionSchema = sectionMetadataSchema.extend({
  type: z.literal('banner'),
  content: z.object({
    imageUrl: z.string().url(),
    mobileImageUrl: z.string().url().nullable(),
    alt: localizableStringSchema,
    href: storePathSchema,
    target: z.enum(['_self', '_blank']),
  }),
  settings: z.object({}),
  style: sectionStyleCoreSchema.extend({
    layout: z.enum(BANNER_LAYOUTS),
  }),
  dataSource: manualDataSourceSchema,
});

export const sectionRecordSchema = z.discriminatedUnion('type', [
  heroCarouselSectionSchema,
  categoryGridSectionSchema,
  productCarouselSectionSchema,
  flashSaleSectionSchema,
  featuresGridSectionSchema,
  brandSliderSectionSchema,
  bannerSectionSchema,
]);

export const pageRecordSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().min(1),
  pageType: z.enum(['homepage', 'category-landing', 'brand-page', 'campaign', 'offer', 'custom']),
  slug: z.string().min(1),
  displayName: localizableStringSchema,
  schemaVersion: z.number().int().min(1),
  contentVersion: z.number().int().min(1),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  createdBy: z.string().uuid().nullable(),
  updatedBy: z.string().uuid().nullable(),
  sections: z.array(sectionRecordSchema),
});
