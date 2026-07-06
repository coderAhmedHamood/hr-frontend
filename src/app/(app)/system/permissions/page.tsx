import { redirect } from 'next/navigation';
import { systemPermissionsRolesHref } from '@/features/system/permissions/constants/routes';

export default function SystemPermissionsIndexPage() {
  redirect(systemPermissionsRolesHref());
}
