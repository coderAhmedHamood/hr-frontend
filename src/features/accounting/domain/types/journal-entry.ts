export type JournalEntryState = 'draft' | 'posted' | 'cancel';

export interface JournalItem {
  id: string;
  accountId: string; // e.g. "121000 حساب مدين" or "211000 حساب الدائن"
  accountName?: string;
  partnerId?: string;
  partnerName?: string; // الشريك (e.g. "علي بن علي")
  name: string; // بطاقة عنوان / البيان (e.g. "التحويل إلى 211000 حساب الدائن")
  debit: number; // المدين
  credit: number; // الدائن
  taxGrids?: string; // شبكات الضرائب
  currencyId?: string;
  amountCurrency?: number;
}

export interface JournalEntry {
  id: string;
  name: string; // عدد / الرقم (e.g. "المتف/2026/09/0004" or "الفات/2026/00003" or "STJ/2026/09/0001")
  date: string; // التاريخ (e.g. "2026-09-06" or "6 سبتمبر")
  accountingDate?: string; // تاريخ المحاسبة (e.g. "6 سبتمبر")
  partnerName?: string; // الشريك (e.g. "علي بن علي")
  reference?: string; // الرقم المرجعي (e.g. "S00003" or "Stock Closing")
  journalId: string; // دفتر اليومية
  journalName: string; // e.g. "المبيعات", "عمليات متنوعة", "تقسيم المخزون"
  total: number; // الإجمالي
  state: JournalEntryState; // الحالة (مرحل / مسودة / ملغى)
  autoPost?: boolean; // الترحيل التلقائي (نعم / لا)
  fiscalPosition?: string; // الوضع المالي
  nonModifiableEncryption?: string; // تشفير عدم قابلية التعديل
  internalNotes?: string; // إضافة ملاحظة داخلية...
  items: JournalItem[];
}
