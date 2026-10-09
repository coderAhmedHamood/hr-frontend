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

/** A believable inventory document (no prices, signatures) for previews. */
export const SAMPLE_STOCK_DOCUMENT: PrintableDocument = {
  title: 'سند استلام',
  number: 'WH/IN/00042',
  issuedAt: '2026-10-09 10:15',
  columns: 'stock',
  meta: [
    { label: 'المستودع', value: 'المستودع الرئيسي' },
    { label: 'المورد', value: 'شركة التوريدات الحديثة' },
    { label: 'المستند المصدر', value: 'أمر شراء PO-0091' },
  ],
  lines: [
    { name: 'قميص قطن', detail: 'أزرق / L', quantity: 24, unit: 'قطعة', location: 'WH/Stock/A-01' },
    { name: 'حزام جلد', quantity: 10, unit: 'قطعة', location: 'WH/Stock/A-02' },
    { name: 'جوارب', quantity: 12, unit: 'درزن', location: 'WH/Stock/B-04' },
  ],
  totals: [{ label: 'إجمالي الكميات', value: '46', emphasize: true }],
  payments: [],
  signatures: ['المورد / المسلِّم', 'أمين المخزن', 'المعتمد'],
};

export function samplePrintDocument(documentType: string): PrintableDocument {
  if (documentType === 'inventory_receipt') return SAMPLE_STOCK_DOCUMENT;
  if (documentType === 'inventory_delivery') {
    return {
      ...SAMPLE_STOCK_DOCUMENT,
      title: 'سند صرف',
      number: 'WH/OUT/00017',
      meta: [
        { label: 'المستودع', value: 'المستودع الرئيسي' },
        { label: 'المستلم', value: 'فرع الشارع الرئيسي' },
      ],
      signatures: ['المستلم', 'أمين المخزن', 'المعتمد'],
    };
  }
  if (documentType === 'inventory_transfer') {
    return {
      ...SAMPLE_STOCK_DOCUMENT,
      title: 'سند تحويل',
      number: 'WH/INT/00008',
      meta: [
        { label: 'من مستودع', value: 'المستودع الرئيسي' },
        { label: 'إلى مستودع', value: 'مستودع الفرع' },
      ],
      lines: SAMPLE_STOCK_DOCUMENT.lines.map((line) => ({ ...line, location: 'WH/Stock → BR/Stock' })),
      signatures: ['المسلِّم', 'المستلم', 'أمين المخزن'],
    };
  }
  return SAMPLE_PRINT_DOCUMENT;
}
