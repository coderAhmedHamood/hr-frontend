import { z } from 'zod';
import { ACCOUNT_TYPES } from '@/features/accounting/domain/types/chart-account';

export const chartAccountFormSchema = z.object({
  code: z
    .string()
    .min(1, 'رمز الحساب مطلوب')
    .max(24, 'رمز الحساب طويل جداً')
    .regex(/^[0-9A-Za-z._-]+$/, 'الرمز يقبل أرقاماً وحروفاً لاتينية فقط'),
  nameAr: z.string().min(1, 'اسم الحساب مطلوب').max(160),
  type: z.enum(ACCOUNT_TYPES),
  allowReconciliation: z.boolean(),
  /** فارغة تعني عملة الشركة */
  currencyCode: z.string().max(3).optional().or(z.literal('')),
});

export type ChartAccountFormValues = z.infer<typeof chartAccountFormSchema>;

export const CHART_ACCOUNT_FORM_DEFAULT_VALUES: ChartAccountFormValues = {
  code: '',
  nameAr: '',
  type: 'asset',
  allowReconciliation: false,
  currencyCode: '',
};
