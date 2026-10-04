import { z } from 'zod';

export const catalogUomFormSchema = z.object({
  nameAr: z.string().trim().min(1, 'اسم الوحدة مطلوب'),
  nameEn: z.string().trim().optional(),
  code: z.string().trim().optional(),
  uneceCode: z.string().trim().optional(),
  packagingType: z.enum(['unit', 'pack', 'box', 'pallet', 'other']),
  category: z.enum(['countable', 'bulk']),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export type CatalogUomFormValues = z.infer<typeof catalogUomFormSchema>;

export const CATALOG_UOM_FORM_DEFAULT_VALUES: CatalogUomFormValues = {
  nameAr: '',
  nameEn: '',
  code: '',
  uneceCode: '',
  packagingType: 'unit',
  category: 'countable',
  displayOrder: 0,
  isActive: true,
};
