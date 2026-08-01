import { redirect } from 'next/navigation';
import { ecommerceNavigationHref } from '@/features/ecommerce/admin/constants/routes';

/** Legacy footer route — footer links come from CMS pages; announcement lives here. */
export default function Page() {
  redirect(ecommerceNavigationHref('announcement'));
}
