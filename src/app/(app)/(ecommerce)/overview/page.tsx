import { redirect } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

/** Legacy overview URL — store admin home is orders Kanban. */
export default function EcommerceOverviewPage() {
  redirect(ecommerceAdminRoutes.orders);
}
