import { redirect } from 'next/navigation';
import { ecommerceContentHref } from '@/features/ecommerce/admin/constants/routes';

/** Blog belongs under Website → Content. */
export default function Page() {
  redirect(ecommerceContentHref('blog'));
}
