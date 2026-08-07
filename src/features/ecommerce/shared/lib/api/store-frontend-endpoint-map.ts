/**
 * Map of store binding endpoints → frontend modules.
 * Contract: /store-frontend-binding.md
 * Store HTTP: NEXT_PUBLIC_STORE_HTTP=false disables store APIs (no mock).
 * Partner auth is always HTTP (`/public/partners/auth`).
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
      'src/features/ecommerce/shared/lib/api/store-badges-api.ts',
    ],
  },
  badges: {
    doc: 'GET /public/store/badges — header icon counts',
    module: 'src/features/ecommerce/shared/lib/api/store-badges-api.ts',
    ui: 'src/features/ecommerce/storefront/hooks/use-storefront-badges.ts',
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
    note: 'Stock deduct when admin sets status=shipped. Restore on cancelled/refunded.',
  },
  saleStock: {
    doc: 'POST /inventory/stock/sale-deduct | sale-restore',
    module: 'src/features/inventory/admin/stock/lib/api/sale-stock-api.ts',
    service: 'inventoryStockService.saleDeduct / saleRestore',
    note: 'Ship → sale-deduct (skip if already at place-order). Cancel/refund → sale-restore.',
  },
  adminProductReviews: {
    doc: 'Inventory staff — product reviews CRUD',
    module: 'src/features/ecommerce/admin/reviews/lib/api/product-reviews-api.ts',
    ui: 'src/features/ecommerce/admin/reviews/components/product-reviews-admin-page.tsx → /reviews',
    paths: [
      'GET|POST /inventory/product-reviews',
      'GET|PATCH|DELETE /inventory/product-reviews/:id',
      'GET /public/store/products/:productId/reviews',
    ],
  },
} as const;
