import { redirect } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

/** @deprecated Default SEO lives under Website Settings. */
export default function Page() {
  redirect(ecommerceAdminRoutes.settings);
}
