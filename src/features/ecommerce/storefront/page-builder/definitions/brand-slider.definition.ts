import type { SectionDefinition } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { BRAND_SLIDER_LAYOUTS } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { SUPPORTED_STOREFRONT_LOCALES } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { brandSliderSectionSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
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
  content: { title: null, subtitle: null, viewAllHref: '/store/brands' },
  settings: { showLogo: true },
  style: { theme: 'light', layout: 'slider', visibility: { mobile: true, tablet: true, desktop: true } },
  dataSource: { kind: 'collection', collectionId: 'featured-brands', limit: 6 },
};

export const BRAND_SLIDER_DEFINITION: SectionDefinition<'brand-slider'> = {
  id: 'brand-slider',
  type: 'brand-slider',
  displayName: { ar: 'شريط العلامات', en: 'Brand Slider' },
  description: {
    ar: 'عرض العلامات التجارية المميزة في شريط أفقي أو شبكة.',
    en: 'Featured brands in a horizontal slider or grid layout.',
  },
  icon: 'tags',
  category: 'brands',
  componentKey: 'brand-slider',
  validationSchemaId: 'storefront.section.brand-slider.v1',
  configurationSchemaId: 'storefront.section.brand-slider.config.v1',
  validationSchema: brandSliderSectionSchema,
  configurationSchema: brandSliderSectionSchema,
  defaultConfiguration: DEFAULT_CONFIGURATION,
  supportedLayouts: BRAND_SLIDER_LAYOUTS,
  supportedThemes: ['light', 'dark', 'system'],
  supportedDataSources: ['manual', 'collection'],
  supportedLocales: [...SUPPORTED_STOREFRONT_LOCALES],
  supportedDevices: { mobile: true, tablet: true, desktop: true },
  capabilities: {
    ...BASE_SECTION_CAPABILITIES,
    supportsTitle: true,
    supportsSubtitle: true,
    supportsBrands: true,
    supportsAutoplay: true,
    supportsProducts: false,
    supportsCategories: false,
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
      defaultValue: '/store/brands',
    },
    booleanField('showLogo', 'settings.showLogo', UI_STRINGS.fields.showLogo, 'settings', true),
    themeField(),
    layoutField(BRAND_SLIDER_LAYOUTS),
    visibilityField(),
    dataSourceField(['manual', 'collection']),
  ],
};
