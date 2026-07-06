import { redirect } from 'next/navigation';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';

export default function HrModuleHomePage() {
  redirect(hrOrganizationRoutes.employees);
}
