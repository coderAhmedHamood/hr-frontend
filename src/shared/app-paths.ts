import { isEcommerceAdminNavPath } from '@/features/ecommerce/admin/constants/nav';
import { isInventoryAdminNavPath } from '@/features/inventory/admin/constants/nav';

/** True when the current route belongs to the HR application. */
export function isHrAppPath(pathname: string): boolean {
  return pathname === '/hr' || pathname.startsWith('/hr/');
}

/** True when the current route belongs to the System application. */
export function isSystemAppPath(pathname: string): boolean {
  return pathname === '/system' || pathname.startsWith('/system/');
}

/** True on the applications launcher home page. */
export function isLauncherPath(pathname: string): boolean {
  return pathname === '/';
}

/**
 * True when the current route belongs to the Ecommerce admin module.
 * Routes carry no `/ecommerce` prefix — kept in sync via `isEcommerceAdminNavPath`.
 */
export function isEcommerceAppPath(pathname: string): boolean {
  return isEcommerceAdminNavPath(pathname);
}

/** True when the current route belongs to the standalone Inventory application. */
export function isInventoryAppPath(pathname: string): boolean {
  return isInventoryAdminNavPath(pathname);
}
