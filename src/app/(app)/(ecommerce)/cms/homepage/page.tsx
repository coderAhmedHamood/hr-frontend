import { redirect } from 'next/navigation';
import { ecommerceAdminRoutes } from '@/features/ecommerce/admin/constants/routes';

/** Homepage builder moved into store settings + hero carousel pages. */
export default function Page() {
  redirect(ecommerceAdminRoutes.storeSettings);
}
