import { redirect } from 'next/navigation';
import { ecommerceContentHref } from '@/features/ecommerce/admin/constants/routes';

/** Pages belong under Website → Content. */
export default function Page() {
  redirect(ecommerceContentHref('pages'));
}
