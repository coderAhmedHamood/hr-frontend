import { redirect } from 'next/navigation';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export default function OrganizationPagesRootPage() {
  redirect(hrOrganizationRoutes.pagesHr);
}
