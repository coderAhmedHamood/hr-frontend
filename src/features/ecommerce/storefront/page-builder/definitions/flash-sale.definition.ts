import type { SectionDefinition } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { FLASH_SALE_LAYOUTS } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { SUPPORTED_STOREFRONT_LOCALES } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { flashSaleSectionSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
import {
  BASE_SECTION_CAPABILITIES,
  localizedSubtitleField,
  localizedTitleField,
} from '@/features/ecommerce/storefront/page-builder/definitions/shared/field-builders';

const DEFAULT_CONFIGURATION = {
  content: { title: null, subtitle: null, viewAllHref: null },
  settings: { showPrice: true, showCountdown: false, endsAt: null },
  style: { theme: 'dark', layout: 'carousel', visibility: { mobile: true, tablet: true, desktop: true } },
  dataSource: {
    kind: 'query',
    sort: 'createdAt',
    sortDirection: 'desc',
    limit: 10,
    categoryId: null,
    tag: null,
    isNewProduct: null,
    isTodayDeal: true,
  },
};

export const FLASH_SALE_DEFINITION: SectionDefinition<'flash-sale'> = {
  id: 'flash-sale',
  type: 'flash-sale',
  displayName: { ar: 'تخفيضات سريعة', en: 'Flash Sale' },
  description: {
    ar: 'قسم عروض محدودة بوقت مع منتجات مرتبطة بوسم أو استعلام.',
    en: 'Time-bound deals section with products from tag or query data source.',
  },
  icon: 'zap',
  category: 'promotions',
  componentKey: 'flash-sale',
  validationSchemaId: 'storefront.section.flash-sale.v1',
  configurationSchemaId: 'storefront.section.flash-sale.config.v1',
  validationSchema: flashSaleSectionSchema,
  configurationSchema: flashSaleSectionSchema,
  defaultConfiguration: DEFAULT_CONFIGURATION,
  supportedLayouts: FLASH_SALE_LAYOUTS,
  supportedThemes: ['light', 'dark', 'system'],
  supportedDataSources: ['manual', 'tag', 'query'],
  supportedLocales: [...SUPPORTED_STOREFRONT_LOCALES],
  supportedDevices: { mobile: true, tablet: true, desktop: true },
  capabilities: {
    ...BASE_SECTION_CAPABILITIES,
    supportsTitle: true,
    supportsSubtitle: true,
    supportsProducts: true,
    supportsCountdown: true,
    supportsScheduling: true,
    supportsAutoplay: false,
    supportsCategories: false,
    supportsBrands: false,
    supportsBanners: false,
  },
  fields: [localizedTitleField(true), localizedSubtitleField()],
};
