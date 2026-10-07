import type { PrintableDocument } from '@/features/print-templates/domain/types';

/** A believable receipt for template previews. */
export const SAMPLE_PRINT_DOCUMENT: PrintableDocument = {
  title: 'إيصال بيع',
  number: 'POS1-000128',
  issuedAt: '2026-10-07 14:32',
  meta: [
    { label: 'الكاشير', value: 'سارة' },
    { label: 'نقطة البيع', value: 'الكاشير 1' },
    { label: 'العميل', value: 'عميل عابر' },
  ],
  lines: [
    { name: 'قميص قطن', detail: 'أزرق / L', quantity: 2, unitPrice: '45.00', total: '90.00' },
    { name: 'حزام جلد', quantity: 1, unitPrice: '60.00', total: '60.00' },
    { name: 'جوارب', detail: 'خصم 10%', quantity: 3, unitPrice: '8.00', total: '21.60' },
  ],
  totals: [
    { label: 'المجموع', value: '171.60' },
    { label: 'الخصم', value: '0.00' },
    { label: 'الضريبة', value: '22.38' },
    { label: 'الإجمالي', value: '171.60', emphasize: true },
  ],
  payments: [
    { label: 'نقد', value: '100.00' },
    { label: 'بطاقة', value: '71.60' },
  ],
};
