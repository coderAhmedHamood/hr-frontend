import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const categoryFormSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم التصنيف مطلوب'),
  nameEn: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .min(1, 'الرابط المختصر مطلوب')
    .regex(slugPattern, 'الرابط المختصر يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطات فقط'),
  description: z.string().trim().optional(),
  parentId: z.string().nullable(),
  imageUrl: z.union([z.string().trim().url('رابط الصورة غير صالح'), z.literal('')]).optional(),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
  featuredBrandIds: z.array(z.string()),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const CATEGORY_FORM_DEFAULT_VALUES: CategoryFormValues = {
  nameAr: '',
  nameEn: '',
  slug: '',
  description: '',
  parentId: null,
  imageUrl: '',
  displayOrder: 0,
  isActive: true,
  featuredBrandIds: [],
  metaTitle: '',
  metaDescription: '',
};
