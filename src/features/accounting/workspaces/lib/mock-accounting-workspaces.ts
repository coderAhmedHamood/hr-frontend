import type {
  AccountingWorkspaceRow,
  AccountingWorkspaceStatus,
} from '@/features/accounting/workspaces/types/accounting-workspace';

const ACCOUNTS = [
  ['110100', 'النقدية بالصندوق'],
  ['111200', 'البنك التجاري'],
  ['121000', 'حسابات العملاء'],
  ['211000', 'حسابات الموردين'],
  ['220000', 'ضريبة القيمة المضافة'],
  ['400000', 'إيرادات المبيعات'],
  ['510000', 'تكلفة المبيعات'],
  ['610000', 'المصروفات التشغيلية'],
] as const;

const PARTNERS = [
  'شركة الأفق للتجارة',
  'مؤسسة التقنية المتقدمة',
  'مجموعة الرياض',
  'شركة النور للخدمات',
  'مؤسسة الإمداد الحديث',
  'شركة المدار',
] as const;

const CATEGORIES = [
  'مبيعات',
  'مشتريات',
  'بنك',
  'نقدية',
  'ضرائب',
  'مصروفات',
] as const;

const STATUSES: AccountingWorkspaceStatus[] = ['posted', 'open', 'reconciled', 'draft'];

export const ACCOUNTING_WORKSPACE_ROWS: AccountingWorkspaceRow[] = Array.from(
  { length: 24 },
  (_, index) => {
    const account = ACCOUNTS[index % ACCOUNTS.length];
    const amount = 1250 + index * 735.5;
    const debit = index % 2 === 0 ? amount : 0;
    const credit = index % 2 === 0 ? 0 : amount;

    return {
      id: String(index + 1),
      reference: `JE/2026/${String(index + 1).padStart(5, '0')}`,
      account: `${account[0]} — ${account[1]}`,
      partner: PARTNERS[index % PARTNERS.length],
      category: CATEGORIES[index % CATEGORIES.length],
      status: STATUSES[index % STATUSES.length],
      debit,
      credit,
      balance: debit - credit,
      date: `2026-${String((index % 8) + 1).padStart(2, '0')}-${String((index % 24) + 1).padStart(2, '0')}`,
    };
  },
);
