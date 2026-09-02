import type { FiscalPosition } from '@/features/accounting/domain/types/fiscal-position';

export const MOCK_FISCAL_POSITIONS: FiscalPosition[] = [
  {
    id: 'domestic',
    name: 'Domestic',
    autoDetect: true,
    vatRequired: false,
    foreignTaxId: '',
    countryGroups: '',
    country: 'الولايات المتحدة',
    federalStates: '',
    zipFrom: '',
    zipTo: '',
    accountMappings: [
      {
        id: 'am-1',
        originalAccount: '101402 الحساب البنكي المعلق',
        replacementAccount: '101404 المدفوعات المستحقة',
      },
    ],
    taxMappings: [],
  },
  {
    id: 'foreign-trade',
    name: 'Foreign Trade',
    autoDetect: true,
    vatRequired: false,
    foreignTaxId: '',
    countryGroups: '',
    country: '',
    federalStates: '',
    zipFrom: '',
    zipTo: '',
    accountMappings: [],
    taxMappings: [
      {
        id: 'tm-1',
        originalTax: '15%',
        replacementTax: 'Exports 0%',
      },
    ],
  },
];
