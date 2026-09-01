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
  fiscalYears: '/accounting/fiscal-years',
  periods: '/accounting/periods',
  taxes: '/accounting/taxes',
  currencies: '/accounting/currencies',
} as const;
