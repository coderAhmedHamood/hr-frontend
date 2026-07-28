import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';

/** Tenant company id for Contacts / Partners admin. */
export function getContactsCompanyId(): string {
  return getDefaultCompanyId() ?? '';
}
