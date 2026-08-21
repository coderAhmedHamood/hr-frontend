import { redirect } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

export default function LegacySalesReportsPage() {
  redirect(ecommerceAdminRoutes.reports);
}
