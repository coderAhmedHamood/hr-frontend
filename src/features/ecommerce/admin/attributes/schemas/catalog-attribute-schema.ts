import { z } from 'zod';

export const ATTRIBUTE_DISPLAY_OPTIONS = [
  { value: 'radio', labelAr: 'راديو', hint: 'خيارات بزر واحد — مناسب للمقاس.' },
  { value: 'pills', labelAr: 'حبوب', hint: 'أزرار أفقية سريعة في المتجر.' },
  { value: 'select', labelAr: 'قائمة', hint: 'قائمة منسدلة عند كثرة القيم.' },
  { value: 'color', labelAr: 'ألوان', hint: 'عينات لون (+ صورة اختيارية) للمتجر.' },
  { value: 'image', labelAr: 'صور', hint: 'اختيار بقيم مصوّرة (خامة، نمط…).' },
  { value: 'multi', labelAr: 'اختيار متعدد', hint: 'أكثر من قيمة معاً (إضافات).' },
] as const;

export const VARIANT_CREATION_OPTIONS = [
  { value: 'always', labelAr: 'فوراً', hint: 'إنشاء تركيبات المتغيرات مباشرة.' },
  { value: 'dynamic', labelAr: 'ديناميكياً', hint: 'إنشاء المتغير عند الطلب/الاختيار.' },
  { value: 'never', labelAr: 'مطلقاً', hint: 'خاصية عرض فقط بدون مصفوفة SKU.' },
] as const;

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
    createVariant: z.enum(['always', 'dynamic', 'never']),
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
