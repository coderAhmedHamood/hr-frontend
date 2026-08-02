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
  navigation: '/cms/navigation',
  banners: '/cms/banners',
  content: '/cms/content',
  settings: '/cms/settings',
  products: '/products',
  categories: '/categories',
  attributes: '/attributes',
  brands: '/brands',
  orders: '/orders',
  customers: '/customers',
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

export type EcommerceContentTab = 'pages' | 'blog' | 'faq';
export type EcommerceNavigationTab = 'header' | 'footer' | 'announcement';

export function ecommerceContentHref(tab: EcommerceContentTab = 'pages'): string {
  return `${ecommerceAdminRoutes.content}?tab=${tab}`;
}

export function ecommerceNavigationHref(tab: EcommerceNavigationTab = 'header'): string {
  return `${ecommerceAdminRoutes.navigation}?tab=${tab}`;
}

/** Former shallow routes — kept only for redirects to domain pages. */
export const ecommerceAdminLegacyRoutes = {
  footer: '/cms/footer',
  cmsPages: '/cms/pages',
  blog: '/cms/blog',
  faq: '/cms/faq',
  seo: '/cms/seo',
} as const;
