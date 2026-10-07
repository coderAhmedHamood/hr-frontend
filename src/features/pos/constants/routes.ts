/** Point of sale routes. `/pos` belongs to shop sales, so the app lives under `/point-of-sale`. */
export const posRoutes = {
  overview: '/point-of-sale',
  register: '/point-of-sale/register',
  sales: '/point-of-sale/sales',
  returns: '/point-of-sale/returns',
  sessions: '/point-of-sale/sessions',
  registers: '/point-of-sale/registers',
  reports: '/point-of-sale/reports',
  settings: '/point-of-sale/settings',
} as const;

export const POS_APP_CODE = 'pos' as const;
