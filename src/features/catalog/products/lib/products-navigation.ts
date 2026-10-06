'use client';

import { usePathname } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';

/**
 * Product screens are mounted three times: the standalone products app (`/catalog/products`),
 * إدارة المتجر (`/products`), and المخازن (`/inventory/products`).
 * Navigation must stay inside the app the user entered from.
 */
export function useProductsBasePath(): string {
  const pathname = usePathname() ?? '';
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return '/catalog/products';
  const inInventoryApp = pathname === '/inventory' || pathname.startsWith('/inventory/');
  return inInventoryApp ? inventoryAdminRoutes.products : ecommerceAdminRoutes.products;
}

export function productDetailHref(basePath: string, productId: string): string {
  return `${basePath}/${productId}`;
}
