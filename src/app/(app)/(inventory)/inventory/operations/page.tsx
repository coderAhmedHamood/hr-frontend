import { redirect } from 'next/navigation';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';

/** المسار القديم — يُحوَّل لأول صفحة عمليات مستقلة */
export default function InventoryOperationsIndexPage() {
  redirect(inventoryAdminRoutes.transfers);
}
