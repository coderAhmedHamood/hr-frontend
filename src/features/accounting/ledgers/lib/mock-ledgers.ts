import type { LedgerGroup } from '@/features/accounting/domain/types/ledger-group';

export const MOCK_LEDGER_GROUPS: LedgerGroup[] = [
  {
    id: 'lg-1',
    name: 'IFRS',
    excludedJournals: ['المشتريات'],
  },
];

export const AVAILABLE_JOURNALS = [
  'المبيعات',
  'المشتريات',
  'البنك',
  'عمليات متنوعة',
  'الفرق في سعر الصرف',
  'ضرائب بأساس نقدي',
  'تقييم المخزون',
  'Tax Returns',
];
