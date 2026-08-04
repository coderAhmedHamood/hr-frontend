import type { SectionDefinition } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { FEATURES_GRID_LAYOUTS } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { SUPPORTED_STOREFRONT_LOCALES } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { featuresGridSectionSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
import {
  BASE_SECTION_CAPABILITIES,
  dataSourceField,
  layoutField,
  localizedSubtitleField,
  localizedTitleField,
  themeField,
  UI_STRINGS,
  visibilityField,
} from '@/features/ecommerce/storefront/page-builder/definitions/shared/field-builders';

const DEFAULT_CONFIGURATION = {
  content: { title: null, subtitle: null, items: [] },
  settings: { columns: { mobile: 1, tablet: 2, desktop: 4 } },
  style: { theme: 'light', layout: 'four-column', visibility: { mobile: true, tablet: true, desktop: true } },
  dataSource: { kind: 'manual', entityIds: [] },
};

export const FEATURES_GRID_DEFINITION: SectionDefinition<'features-grid'> = {
  id: 'features-grid',
  type: 'features-grid',
  displayName: { ar: 'ميزات المتجر', en: 'Features Grid' },
  description: {
    ar: 'عرض نقاط الثقة والخدمات مثل التوصيل والدعم والجودة.',
    en: 'Trust and service highlights such as delivery, support, and quality.',
  },
  icon: 'badge-check',
  category: 'trust',
  componentKey: 'features-grid',
  validationSchemaId: 'storefront.section.features-grid.v1',
  configurationSchemaId: 'storefront.section.features-grid.config.v1',
  validationSchema: featuresGridSectionSchema,
  configurationSchema: featuresGridSectionSchema,
  defaultConfiguration: DEFAULT_CONFIGURATION,
  supportedLayouts: FEATURES_GRID_LAYOUTS,
  supportedThemes: ['light', 'dark', 'system'],
  supportedDataSources: ['manual'],
  supportedLocales: [...SUPPORTED_STOREFRONT_LOCALES],
  supportedDevices: { mobile: true, tablet: true, desktop: true },
  capabilities: {
    ...BASE_SECTION_CAPABILITIES,
    supportsTitle: true,
    supportsSubtitle: true,
    supportsProducts: false,
    supportsCategories: false,
    supportsBrands: false,
    supportsBanners: false,
    supportsAutoplay: false,
    supportsCountdown: false,
  },
  fields: [
    localizedTitleField(false),
    localizedSubtitleField(),
    {
      key: 'items',
      path: 'content.items',
      label: UI_STRINGS.fields.items,
      control: 'feature-list',
      localized: true,
      required: true,
      group: 'content',
      validation: { max: 8 },
    },
    {
      key: 'columns',
      path: 'settings.columns',
      label: UI_STRINGS.fields.columns,
      control: 'column-grid',
      localized: false,
      required: true,
      group: 'settings',
      defaultValue: { mobile: 1, tablet: 2, desktop: 4 },
    },
    themeField(),
    layoutField(FEATURES_GRID_LAYOUTS),
    visibilityField(),
    dataSourceField(['manual']),
  ],
};
