import { redirect } from 'next/navigation';
import { hrPermissionsRolesHref } from '@/features/hr/permissions/constants/routes';

export default function PermissionsIndexPage() {
  redirect(hrPermissionsRolesHref());
}
