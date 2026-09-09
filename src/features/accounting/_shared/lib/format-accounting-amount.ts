import { formatMoneyDigits } from '@/shared/utils';

export function formatAccountingAmount(amount: number, currency: string) {
  return `${formatMoneyDigits(amount)} ${currency}`;
}
