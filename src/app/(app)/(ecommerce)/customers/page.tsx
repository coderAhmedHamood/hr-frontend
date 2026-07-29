import { redirect } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

/** Customers removed from store admin — orders carry buyer info inline. */
export default function CustomersRedirectPage() {
  redirect(ecommerceAdminRoutes.orders);
}
