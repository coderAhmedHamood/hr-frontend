export type AccountingWorkspaceKey =
  | 'journalEntries'
  | 'journalItems'
  | 'generalLedger'
  | 'partnerLedger'
  | 'reconciliation'
  | 'reviewReconciliation'
  | 'reviewEntries'
  | 'profitAndLoss'
  | 'balanceSheet'
  | 'cashFlow'
  | 'taxReport'
  | 'trialBalance'
  | 'agedReceivables'
  | 'agedPayables';

export type AccountingWorkspaceStatus = 'draft' | 'posted' | 'open' | 'reconciled';

export interface AccountingWorkspaceRow {
  id: string;
  reference: string;
  account: string;
  partner: string;
  category: string;
  status: AccountingWorkspaceStatus;
  debit: number;
  credit: number;
  balance: number;
  date: string;
}
