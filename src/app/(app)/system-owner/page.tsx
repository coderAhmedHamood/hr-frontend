import { redirect } from 'next/navigation';
import { systemOwnerRoutes } from '@/features/system-owner/constants/routes';

export default function SystemOwnerIndexPage() {
  redirect(systemOwnerRoutes.companies);
}
