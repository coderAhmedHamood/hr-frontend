/** Point of sale routes. `/pos` belongs to shop sales, so the app lives under `/point-of-sale`. */
export const posRoutes = {
  overview: '/point-of-sale',
  register: '/point-of-sale/register',
  sales: '/point-of-sale/sales',
  returns: '/point-of-sale/returns',
  sessions: '/point-of-sale/sessions',
  registers: '/point-of-sale/registers',
  analytics: '/point-of-sale/analytics',
  reports: '/point-of-sale/reports',
  settings: '/point-of-sale/settings',
  // The products app's screens, read from it inside نقاط البيع.
  products: '/point-of-sale/products',
  categories: '/point-of-sale/categories',
  attributes: '/point-of-sale/attributes',
  brands: '/point-of-sale/brands',
  catalogUoms: '/point-of-sale/catalog-uoms',
} as const;

export const POS_APP_CODE = 'pos' as const;
