export type LoanState = 'draft' | 'running' | 'closed';

export interface LoanAmortizationLine {
  id: string;
  date: string; // التاريخ (e.g. "30 سبتمبر", "31 أكتوبر 2026", "31 أغسطس 2027")
  debtPrincipal: number; // أصول الديون (e.g. 8,333.33)
  interest: number; // الفوائد (e.g. 0.00)
  payments: number; // المدفوعات (e.g. 8,333.33)
  dueAmount: number; // المبلغ المستحق المتبقي (e.g. 91,666.67 ... 0.04)
}

export interface Loan {
  id: string;
  name: string; // الاسم (e.g. "قرض الترميم", "قرض لشراء المعدات")
  state: LoanState; // مسودة | جاري | مغلق

  borrowedAmount: number; // المبلغ المقترض (e.g. 100,000.00 or 8,000,000.00)
  interestAmount: number; // الفائدة (e.g. 0.00)
  dueAmount: number; // المبلغ المستحق (e.g. 100,000.00 or 3,555,555.60)

  loanDate: string; // تاريخ القرض / تاريخ البدء (e.g. "2026-09-01" / "1 يناير 2025")
  endDate?: string; // تاريخ الانتهاء (e.g. "2027-12-31" / "31 ديسمبر 2027")
  durationMonths: number; // المدة بالشهور (e.g. 12)
  assetModel?: string; // مجموعة الأصول

  // إعدادات القرض (المحاسبة)
  longTermAccount: string; // حساب طويل الأجل (e.g. "221000 قروض طويلة الأجل")
  shortTermAccount: string; // حساب قصير الأجل (e.g. "211000 حساب الدائن")
  expenseAccount: string; // حساب النفقات (e.g. "611000 شراء المعدات")
  journalName: string; // دفتر اليومية (e.g. "البنك")

  skipTo?: string; // تخطي إلى

  amortizationSchedule: LoanAmortizationLine[]; // جدول الاستهلاك
}
