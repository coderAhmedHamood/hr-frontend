import { z } from 'zod';

/** Storefront / admin labels for backend `AttributeDisplayType` — values stay English keys. */
export const ATTRIBUTE_DISPLAY_OPTIONS = [
  {
    value: 'radio',
    labelAr: 'اختيار واحد — دوائر',
    hint: 'كل خيار زر دائري؛ يناسب مقاسات قليلة (مثل S / M / L).',
  },
  {
    value: 'pills',
    labelAr: 'اختيار واحد — أزرار شرائح',
    hint: 'أزرار أفقية بارزة في صفحة المنتج؛ الأكثر شيوعاً للمقاس والنوع.',
  },
  {
    value: 'select',
    labelAr: 'قائمة منسدلة',
    hint: 'يناسب خيارات كثيرة دون ازدحام الشاشة.',
  },
  {
    value: 'color',
    labelAr: 'عينات ألوان',
    hint: 'دائرة لون لكل قيمة؛ يمكن إرفاق صورة للون.',
  },
  {
    value: 'image',
    labelAr: 'صور مصغّرة',
    hint: 'اختيار بصورة (قماش، نمط، طراز…).',
  },
  {
    value: 'multi',
    labelAr: 'اختيار متعدد — مربعات',
    hint: 'أكثر من قيمة معاً (إضافات أو خصائص اختيارية).',
  },
] as const;

export type AttributeDisplayTypeValue = (typeof ATTRIBUTE_DISPLAY_OPTIONS)[number]['value'];

export function attributeDisplayTypeLabelAr(value: string | null | undefined): string {
  if (!value) return '—';
  return ATTRIBUTE_DISPLAY_OPTIONS.find((o) => o.value === value)?.labelAr ?? value;
}

export function attributeDisplayTypeHintAr(value: string | null | undefined): string | null {
  if (!value) return null;
  return ATTRIBUTE_DISPLAY_OPTIONS.find((o) => o.value === value)?.hint ?? null;
}

/**
 * "always" and "dynamic" behave identically today — both generate the full
 * variant/SKU matrix immediately; no code path defers variant creation to
 * selection time. Rather than keep a "ديناميكياً" option that promises
 * behavior the system doesn't have, the two are merged into a single
 * "إنشاء فوري" choice. Existing records still holding the legacy `dynamic`
 * value keep working — see {@link normalizeVariantCreationMode}.
 */
export const VARIANT_CREATION_OPTIONS = [
  { value: 'always', labelAr: 'إنشاء فوري', hint: 'الخاصية تدخل في مصفوفة متغيرات/SKU المنتج مباشرة.' },
  { value: 'never', labelAr: 'مطلقاً', hint: 'خاصية عرض فقط بدون مصفوفة SKU.' },
] as const;

/** Maps the legacy `dynamic` value (functionally identical to `always`) onto `always`. */
export function normalizeVariantCreationMode(
  value: 'always' | 'dynamic' | 'never',
): 'always' | 'never' {
  return value === 'never' ? 'never' : 'always';
}

const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'لون غير صالح — استخدم #RGB أو #RRGGBB')
  .optional()
  .or(z.literal(''));

const valueSchema = z.object({
  id: z.string(),
  nameAr: z.string().trim().min(1, 'القيمة مطلوبة'),
  freeText: z.string().trim().optional().or(z.literal('')),
  defaultExtraPrice: z.coerce.number().min(0).optional(),
  colorHex: hexColor,
  imageUrl: z
    .union([z.string().trim().url('رابط الصورة غير صالح'), z.literal('')])
    .optional(),
});

export const catalogAttributeFormSchema = z
  .object({
    nameAr: z.string().trim().min(1, 'اسم الخاصية مطلوب'),
    displayType: z.enum(['radio', 'pills', 'select', 'color', 'image', 'multi']),
    createVariant: z.enum(['always', 'never']),
    isActive: z.boolean(),
    values: z.array(valueSchema).min(1, 'أضف قيمة واحدة على الأقل'),
  })
  .superRefine((data, ctx) => {
    data.values.forEach((value, index) => {
      if (data.displayType === 'color' && !value.colorHex?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'لون القيمة مطلوب',
          path: ['values', index, 'colorHex'],
        });
      }
      if (data.displayType === 'image' && !value.imageUrl?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'صورة القيمة مطلوبة',
          path: ['values', index, 'imageUrl'],
        });
      }
    });
  });

export type CatalogAttributeFormValues = z.infer<typeof catalogAttributeFormSchema>;
export type CatalogAttributeFormInput = z.input<typeof catalogAttributeFormSchema>;

export function createEmptyAttributeValue() {
  return {
    id: `val-${Math.random().toString(36).slice(2, 9)}`,
    nameAr: '',
    freeText: '',
    defaultExtraPrice: 0,
    colorHex: '',
    imageUrl: '',
  };
}

export const CATALOG_ATTRIBUTE_FORM_DEFAULTS: CatalogAttributeFormInput = {
  nameAr: '',
  displayType: 'radio',
  createVariant: 'always',
  isActive: true,
  values: [createEmptyAttributeValue()],
};
