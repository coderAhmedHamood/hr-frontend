import { apiRequest } from '@/features/hr/lib/api/client';

export type StoreCompanySettings = {
  id: string;
  companyId: string;
  notificationsEnabled: boolean;
  notifyOrderPlaced: boolean;
  notifyOrderConfirmed: boolean;
  notifyOrderProcessing: boolean;
  notifyOrderShipped: boolean;
  notifyOrderDelivered: boolean;
  notifyOrderCancelled: boolean;
  notifyOrderRefunded: boolean;
  notifyPaymentUpdated: boolean;
  notifyContactMessageReceived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UpdateStoreCompanySettingsDto = Partial<
  Pick<
    StoreCompanySettings,
    | 'notificationsEnabled'
    | 'notifyOrderPlaced'
    | 'notifyOrderConfirmed'
    | 'notifyOrderProcessing'
    | 'notifyOrderShipped'
    | 'notifyOrderDelivered'
    | 'notifyOrderCancelled'
    | 'notifyOrderRefunded'
    | 'notifyPaymentUpdated'
    | 'notifyContactMessageReceived'
  >
> & {
  updatedBy?: string;
};

export const storeSettingsApi = {
  getByCompanyId(companyId: string) {
    return apiRequest<StoreCompanySettings>(`/store/settings/company/${companyId}`);
  },

  update(companyId: string, dto: UpdateStoreCompanySettingsDto) {
    return apiRequest<StoreCompanySettings>(`/store/settings/company/${companyId}`, {
      method: 'PATCH',
      body: dto,
    });
  },
};
