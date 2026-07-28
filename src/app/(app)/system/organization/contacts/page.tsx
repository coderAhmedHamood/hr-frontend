import { redirect } from 'next/navigation';
import { systemOrganizationRoutes } from '@/features/system/organization/constants/routes';

/** الرابط القديم `/system/organization/contacts` كان دليل المستخدمين — نُقل إلى `/users`. */
export default function LegacySystemContactsRedirect() {
  redirect(systemOrganizationRoutes.users);
}
