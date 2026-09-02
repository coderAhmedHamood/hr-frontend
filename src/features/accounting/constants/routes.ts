/**
 * Accounting app routes (URLs under /accounting/…).
 * Sub-route pages are not built yet — the `[...slug]` catch-all lands them on the module home.
 */
export const accountingRoutes = {
  overview: '/accounting',
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
