import type { PeriodRange } from '@/components/ui/list-filter-bar';

export const EMPTY_ACCOUNTING_DATE_RANGE: PeriodRange = { from: '', to: '' };

export function isAccountingDateInRange(date: string, range: PeriodRange): boolean {
  const day = date.slice(0, 10);
  return (!range.from || day >= range.from) && (!range.to || day <= range.to);
}
