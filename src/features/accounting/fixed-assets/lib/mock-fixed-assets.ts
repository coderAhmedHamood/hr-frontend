import type { FixedAsset } from '@/features/accounting/domain/types/fixed-asset';

export const INITIAL_MOCK_FIXED_ASSETS: FixedAsset[] = [
  {
    id: 'fa-1',
    name: 'كمبيوتر محمول',
    state: 'running',
    originalValue: 250000.0,
    acquisitionDate: '2024-01-01',
    assetModel: 'مجموعة الأصول',

    nonDepreciableValue: 60000.0,
    bookValue: 174000.0,
    depreciableValue: 114000.0,

    method: 'خط مستقيم',
    durationYears: 5,
    calculationMethod: 'فترات ثابتة',
    prorataDate: '2024-01-01',

    fixedAssetAccount: '151000 الأصول الثابتة',
    depreciationAccount: '151000 الأصول الثابتة',
    expenseAccount: '600000 النفقات',
    journalName: 'عمليات متنوعة',

    salvageValue: 0.0,

    depreciationLines: [
      {
        id: 'dl-1',
        date: '2024-12-31',
        reference: 'كمبيوتر محمول: الإهلاك',
        depreciation: 38000.0,
        cumulativeDepreciation: 38000.0,
        depreciableValue: 152000.0,
        journalEntryName: 'المتف/2024/12/0001',
      },
      {
        id: 'dl-2',
        date: '2025-12-31',
        reference: 'كمبيوتر محمول: الإهلاك',
        depreciation: 38000.0,
        cumulativeDepreciation: 76000.0,
        depreciableValue: 114000.0,
        journalEntryName: 'المتف/2025/12/0001',
      },
      {
        id: 'dl-3',
        date: '2026-12-31',
        reference: 'كمبيوتر محمول: الإهلاك',
        depreciation: 38000.0,
        cumulativeDepreciation: 114000.0,
        depreciableValue: 76000.0,
        journalEntryName: '/',
      },
      {
        id: 'dl-4',
        date: '2027-12-31',
        reference: 'كمبيوتر محمول: الإهلاك',
        depreciation: 38000.0,
        cumulativeDepreciation: 152000.0,
        depreciableValue: 38000.0,
        journalEntryName: '/',
      },
      {
        id: 'dl-5',
        date: '2028-12-31',
        reference: 'كمبيوتر محمول: الإهلاك',
        depreciation: 38000.0,
        cumulativeDepreciation: 190000.0,
        depreciableValue: 0.0,
        journalEntryName: '/',
      },
    ],
    invoices: [],
  },
];
