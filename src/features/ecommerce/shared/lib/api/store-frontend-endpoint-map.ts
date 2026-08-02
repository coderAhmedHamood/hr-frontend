/**
 * Map of `store-frontend-endpoints.md` → frontend modules.
 * Use this file to locate the implementation for each contract section.
 *
 * Contract: /store-frontend-endpoints.md
 * Toggle mocks: NEXT_PUBLIC_STORE_HTTP=false · NEXT_PUBLIC_PARTNER_AUTH_HTTP=false
 */
export const STORE_FRONTEND_ENDPOINT_MAP = {
  inventory: {
    doc: '# 1) كتالوج عام (Inventory)',
    module: 'src/features/ecommerce/storefront/lib/repositories/{products,categories,brands}-repository.ts',
    paths: [
      'GET /public/inventory/products',
      'GET /public/inventory/products/by-slug/:slug',
      'GET /public/inventory/categories',
      'GET /public/inventory/categories/by-slug/:slug',
      'GET /public/inventory/brands',
      'GET /public/inventory/brands/by-slug/:slug',
    ],
  },
  publicStore: {
    doc: '# 2) إعدادات ومحتوى المتجر (Public Store)',
    modules: [
      'src/features/ecommerce/storefront/lib/repositories/company-repository.ts',
      'src/features/ecommerce/shared/lib/api/store-pages-api.ts',
      'src/features/ecommerce/shared/lib/api/store-content-api.ts',
      'src/features/ecommerce/shared/lib/api/store-reviews-api.ts',
      'src/features/ecommerce/storefront/lib/repositories/search-repository.ts',
      'src/features/ecommerce/shared/lib/api/store-orders-api.ts',
    ],
  },
  wishlist: {
    doc: '# 3) مفضلة العميل',
    module: 'src/features/ecommerce/shared/lib/api/store-wishlist-api.ts',
  },
  partnerAuth: {
    doc: '# 4) مصادقة عملاء المتجر',
    module: 'src/features/ecommerce/storefront/lib/api/partner-auth-api.ts',
  },
  uploads: {
    doc: '# 5) رفع الملفات',
    module: 'src/features/hr/lib/api/uploads.ts',
  },
  adminSettings: {
    doc: '# 6) إدارة المتجر — إعدادات',
    module: 'src/features/ecommerce/shared/lib/api/store-settings-api.ts',
  },
  adminContent: {
    doc: '# 7) إدارة المتجر — محتوى',
    module: 'src/features/ecommerce/shared/lib/api/store-content-api.ts',
    ui: 'src/features/ecommerce/admin/cms/content/components/contact-messages-page.tsx → /cms/contact-messages',
  },
  adminPages: {
    doc: '# 8) إدارة المتجر — الصفحة الرئيسية',
    module: 'src/features/ecommerce/shared/lib/api/store-pages-api.ts',
  },
  adminOrders: {
    doc: '# 9) إدارة المتجر — الطلبات',
    module: 'src/features/ecommerce/shared/lib/api/store-orders-api.ts',
  },
} as const;
