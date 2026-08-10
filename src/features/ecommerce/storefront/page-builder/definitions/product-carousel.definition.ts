import type { SectionDefinition } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { PRODUCT_CAROUSEL_LAYOUTS } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { SUPPORTED_STOREFRONT_LOCALES } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { productCarouselSectionSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
import {
  BASE_SECTION_CAPABILITIES,
  booleanField,
  dataSourceField,
  layoutField,
  localizedSubtitleField,
  localizedTitleField,
  themeField,
  UI_STRINGS,
  visibilityField,
} from '@/features/ecommerce/storefront/page-builder/definitions/shared/field-builders';

const DEFAULT_CONFIGURATION = {
  content: { title: null, subtitle: null, viewAllHref: null },
  settings: { autoplay: false, showPrice: true, showBadge: false },
  style: { theme: 'light', layout: 'carousel', visibility: { mobile: true, tablet: true, desktop: true } },
  dataSource: {
    kind: 'query',
    sort: 'createdAt',
    sortDirection: 'desc',
    limit: 10,
    categoryId: null,
    tag: null,
  },
};

export const PRODUCT_CAROUSEL_DEFINITION: SectionDefinition<'product-carousel'> = {
  id: 'product-carousel',
  type: 'product-carousel',
  displayName: { ar: 'عرض منتجات', en: 'Product Carousel' },
  description: {
    ar: 'شريط أو شبكة منتجات مع مصدر بيانات قابل للتخصيص وترتيب وعرض الكل.',
    en: 'Product carousel or grid with configurable data source, sorting, and view-all link.',
  },
  icon: 'shopping-bag',
  category: 'products',
  componentKey: 'product-carousel',
  validationSchemaId: 'storefront.section.product-carousel.v1',
  configurationSchemaId: 'storefront.section.product-carousel.config.v1',
  validationSchema: productCarouselSectionSchema,
  configurationSchema: productCarouselSectionSchema,
  defaultConfiguration: DEFAULT_CONFIGURATION,
  supportedLayouts: PRODUCT_CAROUSEL_LAYOUTS,
  supportedThemes: ['light', 'dark', 'system'],
  supportedDataSources: ['manual', 'query', 'tag', 'category', 'collection', 'recommendation'],
  supportedLocales: [...SUPPORTED_STOREFRONT_LOCALES],
  supportedDevices: { mobile: true, tablet: true, desktop: true },
  capabilities: {
    ...BASE_SECTION_CAPABILITIES,
    supportsTitle: true,
    supportsSubtitle: true,
    supportsProducts: true,
    supportsAutoplay: true,
    supportsFilters: true,
    supportsRecommendations: true,
    supportsCategories: false,
    supportsBrands: false,
    supportsBanners: false,
    supportsCountdown: false,
  },
  fields: [
    localizedTitleField(true),
    localizedSubtitleField(),
    {
      key: 'viewAllHref',
      path: 'content.viewAllHref',
      label: UI_STRINGS.fields.viewAllHref,
      control: 'store-path',
      localized: false,
      required: false,
      group: 'content',
      defaultValue: null,
    },
    booleanField('autoplay', 'settings.autoplay', UI_STRINGS.fields.autoplay, 'settings', false),
    booleanField('showPrice', 'settings.showPrice', UI_STRINGS.fields.showPrice, 'settings', true),
    booleanField('showBadge', 'settings.showBadge', UI_STRINGS.fields.showBadge, 'settings', false),
    themeField(),
    layoutField(PRODUCT_CAROUSEL_LAYOUTS),
    visibilityField(),
    dataSourceField(['manual', 'query', 'tag', 'category', 'collection', 'recommendation']),
  ],
};
