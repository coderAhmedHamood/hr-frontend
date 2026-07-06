import { apiRequest } from '@/features/hr/lib/api/client';
import type {
  HrCompanySettings,
  UpdateHrCompanySettingsDto,
} from '@/features/system/organization/pages/_shared/types/settings';

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
