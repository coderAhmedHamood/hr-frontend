import { z } from 'zod';

export { STOCK_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/stock-status';
export { PRODUCT_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/product-status';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'goods', labelAr: 'البضائع' },
  { value: 'service', labelAr: 'الخدمة' },
  { value: 'combo', labelAr: 'مجموعة' },
] as const;

export const PRODUCT_TRACKING_OPTIONS = [
  { value: 'none', labelAr: 'حسب الكمية' },
  { value: 'lot', labelAr: 'أرقام المجموعات' },
  { value: 'serial', labelAr: 'الأرقام التسلسلية' },
] as const;

export const PRODUCT_INVOICE_POLICY_OPTIONS = [
  { value: 'ordered', labelAr: 'الكميات المطلوبة' },
  { value: 'delivered', labelAr: 'الكميات التي تم توصيلها' },
] as const;

export {
  ATTRIBUTE_DISPLAY_OPTIONS,
  VARIANT_CREATION_OPTIONS,
} from '@/features/ecommerce/admin/attributes/schemas/catalog-attribute-schema';

export const PACKAGING_TYPE_OPTIONS = [
  { value: 'unit', labelAr: 'وحدة' },
  { value: 'pack', labelAr: 'علبة' },
  { value: 'box', labelAr: 'صندوق' },
  { value: 'pallet', labelAr: 'منصة' },
  { value: 'other', labelAr: 'أخرى' },
] as const;

const attributeValueSchema = z.object({
  id: z.string(),
  nameAr: z.string().trim().min(1, 'قيمة الخاصية مطلوبة'),
  freeText: z.string().trim().optional(),
  defaultExtraPrice: z.coerce.number().min(0).optional(),
  colorHex: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  extra: z.string().trim().optional(),
});

const attributeSchema = z.object({
  id: z.string(),
  attributeId: z.string().optional(),
  nameAr: z.string().trim().min(1, 'اسم الخاصية مطلوب'),
  displayType: z.enum(['radio', 'pills', 'select', 'color', 'image', 'multi']),
  createVariant: z.enum(['always', 'dynamic', 'never']),
  values: z.array(attributeValueSchema).min(1, 'أضف قيمة واحدة على الأقل'),
});

const uomLineSchema = z.object({
  id: z.string(),
  nameAr: z.string().trim().min(1, 'اسم الوحدة مطلوب'),
  uneceCode: z.string().trim().optional(),
  relativeQuantity: z.coerce.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  isReference: z.boolean(),
  packagingType: z.enum(['unit', 'pack', 'box', 'pallet', 'other']),
});

const variantSchema = z.object({
  id: z.string(),
  combinationKey: z.string(),
  sku: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  attributeValueIds: z.array(z.string()),
  attributeLabels: z.array(
    z.object({
      attributeNameAr: z.string(),
      valueNameAr: z.string(),
      colorHex: z.string().optional(),
    }),
  ),
  salePrice: z.coerce.number().min(0),
  costPrice: z.coerce.number().min(0),
  quantity: z.coerce.number().int().min(0),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'preorder', 'discontinued']),
  barcode: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  isActive: z.boolean(),
});

export const productFormSchema = z
  .object({
    sku: z.string().trim(),
    nameAr: z.string().trim().min(1, 'اسم المنتج مطلوب'),
    nameEn: z.string().trim().optional(),
    slug: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || slugPattern.test(value),
        'الرابط المختصر يجب أن يكون بأحرف إنجليزية صغيرة وأرقام وشرطات فقط',
      ),
    shortDescription: z.string().trim().optional(),
    description: z.string().trim().optional(),
    categoryId: z.string().optional(),
    brandId: z.string().optional(),
    status: z.enum(['draft', 'active', 'archived']),
    stockStatus: z.enum(['in_stock', 'out_of_stock', 'preorder', 'discontinued']),
    stockQuantity: z.coerce.number().int('يجب أن تكون الكمية عددًا صحيحًا').min(0, 'الكمية لا يمكن أن تكون سالبة'),
    trackInventory: z.boolean(),
    allowBackorder: z.boolean(),
    lowStockThreshold: z.coerce.number().int().min(0, 'حد المخزون المنخفض لا يمكن أن يكون سالبًا'),
    tagsInput: z.string().trim().optional(),
    media: z.array(
      z.object({
        url: z.string().trim().url('رابط الصورة غير صالح'),
        alt: z.string().trim().optional(),
        isPrimary: z.boolean(),
      }),
    ),
    metaTitle: z.string().trim().optional(),
    metaDescription: z.string().trim().optional(),
    productType: z.enum(['goods', 'service', 'combo']),
    tracking: z.enum(['none', 'lot', 'serial']),
    invoicePolicy: z.enum(['ordered', 'delivered']),
    listPrice: z.coerce.number().min(0, 'سعر البيع لا يمكن أن يكون سالبًا'),
    costPrice: z.coerce.number().min(0, 'سعر الشراء لا يمكن أن يكون سالبًا'),
    compareAtPrice: z.coerce.number().min(0, 'سعر المقارنة لا يمكن أن يكون سالبًا').optional(),
    barcode: z.string().trim().optional(),
    weightKg: z.coerce.number().min(0).optional(),
    lengthCm: z.coerce.number().min(0).optional(),
    widthCm: z.coerce.number().min(0).optional(),
    heightCm: z.coerce.number().min(0).optional(),
    posAvailable: z.boolean(),
    saleOk: z.boolean(),
    purchaseOk: z.boolean(),
    attributes: z.array(attributeSchema),
    variants: z.array(variantSchema),
    uomLines: z.array(uomLineSchema).min(1, 'أضف وحدة واحدة على الأقل'),
  })
  .superRefine((values, ctx) => {
    const refs = values.uomLines.filter((line) => line.isReference);
    if (refs.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'يجب اختيار وحدة مرجعية واحدة فقط.',
        path: ['uomLines'],
      });
    }
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultUomLines() {
  return [
    {
      id: newId('uom'),
      nameAr: 'وحدات',
      uneceCode: '',
      relativeQuantity: 1,
      isReference: true,
      packagingType: 'unit' as const,
    },
  ];
}

export const PRODUCT_FORM_DEFAULT_VALUES: ProductFormInput = {
  sku: '',
  nameAr: '',
  nameEn: '',
  slug: '',
  shortDescription: '',
  description: '',
  categoryId: undefined,
  brandId: undefined,
  status: 'draft',
  stockStatus: 'in_stock',
  stockQuantity: 0,
  trackInventory: true,
  allowBackorder: false,
  lowStockThreshold: 5,
  tagsInput: '',
  media: [],
  metaTitle: '',
  metaDescription: '',
  productType: 'goods',
  tracking: 'none',
  invoicePolicy: 'ordered',
  listPrice: 0,
  costPrice: 0,
  compareAtPrice: undefined,
  barcode: '',
  weightKg: undefined,
  lengthCm: undefined,
  widthCm: undefined,
  heightCm: undefined,
  posAvailable: false,
  saleOk: true,
  purchaseOk: true,
  attributes: [],
  variants: [],
  uomLines: createDefaultUomLines(),
};
