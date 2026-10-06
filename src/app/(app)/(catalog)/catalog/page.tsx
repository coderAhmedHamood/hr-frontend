import { redirect } from 'next/navigation';
import { catalogAdminRoutes } from '@/features/catalog/constants/routes';

export default function Page() {
  redirect(catalogAdminRoutes.products);
}
