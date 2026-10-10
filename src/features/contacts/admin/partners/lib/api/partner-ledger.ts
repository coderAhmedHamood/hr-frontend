import { apiRequest } from '@/shared/api/client';

/** debit = عليه (owes the company); credit = له (the company owes). */
export type PartnerLedgerDirection = 'debit' | 'credit';

export type PartnerLedgerKind =
  | 'opening_balance'
  | 'invoice'
  | 'payment_received'
  | 'bill'
  | 'payment_made'
  | 'credit_note'
  | 'debit_note'
  | 'adjustment';

export type PartnerLedgerLine = {
  id: string;
  entryDate: string;
  kind: PartnerLedgerKind;
  direction: PartnerLedgerDirection;
  amount: string;
  currencyCode: string;
  description: string;
  reference: string | null;
  sourceApp: string;
  sourceType: string | null;
  sourceId: string | null;
  status: 'posted' | 'void';
  voidReason: string | null;
  voidedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  createdByName: string | null;
  /** Running balance of the currency after this line (null when voided). */
  balanceAfter: string | null;
};

export type PartnerLedgerTotals = {
  partnerId: string;
  currencyCode: string;
  debit: string;
  credit: string;
  /** debit − credit: positive = عليه, negative = له. */
  balance: string;
  entries: number;
};

export type PartnerLedgerStatement = {
  items: PartnerLedgerLine[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  totals: PartnerLedgerTotals[];
};

export type PartnerLedgerQuery = {
  companyId: string;
  partnerId: string;
  from?: string;
  to?: string;
  kind?: PartnerLedgerKind;
  direction?: PartnerLedgerDirection;
  includeVoid?: boolean;
  page?: number;
  limit?: number;
};

export type CreatePartnerLedgerLine = {
  companyId: string;
  partnerId: string;
  entryDate: string;
  kind: PartnerLedgerKind;
  direction?: PartnerLedgerDirection;
  amount: string;
  currencyCode?: string;
  description: string;
  reference?: string;
};

/** What each kind means and which side it takes (null: chosen when entered). */
export const PARTNER_LEDGER_KINDS: ReadonlyArray<{
  value: PartnerLedgerKind;
  label: string;
  hint: string;
  direction: PartnerLedgerDirection | null;
}> = [
  { value: 'invoice', label: 'فاتورة / مطالبة', hint: 'مبلغ مستحق على جهة الاتصال', direction: 'debit' },
  { value: 'payment_received', label: 'دفعة مستلمة منه', hint: 'سدّد جزءاً مما عليه', direction: 'credit' },
  { value: 'bill', label: 'فاتورة مورد / مستحق له', hint: 'مبلغ نستحقه له (توريد أو خدمة)', direction: 'credit' },
  { value: 'payment_made', label: 'دفعة دفعناها له', hint: 'سددنا جزءاً مما له', direction: 'debit' },
  { value: 'credit_note', label: 'إشعار دائن', hint: 'مرتجع أو خصم لصالحه', direction: 'credit' },
  { value: 'debit_note', label: 'إشعار مدين', hint: 'رسوم أو فرق عليه', direction: 'debit' },
  { value: 'opening_balance', label: 'رصيد افتتاحي', hint: 'الرصيد السابق قبل بدء التسجيل', direction: null },
  { value: 'adjustment', label: 'تسوية', hint: 'تصحيح يدوي للرصيد', direction: null },
];

export const PARTNER_LEDGER_KIND_LABELS = Object.fromEntries(
  PARTNER_LEDGER_KINDS.map((k) => [k.value, k.label]),
) as Record<PartnerLedgerKind, string>;

/** Where a line came from (apps that post later add their name here). */
export const PARTNER_LEDGER_SOURCE_LABELS: Record<string, string> = {
  contacts: 'يدوي',
  pos: 'نقاط البيع',
  sales: 'المبيعات',
  purchases: 'المشتريات',
  accounting: 'المحاسبة',
  expenses: 'المصاريف',
  'store-admin': 'المتجر',
};

export const partnerLedgerApi = {
  statement(query: PartnerLedgerQuery) {
    return apiRequest<PartnerLedgerStatement>('/contacts/partner-ledger', {
      query: { ...query },
      throwOnError: true,
    });
  },

  create(input: CreatePartnerLedgerLine) {
    return apiRequest<{ id: string }>('/contacts/partner-ledger', {
      method: 'POST',
      body: input,
    });
  },

  void(id: string, companyId: string, reason: string) {
    return apiRequest<void>(`/contacts/partner-ledger/${id}/void`, {
      method: 'POST',
      body: { companyId, reason },
    });
  },
};
