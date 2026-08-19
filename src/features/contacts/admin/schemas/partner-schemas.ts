import { z } from 'zod';

export const partnerFormSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب').max(255),
  displayName: z.string().max(255).optional().or(z.literal('')),
  nameAr: z.string().max(255).optional().or(z.literal('')),
  nameEn: z.string().max(255).optional().or(z.literal('')),
  isCompany: z.boolean(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
  isCustomer: z.boolean(),
  isVendor: z.boolean(),
  isEmployee: z.boolean(),
  isInternal: z.boolean(),
  parentId: z.string().uuid().optional().or(z.literal('')),
  email: z.string().email('بريد غير صالح').optional().or(z.literal('')),
  mobile: z.string().max(64).optional().or(z.literal('')),
  phone: z.string().max(64).optional().or(z.literal('')),
  website: z.string().max(500).optional().or(z.literal('')),
  taxNumber: z.string().max(64).optional().or(z.literal('')),
  commercialRegistration: z.string().max(64).optional().or(z.literal('')),
  industry: z.string().max(120).optional().or(z.literal('')),
  jobTitle: z.string().max(120).optional().or(z.literal('')),
  department: z.string().max(120).optional().or(z.literal('')),
  languageCode: z.string().max(16).optional().or(z.literal('')),
  currencyCode: z.string().max(8).optional().or(z.literal('')),
  paymentTerms: z.string().max(120).optional().or(z.literal('')),
  creditLimitAmount: z.string().optional().or(z.literal('')),
  preferredPaymentMethod: z.string().max(64).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  refCode: z.string().max(64).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
});

export type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export const PARTNER_FORM_DEFAULT_VALUES: PartnerFormValues = {
  name: '',
  displayName: '',
  nameAr: '',
  nameEn: '',
  isCompany: false,
  status: 'active',
  isCustomer: false,
  isVendor: false,
  isEmployee: false,
  isInternal: false,
  parentId: '',
  email: '',
  mobile: '',
  phone: '',
  website: '',
  taxNumber: '',
  commercialRegistration: '',
  industry: '',
  jobTitle: '',
  department: '',
  languageCode: 'ar',
  currencyCode: 'SAR',
  paymentTerms: '',
  creditLimitAmount: '',
  preferredPaymentMethod: '',
  notes: '',
  refCode: '',
  tags: '',
};

export const categoryFormSchema = z.object({
  slug: z
    .string()
    .max(80)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[a-z0-9-]+$/i.test(v) || /[\u0600-\u06FF]/.test(v), {
      message: 'معرّف غير صالح',
    }),
  nameAr: z.string().min(1, 'الاسم مطلوب').max(120),
  nameEn: z.string().max(120).optional().or(z.literal('')),
  color: z.string().max(32).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const CATEGORY_FORM_DEFAULT_VALUES: CategoryFormValues = {
  slug: '',
  nameAr: '',
  nameEn: '',
  color: '',
  description: '',
  isActive: true,
};
