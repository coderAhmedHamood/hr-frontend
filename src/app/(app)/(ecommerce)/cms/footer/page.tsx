import { redirect } from 'next/navigation';
import { ecommerceNavigationHref } from '@/features/ecommerce/admin/constants/routes';

/** Footer belongs under Website → Appearance / Navigation — not a standalone page. */
export default function Page() {
  redirect(ecommerceNavigationHref('footer'));
}
