import { create } from 'zustand';
import type { ChartAccount } from '@/features/accounting/domain/types/chart-account';
import { MOCK_CHART_ACCOUNTS } from '@/features/accounting/chart-of-accounts/lib/mock-chart-accounts';

type ChartAccountsState = {
  accounts: ChartAccount[];
  /** إضافة أو تحديث حساب حسب المعرّف. */
  save: (account: ChartAccount) => void;
  remove: (id: string) => void;
};

function byCode(a: ChartAccount, b: ChartAccount) {
  return a.code.localeCompare(b.code);
}

/**
 * مخزن مؤقت في الذاكرة يقوم مقام الـ API حتى تتوفّر خدمة المحاسبة —
 * يحفظ التعديلات بين صفحة القائمة وصفحة الحساب خلال نفس الجلسة.
 */
export const useChartAccountsStore = create<ChartAccountsState>((set) => ({
  accounts: MOCK_CHART_ACCOUNTS,
  save: (account) =>
    set((state) => {
      const exists = state.accounts.some((item) => item.id === account.id);
      const accounts = exists
        ? state.accounts.map((item) => (item.id === account.id ? account : item))
        : [...state.accounts, account];
      return { accounts: [...accounts].sort(byCode) };
    }),
  remove: (id) => set((state) => ({ accounts: state.accounts.filter((item) => item.id !== id) })),
}));
