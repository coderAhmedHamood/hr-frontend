import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import type { DataSourceKind } from '@/features/ecommerce/storefront/page-builder/domain/data-source';
import type { SectionTheme } from '@/features/ecommerce/storefront/page-builder/domain/section-style';
import type { SectionType } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import type { StorefrontLocale } from '@/i18n/routing';
import type { z } from 'zod';

export const SECTION_CATEGORIES = [
  'hero',
  'products',
  'categories',
  'brands',
  'promotions',
  'content',
  'trust',
] as const;

export type SectionCategory = (typeof SECTION_CATEGORIES)[number];

export const SUPPORTED_STOREFRONT_LOCALES = ['ar', 'en'] as const satisfies readonly StorefrontLocale[];

export const FIELD_CONTROL_TYPES = [
  'text',
  'localized-text',
  'textarea',
  'localized-textarea',
  'image',
  'url',
  'store-path',
  'boolean',
  'number',
  'select',
  'category-picker',
  'product-picker',
  'brand-picker',
  'collection-picker',
  'data-source',
  'icon-picker',
  'datetime',
  'column-grid',
  'slide-list',
  'feature-list',
  'theme',
  'layout',
  'visibility',
  'link-target',
] as const;

export type FieldControlType = (typeof FIELD_CONTROL_TYPES)[number];

export type FieldValidationRule = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: LocalizableString;
};

export type SelectFieldOption = {
  value: string;
  label: LocalizableString;
};

export type ImageFieldMeta = {
  aspectRatio?: string;
  acceptsAltText: boolean;
  mobileVariant: boolean;
};

export type NumberFieldMeta = {
  step?: number;
  unit?: LocalizableString;
};

export type PickerFieldMeta = {
  selectionMode: 'single' | 'multiple';
  maxItems?: number;
};

export type DataSourceFieldMeta = {
  allowedKinds: readonly DataSourceKind[];
};

export type FieldDefinitionMeta =
  | ImageFieldMeta
  | NumberFieldMeta
  | PickerFieldMeta
  | DataSourceFieldMeta
  | { options: SelectFieldOption[] };

export type FieldDefinition = {
  /** Stable field key for admin forms and API mapping */
  key: string;
  /** Dot-path into section record, e.g. `content.title` */
  path: string;
  label: LocalizableString;
  description?: LocalizableString;
  control: FieldControlType;
  localized: boolean;
  required: boolean;
  group: 'content' | 'settings' | 'style' | 'dataSource' | 'metadata';
  validation?: FieldValidationRule;
  defaultValue?: unknown;
  meta?: FieldDefinitionMeta;
};

export type SectionCapabilities = {
  supportsTitle: boolean;
  supportsSubtitle: boolean;
  supportsBackground: boolean;
  supportsSpacing: boolean;
  supportsContainer: boolean;
  supportsAnimation: boolean;
  supportsAutoplay: boolean;
  supportsProducts: boolean;
  supportsCategories: boolean;
  supportsBrands: boolean;
  supportsBanners: boolean;
  supportsCountdown: boolean;
  supportsFilters: boolean;
  supportsPagination: boolean;
  supportsRecommendations: boolean;
  supportsScheduling: boolean;
  supportsDraft: boolean;
  supportsPreview: boolean;
  supportsAnalytics: boolean;
  supportsTheme: boolean;
  supportsVisibilityRules: boolean;
};

export type DeviceSupport = {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
};

/**
 * Self-describing section manifest — drives future Admin Dashboard form generation
 * and documents backend DTO contracts (see section-definition-backend-contract.md).
 */
export type SectionDefinition<T extends SectionType = SectionType> = {
  id: T;
  type: T;
  displayName: LocalizableString;
  description: LocalizableString;
  /** Lucide icon name for admin palette */
  icon: string;
  category: SectionCategory;
  /** Registry key for storefront renderer — matches `type` */
  componentKey: T;
  /** Zod schema id for backend contract documentation */
  validationSchemaId: string;
  configurationSchemaId: string;
  validationSchema: z.ZodType;
  configurationSchema: z.ZodType;
  defaultConfiguration: Record<string, unknown>;
  supportedLayouts: readonly string[];
  supportedThemes: readonly SectionTheme[];
  supportedDataSources: readonly DataSourceKind[];
  supportedLocales: readonly StorefrontLocale[];
  supportedDevices: DeviceSupport;
  capabilities: SectionCapabilities;
  fields: FieldDefinition[];
};

export type SectionDefinitionCatalog = {
  schemaVersion: number;
  sections: SectionDefinition[];
};
