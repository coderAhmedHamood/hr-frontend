import { apiRequest } from '@/features/hr/lib/api/client';

export type ContactsCompanySettings = {
  id: string;
  companyId: string;
  notificationsEnabled: boolean;
  notifyPartnerCreated: boolean;
  notifyPartnerRegistered: boolean;
  notifyPartnerStatusChanged: boolean;
  notifyPartnerActivityCreated: boolean;
  notifyPartnerNoteCreated: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UpdateContactsCompanySettingsDto = Partial<
  Pick<
    ContactsCompanySettings,
    | 'notificationsEnabled'
    | 'notifyPartnerCreated'
    | 'notifyPartnerRegistered'
    | 'notifyPartnerStatusChanged'
    | 'notifyPartnerActivityCreated'
    | 'notifyPartnerNoteCreated'
  >
> & {
  updatedBy?: string;
};

export const contactsSettingsApi = {
  getByCompanyId(companyId: string) {
    return apiRequest<ContactsCompanySettings>(`/contacts/settings/company/${companyId}`);
  },

  update(companyId: string, dto: UpdateContactsCompanySettingsDto) {
    return apiRequest<ContactsCompanySettings>(`/contacts/settings/company/${companyId}`, {
      method: 'PATCH',
      body: dto,
    });
  },
};
