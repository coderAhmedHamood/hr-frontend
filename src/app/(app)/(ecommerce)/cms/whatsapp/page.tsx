import { redirect } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

/** WhatsApp opens from the order. This address used to be a settings screen. */
export default function Page() {
  redirect(ecommerceAdminRoutes.orders);
}
