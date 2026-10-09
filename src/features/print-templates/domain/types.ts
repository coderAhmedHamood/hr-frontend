/**
 * Company print templates (approved 2026-10-09): how printed documents look.
 * Each company has a unified template, and any document type may have its
 * own (e.g. POS receipts on 80 mm, inventory documents on A4). Saved on the
 * server (company settings → قوالب الطباعة), so every user and device prints
 * the same way.
 */

/** Documents printed with the company templates (`default` = the unified one). */
export type PrintDocumentType =
  | 'default'
  | 'pos_receipt'
  | 'inventory_receipt'
  | 'inventory_delivery'
  | 'inventory_transfer';

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
    /** Signature boxes (received by / storekeeper…) on documents that have them. */
    showSignatures: boolean;
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
  /**
   * `sale` (default): quantity, price, total. `stock`: quantity, unit and
   * location — inventory documents carry no prices.
   */
  columns?: 'sale' | 'stock';
  lines: Array<{
    name: string;
    detail?: string;
    quantity: number;
    unitPrice?: string;
    total?: string;
    /** Stock documents: the unit of measure. */
    unit?: string;
    /** Stock documents: where it is taken from / put (e.g. «WH/Stock → A-01»). */
    location?: string;
  }>;
  totals: Array<{ label: string; value: string; emphasize?: boolean }>;
  payments: Array<{ label: string; value: string }>;
  note?: string;
  /** Printed when this is a reprint. */
  copyLabel?: string;
  /** Signature boxes at the bottom (e.g. «المستلم», «أمين المخزن»). */
  signatures?: string[];
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
    showSignatures: true,
  },
};

/** Inventory documents: a formal A4 sheet, no thank-you line. */
const INVENTORY_DOCUMENT_DEFAULT: PrintTemplateSettings = {
  ...DEFAULT_PRINT_TEMPLATE_SETTINGS,
  templateId: 'formal',
  paper: 'a4',
  footer: { text: '', showDocumentQr: true, showSignatures: true },
};

export const PRINT_DOCUMENTS: ReadonlyArray<{
  id: PrintDocumentType;
  nameAr: string;
  descriptionAr: string;
  /** Used when the document gets its own template (a starting point). */
  starter: PrintTemplateSettings;
}> = [
  {
    id: 'default',
    nameAr: 'القالب الموحّد',
    descriptionAr: 'تطبع به كل المستندات التي ليس لها قالب خاص.',
    starter: DEFAULT_PRINT_TEMPLATE_SETTINGS,
  },
  {
    id: 'pos_receipt',
    nameAr: 'إيصال نقاط البيع',
    descriptionAr: 'إيصال البيع والمرتجع من شاشة الكاشير.',
    starter: DEFAULT_PRINT_TEMPLATE_SETTINGS,
  },
  {
    id: 'inventory_receipt',
    nameAr: 'سند استلام',
    descriptionAr: 'استلام بضاعة إلى المستودع (وارد).',
    starter: INVENTORY_DOCUMENT_DEFAULT,
  },
  {
    id: 'inventory_delivery',
    nameAr: 'سند صرف',
    descriptionAr: 'صرف بضاعة من المستودع (صادر).',
    starter: INVENTORY_DOCUMENT_DEFAULT,
  },
  {
    id: 'inventory_transfer',
    nameAr: 'سند تحويل',
    descriptionAr: 'تحويل بضاعة بين المستودعات.',
    starter: INVENTORY_DOCUMENT_DEFAULT,
  },
];

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
