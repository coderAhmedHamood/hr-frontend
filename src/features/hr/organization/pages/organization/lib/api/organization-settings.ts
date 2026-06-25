import { apiRequest } from '@/features/hr/lib/api/client';
import type {
  OrganizationCompanySettings,
  UpdateOrganizationCompanySettingsDto,
} from '@/features/hr/organization/pages/_shared/types/settings';

export const organizationSettingsApi = {
  getByCompanyId(companyId: string) {
    return apiRequest<OrganizationCompanySettings>(`/organization/settings/company/${companyId}`);
  },

  update(companyId: string, dto: UpdateOrganizationCompanySettingsDto) {
    return apiRequest<OrganizationCompanySettings>(`/organization/settings/company/${companyId}`, {
      method: 'PATCH',
      body: dto,
    });
  },
};
