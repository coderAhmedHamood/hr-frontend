export interface ReconciliationItem {
  id: string;
  date: string; // التاريخ (e.g. "7 سبتمبر")
  journalEntryName: string; // قيد اليومية (e.g. "الفات/2026/00003")
  label: string; // بطاقة عنوان (e.g. "S00003 - الفات/2026/00003")
  currencyAmount?: number; // بالعملة
  debit: number; // المدين
  credit: number; // الدائن
  remaining: number; // المتبقي
  partnerName?: string; // الشريك
  accountId: string; // الحساب
}

export interface ReconciliationPartnerGroup {
  partnerId: string;
  partnerName: string; // الشريك (e.g. "علي بن علي (2)", "لا شيء (60)")
  currencyTotal?: number;
  debitTotal: number;
  creditTotal: number;
  remainingTotal: number;
  items: ReconciliationItem[];
}

export interface ReconciliationAccountGroup {
  accountId: string; // الحساب (e.g. "121000 حساب مدين (2)", "211000 حساب الدائن (60)")
  accountName: string;
  currencyTotal?: number;
  debitTotal: number;
  creditTotal: number;
  remainingTotal: number;
  partnerGroups: ReconciliationPartnerGroup[];
}
