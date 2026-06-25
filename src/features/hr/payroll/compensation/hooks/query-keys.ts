export const PAYROLL_SUMMARY_KEYS = {
  all: ['payroll', 'employees-summary'] as const,
  byPeriod: (periodId: string) => ['payroll', 'employees-summary', periodId] as const,
} as const;

export const PAYROLL_PERIOD_KEYS = {
  all: ['payroll', 'period'] as const,
  detail: (periodId: string) => ['payroll', 'period', periodId] as const,
} as const;
