import type { SectionDefinition } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { HERO_CAROUSEL_LAYOUTS } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { SUPPORTED_STOREFRONT_LOCALES } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { heroCarouselSectionSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
import {
  BASE_SECTION_CAPABILITIES,
  booleanField,
  dataSourceField,
  layoutField,
  localizedSubtitleField,
  localizedTitleField,
  numberField,
  themeField,
  UI_STRINGS,
  visibilityField,
} from '@/features/ecommerce/storefront/page-builder/definitions/shared/field-builders';

const DEFAULT_CONFIGURATION = {
  content: {
    title: null,
    subtitle: null,
    slides: [
      {
        id: '00000000-0000-4000-8000-000000000001',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=80',
        alt: { ar: 'صورة ترويجية', en: 'Promotional image' },
      },
    ],
  },
  settings: { autoplay: true, intervalMs: 5000 },
  style: {
    theme: 'system',
    layout: 'full-bleed',
    height: '21/7',
    visibility: { mobile: true, tablet: true, desktop: true },
  },
  dataSource: { kind: 'manual', entityIds: [] },
};

export const HERO_CAROUSEL_DEFINITION: SectionDefinition<'hero-carousel'> = {
  id: 'hero-carousel',
  type: 'hero-carousel',
  displayName: { ar: 'شريط العرض الرئيسي', en: 'Hero Carousel' },
  description: {
    ar: 'عرض شرائح ترويجية كبيرة في أعلى الصفحة مع روابط قابلة للنقر.',
    en: 'Large promotional slides at the top of the page with clickable links.',
  },
  icon: 'images',
  category: 'hero',
  componentKey: 'hero-carousel',
  validationSchemaId: 'storefront.section.hero-carousel.v1',
  configurationSchemaId: 'storefront.section.hero-carousel.config.v1',
  validationSchema: heroCarouselSectionSchema,
  configurationSchema: heroCarouselSectionSchema,
  defaultConfiguration: DEFAULT_CONFIGURATION,
  supportedLayouts: HERO_CAROUSEL_LAYOUTS,
  supportedThemes: ['light', 'dark', 'system'],
  supportedDataSources: ['manual'],
  supportedLocales: [...SUPPORTED_STOREFRONT_LOCALES],
  supportedDevices: { mobile: true, tablet: true, desktop: true },
  capabilities: {
    ...BASE_SECTION_CAPABILITIES,
    supportsTitle: true,
    supportsSubtitle: true,
    supportsAutoplay: true,
    supportsBanners: true,
    supportsProducts: false,
    supportsCategories: false,
    supportsBrands: false,
    supportsCountdown: false,
  },
  fields: [
    localizedTitleField(false),
    localizedSubtitleField(),
    {
      key: 'slides',
      path: 'content.slides',
      label: UI_STRINGS.fields.slides,
      control: 'slide-list',
      localized: true,
      required: true,
      group: 'content',
      meta: { aspectRatio: '21/7', acceptsAltText: true, mobileVariant: true },
    },
    booleanField('autoplay', 'settings.autoplay', UI_STRINGS.fields.autoplay, 'settings', true),
    numberField('intervalMs', 'settings.intervalMs', UI_STRINGS.fields.intervalMs, 'settings', { min: 1000, max: 30000 }, 5000),
    {
      key: 'height',
      path: 'style.height',
      label: UI_STRINGS.fields.height,
      control: 'text',
      localized: false,
      required: true,
      group: 'style',
      defaultValue: '21/7',
    },
    themeField(),
    layoutField(HERO_CAROUSEL_LAYOUTS),
    visibilityField(),
    dataSourceField(['manual']),
  ],
};
