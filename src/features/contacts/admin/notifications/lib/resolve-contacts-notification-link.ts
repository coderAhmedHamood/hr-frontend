import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';

type NotificationLinkInput = {
  actionUrl?: string | null;
  sourceKind?: string | null;
  sourceTable?: string | null;
  sourceId?: string | null;
};

const PARTNER_TAB_BY_TABLE: Record<string, string> = {
  partner_activities: 'activities',
  partner_notes: 'notes',
};

/** Prefer backend actionUrl; then sourceTable + sourceId; then sourceKind fallback. */
export function resolveContactsNotificationLink(input: NotificationLinkInput): string | null {
  if (input.actionUrl?.trim()) return input.actionUrl;

  if (input.sourceTable === 'partners' && input.sourceId) {
    return contactsAdminRoutes.partnerDetail(input.sourceId);
  }

  const tab = input.sourceTable ? PARTNER_TAB_BY_TABLE[input.sourceTable] : undefined;
  if (tab && input.sourceId) {
    return `${contactsAdminRoutes.partnerDetail(input.sourceId)}?tab=${tab}`;
  }

  if (input.sourceKind?.startsWith('contacts_partner_') && input.sourceId) {
    const partnerTab =
      input.sourceKind === 'contacts_partner_activity_created'
        ? 'activities'
        : input.sourceKind === 'contacts_partner_note_created'
          ? 'notes'
          : undefined;
    if (partnerTab) {
      return `${contactsAdminRoutes.partnerDetail(input.sourceId)}?tab=${partnerTab}`;
    }
    return contactsAdminRoutes.partnerDetail(input.sourceId);
  }

  return contactsAdminRoutes.partners;
}
