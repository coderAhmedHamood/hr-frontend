/**
 * Ecommerce admin routes live under the `(ecommerce)` route group inside `(app)`.
 *
 * Inventory moved to the standalone Inventory app — see `inventoryAdminRoutes`.
 * Legacy inventory path helpers are kept as thin aliases for older product dialogs.
 */
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';

export const ecommerceAdminRoutes = {
  overview: '/overview',
  homepage: '/cms/homepage',
  storeSettings: '/cms/store-settings',
  navigation: '/cms/navigation',
  footer: '/cms/footer',
  banners: '/cms/banners',
  content: '/cms/content',
  contactMessages: '/cms/contact-messages',
  whatsapp: '/cms/whatsapp',
  settings: '/cms/settings',
  /** إعدادات إشعارات المتجر — منفصلة عن `/cms/settings` (هوية/SEO). */
  notificationSettings: '/notification-settings',
  products: '/products',
  productDetail: (id: string) => `/products/${id}`,
  categories: '/categories',
  attributes: '/attributes',
  brands: '/brands',
  orders: '/orders',
  reviews: '/reviews',
  /** تقارير المتجر — `/store-admin/reports/*` */
  reports: '/reports',
  /** @deprecated use `reports` */
  salesReports: '/reports',
  /** @deprecated Use inventoryAdminRoutes */
  warehouses: inventoryAdminRoutes.warehouses,
  warehouseDetail: inventoryAdminRoutes.warehouseDetail,
  locations: inventoryAdminRoutes.locations,
  locationsForWarehouse: inventoryAdminRoutes.locationsForWarehouse,
  putawayRules: inventoryAdminRoutes.putawayRules,
  reportStock: inventoryAdminRoutes.reportStock,
  reportDetailedStock: inventoryAdminRoutes.reportDetailedStock,
  reportMoves: inventoryAdminRoutes.reportMoves,
  reportMovesAnalysis: inventoryAdminRoutes.reportMovesAnalysis,
  operations: inventoryAdminRoutes.transfers,
  operationsForKind: inventoryAdminRoutes.operationsForKind,
} as const;

export type EcommerceContentTab = 'pages' | 'faq';
export type EcommerceNavigationTab = 'announcement';
export type EcommerceSettingsTab =
  | 'branding'
  | 'colors'
  | 'contact'
  | 'social'
  | 'locations'
  | 'deliveryRates'
  | 'paymentAccounts'
  | 'seo';

export function ecommerceContentHref(tab: EcommerceContentTab = 'pages'): string {
  return `${ecommerceAdminRoutes.content}?tab=${tab}`;
}

export function ecommerceNavigationHref(tab: EcommerceNavigationTab = 'announcement'): string {
  return `${ecommerceAdminRoutes.navigation}?tab=${tab}`;
}

export function ecommerceSettingsHref(tab: EcommerceSettingsTab = 'branding'): string {
  return `${ecommerceAdminRoutes.settings}?tab=${tab}`;
}
