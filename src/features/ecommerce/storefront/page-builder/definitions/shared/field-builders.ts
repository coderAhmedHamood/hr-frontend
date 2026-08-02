import type { LocalizableString } from '@/features/ecommerce/storefront/domain/localizable';
import type { FieldDefinition, FieldValidationRule } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { SECTION_THEMES } from '@/features/ecommerce/storefront/page-builder/domain/section-style';

export const UI_STRINGS = {
  fields: {
    title: { ar: 'العنوان', en: 'Title' } satisfies LocalizableString,
    subtitle: { ar: 'العنوان الفرعي', en: 'Subtitle' } satisfies LocalizableString,
    theme: { ar: 'السمة', en: 'Theme' } satisfies LocalizableString,
    layout: { ar: 'التخطيط', en: 'Layout' } satisfies LocalizableString,
    visibility: { ar: 'الظهور حسب الجهاز', en: 'Device visibility' } satisfies LocalizableString,
    dataSource: { ar: 'مصدر البيانات', en: 'Data source' } satisfies LocalizableString,
    viewAllHref: { ar: 'رابط عرض الكل', en: 'View all link' } satisfies LocalizableString,
    autoplay: { ar: 'تشغيل تلقائي', en: 'Autoplay' } satisfies LocalizableString,
    intervalMs: { ar: 'الفاصل الزمني (مللي ثانية)', en: 'Interval (ms)' } satisfies LocalizableString,
    showPrice: { ar: 'إظهار السعر', en: 'Show price' } satisfies LocalizableString,
    showBadge: { ar: 'إظهار الشارة', en: 'Show badge' } satisfies LocalizableString,
    showLabels: { ar: 'إظهار التسميات', en: 'Show labels' } satisfies LocalizableString,
    showCountdown: { ar: 'إظهار العد التنازلي', en: 'Show countdown' } satisfies LocalizableString,
    endsAt: { ar: 'ينتهي في', en: 'Ends at' } satisfies LocalizableString,
    showLogo: { ar: 'إظهار الشعار', en: 'Show logo' } satisfies LocalizableString,
    columns: { ar: 'الأعمدة', en: 'Columns' } satisfies LocalizableString,
    height: { ar: 'الارتفاع', en: 'Height' } satisfies LocalizableString,
    slides: { ar: 'الشرائح', en: 'Slides' } satisfies LocalizableString,
    items: { ar: 'العناصر', en: 'Items' } satisfies LocalizableString,
    imageUrl: { ar: 'رابط الصورة', en: 'Image URL' } satisfies LocalizableString,
    mobileImageUrl: { ar: 'صورة الجوال', en: 'Mobile image URL' } satisfies LocalizableString,
    alt: { ar: 'النص البديل', en: 'Alt text' } satisfies LocalizableString,
    href: { ar: 'الرابط', en: 'Link' } satisfies LocalizableString,
    target: { ar: 'هدف الرابط', en: 'Link target' } satisfies LocalizableString,
  },
} as const;

const DEFAULT_VISIBILITY = { mobile: true, tablet: true, desktop: true };

export function localizedTitleField(required = false): FieldDefinition {
  return {
    key: 'title',
    path: 'content.title',
    label: UI_STRINGS.fields.title,
    control: 'localized-text',
    localized: true,
    required,
    group: 'content',
    validation: { maxLength: 120 },
    defaultValue: null,
  };
}

export function localizedSubtitleField(): FieldDefinition {
  return {
    key: 'subtitle',
    path: 'content.subtitle',
    label: UI_STRINGS.fields.subtitle,
    control: 'localized-text',
    localized: true,
    required: false,
    group: 'content',
    validation: { maxLength: 200 },
    defaultValue: null,
  };
}

export function themeField(): FieldDefinition {
  return {
    key: 'theme',
    path: 'style.theme',
    label: UI_STRINGS.fields.theme,
    control: 'theme',
    localized: false,
    required: true,
    group: 'style',
    defaultValue: 'system',
    meta: {
      options: SECTION_THEMES.map((value) => ({
        value,
        label: {
          ar: value === 'light' ? 'فاتح' : value === 'dark' ? 'داكن' : 'النظام',
          en: value === 'light' ? 'Light' : value === 'dark' ? 'Dark' : 'System',
        },
      })),
    },
  };
}

export function layoutField(layouts: readonly string[]): FieldDefinition {
  return {
    key: 'layout',
    path: 'style.layout',
    label: UI_STRINGS.fields.layout,
    control: 'layout',
    localized: false,
    required: true,
    group: 'style',
    meta: {
      options: layouts.map((value) => ({ value, label: { ar: value, en: value } })),
    },
  };
}

export function visibilityField(): FieldDefinition {
  return {
    key: 'visibility',
    path: 'style.visibility',
    label: UI_STRINGS.fields.visibility,
    control: 'visibility',
    localized: false,
    required: true,
    group: 'style',
    defaultValue: DEFAULT_VISIBILITY,
  };
}

export function dataSourceField(allowedKinds: readonly string[]): FieldDefinition {
  return {
    key: 'dataSource',
    path: 'dataSource',
    label: UI_STRINGS.fields.dataSource,
    control: 'data-source',
    localized: false,
    required: true,
    group: 'dataSource',
    meta: { allowedKinds: allowedKinds as import('@/features/ecommerce/storefront/page-builder/domain/data-source').DataSourceKind[] },
  };
}

export function numberField(
  key: string,
  path: string,
  label: LocalizableString,
  group: FieldDefinition['group'],
  validation?: FieldValidationRule,
  defaultValue?: number,
): FieldDefinition {
  return {
    key,
    path,
    label,
    control: 'number',
    localized: false,
    required: true,
    group,
    validation,
    defaultValue,
  };
}

export function booleanField(
  key: string,
  path: string,
  label: LocalizableString,
  group: FieldDefinition['group'],
  defaultValue = false,
): FieldDefinition {
  return {
    key,
    path,
    label,
    control: 'boolean',
    localized: false,
    required: true,
    group,
    defaultValue,
  };
}

export const BASE_SECTION_CAPABILITIES = {
  supportsDraft: true,
  supportsPreview: true,
  supportsAnalytics: true,
  supportsTheme: true,
  supportsVisibilityRules: true,
  supportsScheduling: false,
  supportsRecommendations: false,
  supportsPagination: false,
  supportsFilters: false,
  supportsBackground: false,
  supportsSpacing: false,
  supportsContainer: true,
  supportsAnimation: false,
} as const;
