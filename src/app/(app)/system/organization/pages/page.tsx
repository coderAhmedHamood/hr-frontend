import { redirect } from 'next/navigation';
import { systemOrganizationRoutes } from '@/features/system/organization/constants/routes';

export default function SystemOrganizationPagesRootPage() {
  redirect(systemOrganizationRoutes.pagesCompany);
}
