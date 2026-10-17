'use client';

import { usePathname } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import { posRoutes } from '@/features/pos/constants/routes';

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

export function productDetailHref(basePath: string, productId: string): string {
  return `${basePath}/${productId}`;
}
