import type { TaxGroup } from '@/features/accounting/domain/types/tax-group';

export const MOCK_TAX_GROUPS: TaxGroup[] = [
  {
    id: 'tg-15',
    name: 'ضريبة 15%',
    country: 'الولايات المتحدة',
    taxPayableAccount: '252000 الضريبة مستحقة الدفع',
    taxReceivableAccount: '132000 الضريبة مستحقة القبض',
    advanceTaxAccount: '',
    sequence: 10,
    posReceiptTitle: '',
    precedingSubtotal: '',
  },
  {
    id: 'tg-0',
    name: '0% ضريبة',
    country: 'الولايات المتحدة',
    taxPayableAccount: '252000 الضريبة مستحقة الدفع',
    taxReceivableAccount: '132000 الضريبة مستحقة القبض',
    advanceTaxAccount: '',
    sequence: 20,
    posReceiptTitle: '',
    precedingSubtotal: '',
  },
];
