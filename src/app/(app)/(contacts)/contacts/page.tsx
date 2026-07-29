import { redirect } from 'next/navigation';
import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';

/** Bare `/contacts` → list entry (avoids relying on a poisoned browser 308 cache). */
export default function ContactsIndexRedirect() {
  redirect(contactsAdminRoutes.overview);
}
