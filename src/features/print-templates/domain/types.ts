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

/** Page chrome of the one official identity. POS receipts do not use it. */
export type DocumentLayout = 'light' | 'striped' | 'wave' | 'boxed';

/** Table treatment inside the official identity. */
export type DocumentTableStyle = 'light' | 'striped' | 'boxed' | 'bubble';

export type PrintPaper = '80mm' | '58mm' | 'a4';

export type PrintTemplateSettings = {
  templateId: PrintTemplateId;
  /** Official A4 page. Ignored by the thermal receipt. */
  layout: DocumentLayout;
  /** Official A4 table. Ignored by the thermal receipt. */
  tableStyle: DocumentTableStyle;
  /** Short line under the company name on official documents. */
  slogan: string;
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
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
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

/** The company's single identity for official documents and reports. */
export const DEFAULT_PRINT_TEMPLATE_SETTINGS: PrintTemplateSettings = {
  templateId: 'formal',
  layout: 'light',
  tableStyle: 'bubble',
  slogan: '',
  paper: 'a4',
  header: {
    showLogo: true,
    showCompanyName: true,
    showTaxNumber: true,
    showCommercialRegistration: true,
    showPhone: true,
    showAddress: true,
    extraLines: '',
  },
  footer: {
    text: '',
    showDocumentQr: true,
    showSignatures: true,
  },
};

/** POS is the only thermal document family and never inherits the A4 identity. */
export const POS_RECEIPT_PRINT_TEMPLATE_SETTINGS: PrintTemplateSettings = {
  ...DEFAULT_PRINT_TEMPLATE_SETTINGS,
  templateId: 'classic',
  paper: '80mm',
  header: {
    ...DEFAULT_PRINT_TEMPLATE_SETTINGS.header,
    showCommercialRegistration: false,
  },
  footer: {
    text: 'شكرًا لزيارتكم',
    showDocumentQr: true,
    showSignatures: false,
  },
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
    nameAr: 'الهوية الرسمية',
    descriptionAr: 'قالب A4 موحّد لكل السندات والتقارير الرسمية.',
    starter: DEFAULT_PRINT_TEMPLATE_SETTINGS,
  },
  {
    id: 'pos_receipt',
    nameAr: 'إيصال نقاط البيع',
    descriptionAr: 'قالب حراري مستقل للبيع والمرتجع من شاشة الكاشير.',
    starter: POS_RECEIPT_PRINT_TEMPLATE_SETTINGS,
  },
  {
    id: 'inventory_receipt',
    nameAr: 'سند استلام',
    descriptionAr: 'استلام بضاعة إلى المستودع (وارد).',
    starter: DEFAULT_PRINT_TEMPLATE_SETTINGS,
  },
  {
    id: 'inventory_delivery',
    nameAr: 'سند صرف',
    descriptionAr: 'صرف بضاعة من المستودع (صادر).',
    starter: DEFAULT_PRINT_TEMPLATE_SETTINGS,
  },
  {
    id: 'inventory_transfer',
    nameAr: 'سند تحويل',
    descriptionAr: 'تحويل بضاعة بين المستودعات.',
    starter: DEFAULT_PRINT_TEMPLATE_SETTINGS,
  },
];

/** Only identities configured by the company; inventory documents inherit the official identity. */
export const CONFIGURABLE_PRINT_DOCUMENTS = PRINT_DOCUMENTS.filter(
  (document) => document.id === 'default' || document.id === 'pos_receipt',
);

export const DOCUMENT_LAYOUTS: ReadonlyArray<{ id: DocumentLayout; nameAr: string }> = [
  { id: 'light', nameAr: 'فاتح' },
  { id: 'striped', nameAr: 'مخطّط' },
  { id: 'wave', nameAr: 'موجة' },
  { id: 'boxed', nameAr: 'مؤطّر' },
];

export const DOCUMENT_TABLE_STYLES: ReadonlyArray<{ id: DocumentTableStyle; nameAr: string }> = [
  { id: 'light', nameAr: 'فاتح' },
  { id: 'striped', nameAr: 'مخطّط' },
  { id: 'boxed', nameAr: 'مؤطّر' },
  { id: 'bubble', nameAr: 'فقاعة' },
];

/** Keeps older saved rows readable after the layout field was added. */
export function layoutFromTemplate(templateId: PrintTemplateId): DocumentLayout {
  if (templateId === 'modern') return 'wave';
  if (templateId === 'elegant') return 'striped';
  if (templateId === 'classic' || templateId === 'compact') return 'boxed';
  return 'light';
}

export const PRINT_TEMPLATES: ReadonlyArray<{
  id: PrintTemplateId;
  nameAr: string;
  descriptionAr: string;
}> = [
  { id: 'classic', nameAr: 'كلاسيكي', descriptionAr: 'شكل محفوظ للتوافق مع القوالب السابقة.' },
  { id: 'modern', nameAr: 'حديث', descriptionAr: 'شكل محفوظ للتوافق مع القوالب السابقة.' },
  { id: 'compact', nameAr: 'مختصر', descriptionAr: 'شكل محفوظ للتوافق مع القوالب السابقة.' },
  { id: 'formal', nameAr: 'رسمي', descriptionAr: 'شكل محفوظ للتوافق مع القوالب السابقة.' },
  { id: 'elegant', nameAr: 'أنيق', descriptionAr: 'شكل محفوظ للتوافق مع القوالب السابقة.' },
];

export const PRINT_PAPERS: ReadonlyArray<{ id: PrintPaper; nameAr: string; widthMm: number }> = [
  { id: '80mm', nameAr: 'حراري 80 مم', widthMm: 80 },
  { id: '58mm', nameAr: 'حراري 58 مم', widthMm: 58 },
  { id: 'a4', nameAr: 'A4', widthMm: 210 },
];
