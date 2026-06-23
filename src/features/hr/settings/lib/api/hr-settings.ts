import { apiRequest } from '@/features/hr/lib/api/client';
import type { HrCompanySettings, UpdateHrCompanySettingsDto } from '@/features/hr/settings/lib/api/types';

export const hrSettingsApi = {
  getByCompanyId(companyId: string) {
    return apiRequest<HrCompanySettings>(`/hr/settings/company/${companyId}`);
  },

  update(companyId: string, dto: UpdateHrCompanySettingsDto) {
    return apiRequest<HrCompanySettings>(`/hr/settings/company/${companyId}`, {
      method: 'PATCH',
      body: dto,
    });
  },
};
