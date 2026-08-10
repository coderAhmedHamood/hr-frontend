import { redirect } from 'next/navigation';
import { ecommerceContentHref } from '@/features/ecommerce/admin/constants/routes';

/** FAQ belongs under Website → Content. */
export default function Page() {
  redirect(ecommerceContentHref('faq'));
}
