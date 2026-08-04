import type { SectionDefinition } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { CATEGORY_GRID_LAYOUTS } from '@/features/ecommerce/storefront/page-builder/domain/layout-types';
import { SUPPORTED_STOREFRONT_LOCALES } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { categoryGridSectionSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';
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
  content: { title: null, subtitle: null },
  settings: { showLabels: true, columns: { mobile: 4, tablet: 6, desktop: 8 } },
  style: { theme: 'light', layout: 'circles', visibility: { mobile: true, tablet: true, desktop: true } },
  dataSource: { kind: 'collection', collectionId: 'featured-categories', limit: 12 },
};

export const CATEGORY_GRID_DEFINITION: SectionDefinition<'category-grid'> = {
  id: 'category-grid',
  type: 'category-grid',
  displayName: { ar: 'شبكة الأقسام', en: 'Category Grid' },
  description: {
    ar: 'عرض أقسام المتجر بشكل دائري أو بطاقات مع روابط للتصفح.',
    en: 'Display store categories as circles or cards with browse links.',
  },
  icon: 'layout-grid',
  category: 'categories',
  componentKey: 'category-grid',
  validationSchemaId: 'storefront.section.category-grid.v1',
  configurationSchemaId: 'storefront.section.category-grid.config.v1',
  validationSchema: categoryGridSectionSchema,
  configurationSchema: categoryGridSectionSchema,
  defaultConfiguration: DEFAULT_CONFIGURATION,
  supportedLayouts: CATEGORY_GRID_LAYOUTS,
  supportedThemes: ['light', 'dark', 'system'],
  supportedDataSources: ['manual', 'collection', 'query'],
  supportedLocales: [...SUPPORTED_STOREFRONT_LOCALES],
  supportedDevices: { mobile: true, tablet: true, desktop: true },
  capabilities: {
    ...BASE_SECTION_CAPABILITIES,
    supportsTitle: true,
    supportsSubtitle: true,
    supportsCategories: true,
    supportsProducts: false,
    supportsBrands: false,
    supportsBanners: false,
    supportsAutoplay: false,
    supportsCountdown: false,
  },
  fields: [
    localizedTitleField(true),
    localizedSubtitleField(),
    booleanField('showLabels', 'settings.showLabels', UI_STRINGS.fields.showLabels, 'settings', true),
    {
      key: 'columns',
      path: 'settings.columns',
      label: UI_STRINGS.fields.columns,
      control: 'column-grid',
      localized: false,
      required: true,
      group: 'settings',
      defaultValue: { mobile: 4, tablet: 6, desktop: 8 },
    },
    themeField(),
    layoutField(CATEGORY_GRID_LAYOUTS),
    visibilityField(),
    dataSourceField(['manual', 'collection', 'query']),
  ],
};
