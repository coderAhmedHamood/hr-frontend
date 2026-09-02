/**
 * Accounting app routes (URLs under /accounting/…).
 * Sub-route pages are not built yet — the `[...slug]` catch-all lands them on the module home.
 */
export const accountingRoutes = {
  overview: '/accounting',

  /** العملاء */
  customerInvoices: '/accounting/customers/invoices',
  customerCreditNotes: '/accounting/customers/credit-notes',
  customerPayments: '/accounting/customers/payments',
  customerProducts: '/accounting/customers/products',
  customers: '/accounting/customers',

  /** الموردين */
  vendorBills: '/accounting/vendors/bills',
  vendorRefunds: '/accounting/vendors/refunds',
  vendorPayments: '/accounting/vendors/payments',
  vendorProducts: '/accounting/vendors/products',
  vendors: '/accounting/vendors',

  /** المحاسبة */
  journalEntries: '/accounting/accounting/journal-entries',
  journalItems: '/accounting/accounting/journal-items',
  generalLedger: '/accounting/accounting/general-ledger',
  partnerLedger: '/accounting/accounting/partner-ledger',
  reconciliation: '/accounting/accounting/reconciliation',

  /** مراجعة */
  reviewReconciliation: '/accounting/review/reconciliation',
  reviewEntries: '/accounting/review/entries',

  /** إعداد التقارير */
  profitAndLoss: '/accounting/reporting/profit-loss',
  balanceSheet: '/accounting/reporting/balance-sheet',
  cashFlow: '/accounting/reporting/cash-flow',
  taxReport: '/accounting/reporting/tax-report',
  trialBalance: '/accounting/reporting/trial-balance',
  agedReceivables: '/accounting/reporting/aged-receivables',
  agedPayables: '/accounting/reporting/aged-payables',

  /** التهيئة */
  chartOfAccounts: '/accounting/chart-of-accounts',
  chartOfAccountNew: '/accounting/chart-of-accounts/new',
  chartOfAccountDetail: (accountId: string) => `/accounting/chart-of-accounts/${accountId}`,
  journals: '/accounting/journals',
  journalNew: '/accounting/journals/new',
  journalDetail: (journalId: string) => `/accounting/journals/${journalId}`,
  fiscalPositions: '/accounting/fiscal-positions',
  fiscalPositionNew: '/accounting/fiscal-positions/new',
  fiscalPositionDetail: (id: string) => `/accounting/fiscal-positions/${id}`,
  ledgers: '/accounting/ledgers',
  fiscalYears: '/accounting/fiscal-years',
  periods: '/accounting/periods',
  taxes: '/accounting/taxes',
  taxNew: '/accounting/taxes/new',
  taxDetail: (taxId: string) => `/accounting/taxes/${taxId}`,
  currencies: '/accounting/currencies',
  currencyNew: '/accounting/currencies/new',
  currencyDetail: (currencyId: string) => `/accounting/currencies/${currencyId}`,
};
