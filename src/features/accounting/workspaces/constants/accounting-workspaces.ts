import type { AccountingWorkspaceKey } from '@/features/accounting/workspaces/types/accounting-workspace';

export interface AccountingWorkspaceConfig {
  key: AccountingWorkspaceKey;
  iconName: string;
  partnerKind: 'customer' | 'vendor' | 'all';
  category: 'entries' | 'ledger' | 'review' | 'report';
}

export const ACCOUNTING_WORKSPACES: Record<string, AccountingWorkspaceConfig> = {
  'accounting/journal-entries': {
    key: 'journalEntries',
    iconName: 'ListOrdered',
    partnerKind: 'all',
    category: 'entries',
  },
  'accounting/journal-items': {
    key: 'journalItems',
    iconName: 'FileStack',
    partnerKind: 'all',
    category: 'entries',
  },
  'accounting/general-ledger': {
    key: 'generalLedger',
    iconName: 'BookOpen',
    partnerKind: 'all',
    category: 'ledger',
  },
  'accounting/partner-ledger': {
    key: 'partnerLedger',
    iconName: 'Users',
    partnerKind: 'all',
    category: 'ledger',
  },
  'accounting/reconciliation': {
    key: 'reconciliation',
    iconName: 'CheckSquare',
    partnerKind: 'all',
    category: 'review',
  },
  'review/reconciliation': {
    key: 'reviewReconciliation',
    iconName: 'CheckSquare',
    partnerKind: 'all',
    category: 'review',
  },
  'review/entries': {
    key: 'reviewEntries',
    iconName: 'FileText',
    partnerKind: 'all',
    category: 'review',
  },
  'reporting/profit-loss': {
    key: 'profitAndLoss',
    iconName: 'TrendingUp',
    partnerKind: 'all',
    category: 'report',
  },
  'reporting/balance-sheet': {
    key: 'balanceSheet',
    iconName: 'Scale',
    partnerKind: 'all',
    category: 'report',
  },
  'reporting/cash-flow': {
    key: 'cashFlow',
    iconName: 'DollarSign',
    partnerKind: 'all',
    category: 'report',
  },
  'reporting/tax-report': {
    key: 'taxReport',
    iconName: 'Percent',
    partnerKind: 'all',
    category: 'report',
  },
  'reporting/trial-balance': {
    key: 'trialBalance',
    iconName: 'FileSpreadsheet',
    partnerKind: 'all',
    category: 'report',
  },
  'reporting/aged-receivables': {
    key: 'agedReceivables',
    iconName: 'PieChart',
    partnerKind: 'customer',
    category: 'report',
  },
  'reporting/aged-payables': {
    key: 'agedPayables',
    iconName: 'PieChart',
    partnerKind: 'vendor',
    category: 'report',
  },
};

export function getAccountingWorkspace(slug: readonly string[]) {
  return ACCOUNTING_WORKSPACES[slug.join('/')];
}
