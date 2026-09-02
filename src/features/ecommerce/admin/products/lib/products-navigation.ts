'use client';

import { usePathname } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';

/**
 * Product screens are mounted twice: under إدارة المتجر (`/products`) and under المخازن
 * (`/inventory/products`). Navigation must stay inside the app the user entered from.
 */
export function useProductsBasePath(): string {
  const pathname = usePathname() ?? '';
  const inInventoryApp = pathname === '/inventory' || pathname.startsWith('/inventory/');
  return inInventoryApp ? inventoryAdminRoutes.products : ecommerceAdminRoutes.products;
}

export function productDetailHref(basePath: string, productId: string): string {
  return `${basePath}/${productId}`;
}
