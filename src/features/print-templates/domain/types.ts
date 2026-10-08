/**
 * Company print templates: how printed documents (POS receipts first, other
 * documents later) look. One set per company, chosen in the company settings.
 * The chosen template is the one every app prints with.
 */

export type PrintTemplateId = 'classic' | 'modern' | 'compact' | 'formal' | 'elegant';

export type PrintPaper = '80mm' | '58mm' | 'a4';

export type PrintTemplateSettings = {
  templateId: PrintTemplateId;
  paper: PrintPaper;
  header: {
    showLogo: boolean;
    showCompanyName: boolean;
    showTaxNumber: boolean;
    showCommercialRegistration: boolean;
    showPhone: boolean;
    showAddress: boolean;
    /** Free lines under the company name (branch, slogan…), one per line. */
    extraLines: string;
  };
  footer: {
    /** Free lines at the bottom (thanks, return policy…), one per line. */
    text: string;
    /** QR of the document number, for lookup at the counter (not a tax QR). */
    showDocumentQr: boolean;
  };
};

/** Company data a template can print. */
export type PrintCompany = {
  nameAr: string;
  nameEn?: string | null;
  logoUrl?: string | null;
  taxNumber?: string | null;
  commercialRegistrationNo?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  primaryColor?: string | null;
};

/** A printable document, independent of the app that produced it. */
export type PrintableDocument = {
  title: string;
  number: string;
  issuedAt: string;
  /** Short label/value rows under the title (cashier, register, customer…). */
  meta: Array<{ label: string; value: string }>;
  lines: Array<{
    name: string;
    detail?: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
  totals: Array<{ label: string; value: string; emphasize?: boolean }>;
  payments: Array<{ label: string; value: string }>;
  note?: string;
  /** Printed when this is a reprint. */
  copyLabel?: string;
};

export const DEFAULT_PRINT_TEMPLATE_SETTINGS: PrintTemplateSettings = {
  templateId: 'classic',
  paper: '80mm',
  header: {
    showLogo: true,
    showCompanyName: true,
    showTaxNumber: true,
    showCommercialRegistration: false,
    showPhone: true,
    showAddress: true,
    extraLines: '',
  },
  footer: {
    text: 'شكرًا لزيارتكم',
    showDocumentQr: true,
  },
};

export const PRINT_TEMPLATES: ReadonlyArray<{
  id: PrintTemplateId;
  nameAr: string;
  descriptionAr: string;
}> = [
  { id: 'classic', nameAr: 'كلاسيكي', descriptionAr: 'شعار واسم في الوسط، وجدول أصناف بخطوط فاصلة.' },
  { id: 'modern', nameAr: 'حديث', descriptionAr: 'ترويسة ملوّنة بلون الشركة، وإجمالي بارز.' },
  { id: 'compact', nameAr: 'مختصر', descriptionAr: 'أقل مساحة وورق، مناسب للطابعات الصغيرة.' },
  { id: 'formal', nameAr: 'رسمي', descriptionAr: 'إطار وبيانات الشركة والرقم الضريبي في جدول.' },
  { id: 'elegant', nameAr: 'أنيق', descriptionAr: 'الشعار جانبًا، وخطوط رفيعة، وتذييل في صندوق.' },
];

export const PRINT_PAPERS: ReadonlyArray<{ id: PrintPaper; nameAr: string; widthMm: number }> = [
  { id: '80mm', nameAr: 'حراري 80 مم', widthMm: 80 },
  { id: '58mm', nameAr: 'حراري 58 مم', widthMm: 58 },
  { id: 'a4', nameAr: 'A4', widthMm: 210 },
];
