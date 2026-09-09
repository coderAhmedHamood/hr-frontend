/**
 * Accounting app routes (URLs under /accounting/…).
 * Sub-route pages are not built yet — the `[...slug]` catch-all lands them on the module home.
 */
export const accountingRoutes = {
  overview: '/accounting',

  /** العملاء */
  customerInvoices: '/accounting/customers/invoices',
  customerInvoiceNew: '/accounting/customers/invoices/new',
  customerInvoiceDetail: (id: string) => `/accounting/customers/invoices/${id}`,
  customerCreditNotes: '/accounting/customers/credit-notes',
  customerCreditNoteNew: '/accounting/customers/credit-notes/new',
  customerCreditNoteDetail: (id: string) => `/accounting/customers/credit-notes/${id}`,
  customerPayments: '/accounting/customers/payments',
  customerPaymentNew: '/accounting/customers/payments/new',
  customerPaymentDetail: (id: string) => `/accounting/customers/payments/${id}`,
  customerProducts: '/accounting/customers/products',
  customerProductNew: '/accounting/customers/products/new',
  customerProductDetail: (id: string) => `/accounting/customers/products/${id}`,
  customers: '/accounting/customers',
  customerNew: '/accounting/customers/new',
  customerDetail: (id: string) => `/accounting/customers/${id}`,

  /** الموردين */
  vendorBills: '/accounting/vendors/bills',
  vendorBillNew: '/accounting/vendors/bills/new',
  vendorBillDetail: (id: string) => `/accounting/vendors/bills/${id}`,
  vendorRefunds: '/accounting/vendors/refunds',
  vendorRefundNew: '/accounting/vendors/refunds/new',
  vendorRefundDetail: (id: string) => `/accounting/vendors/refunds/${id}`,
  vendorPayments: '/accounting/vendors/payments',
  vendorPaymentNew: '/accounting/vendors/payments/new',
  vendorPaymentDetail: (id: string) => `/accounting/vendors/payments/${id}`,
  vendorProducts: '/accounting/vendors/products',
  vendorProductNew: '/accounting/vendors/products/new',
  vendorProductDetail: (id: string) => `/accounting/vendors/products/${id}`,
  vendors: '/accounting/vendors',
  vendorNew: '/accounting/vendors/new',
  vendorDetail: (id: string) => `/accounting/vendors/${id}`,

  /** المحاسبة */
  journalEntries: '/accounting/journal-entries',
  journalEntryNew: '/accounting/journal-entries/new',
  journalEntryDetail: (id: string) => `/accounting/journal-entries/${id}`,
  fixedAssets: '/accounting/fixed-assets',
  fixedAssetNew: '/accounting/fixed-assets/new',
  fixedAssetDetail: (id: string) => `/accounting/fixed-assets/${id}`,
  generalLedger: '/accounting/general-ledger',
  partnerLedger: '/accounting/partner-ledger',
  reconciliation: '/accounting/reconciliation',

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
