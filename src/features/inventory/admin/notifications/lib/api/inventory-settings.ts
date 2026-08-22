import { apiRequest } from '@/features/hr/lib/api/client';

export type InventoryCompanySettings = {
  id: string;
  companyId: string;
  notificationsEnabled: boolean;
  notifyLowStock: boolean;
  notifyOutOfStock: boolean;
  notifyNegativeStockBlocked: boolean;
  notifyReceiptCompleted: boolean;
  notifyIssueCompleted: boolean;
  notifyTransferCompleted: boolean;
  notifyAdjustmentPosted: boolean;
  notifyPhysicalCountCompleted: boolean;
  notifyScrapPosted: boolean;
  notifyOperationUndone: boolean;
  notifySaleStockDeducted: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

export type UpdateInventoryCompanySettingsDto = Partial<
  Pick<
    InventoryCompanySettings,
    | 'notificationsEnabled'
    | 'notifyLowStock'
    | 'notifyOutOfStock'
    | 'notifyNegativeStockBlocked'
    | 'notifyReceiptCompleted'
    | 'notifyIssueCompleted'
    | 'notifyTransferCompleted'
    | 'notifyAdjustmentPosted'
    | 'notifyPhysicalCountCompleted'
    | 'notifyScrapPosted'
    | 'notifyOperationUndone'
    | 'notifySaleStockDeducted'
  >
> & {
  updatedBy?: string;
};

export const inventorySettingsApi = {
  getByCompanyId(companyId: string) {
    return apiRequest<InventoryCompanySettings>(`/inventory/settings/company/${companyId}`);
  },

  update(companyId: string, dto: UpdateInventoryCompanySettingsDto) {
    return apiRequest<InventoryCompanySettings>(`/inventory/settings/company/${companyId}`, {
      method: 'PATCH',
      body: dto,
    });
  },
};
