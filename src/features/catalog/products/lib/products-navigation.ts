'use client';

import { usePathname } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { posRoutes } from '@/features/pos/constants/routes';
import { catalogAdminRoutes } from '@/features/catalog/constants/routes';

/**
 * Product screens are mounted four times: the standalone products app (`/catalog/products`),
 * إدارة المتجر (`/products`), المخازن (`/inventory/products`) and نقاط البيع
 * (`/point-of-sale/products`). Navigation must stay inside the app the user entered from.
 */
export function useProductsBasePath(): string {
  const pathname = usePathname() ?? '';
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return '/catalog/products';
  if (pathname === posRoutes.overview || pathname.startsWith(`${posRoutes.overview}/`)) {
    return posRoutes.products;
  }
  const inInventoryApp = pathname === '/inventory' || pathname.startsWith('/inventory/');
  return inInventoryApp ? inventoryAdminRoutes.products : ecommerceAdminRoutes.products;
}

/** Units of measure in the app the user entered from (not inventory's when it is off). */
export function useCatalogUomsHref(): string {
  const basePath = useProductsBasePath();
  if (basePath === '/catalog/products') return catalogAdminRoutes.uoms;
  if (basePath === posRoutes.products) return posRoutes.catalogUoms;
  if (basePath === inventoryAdminRoutes.products) return inventoryAdminRoutes.catalogUoms;
  return ecommerceAdminRoutes.catalogUoms;
}

export function productDetailHref(basePath: string, productId: string): string {
  return `${basePath}/${productId}`;
}
