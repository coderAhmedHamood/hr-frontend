import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { UserCompanyLink } from '@/features/hr/organization/lib/api/users';

export type AssignUserCompanyDto = {
  companyId: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdBy?: string | null;
};

export type UpdateUserCompanyDto = {
  isActive?: boolean;
  isDefault?: boolean;
  updatedBy?: string | null;
};

export type UserCompaniesListQuery = {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'all';
};

export const userCompaniesApi = {
  list(userId: string, query?: UserCompaniesListQuery) {
    return apiRequest<PaginatedResult<UserCompanyLink>>(`/users/${userId}/companies`, { query });
  },
  assign(userId: string, payload: AssignUserCompanyDto) {
    return apiRequest<UserCompanyLink>(`/users/${userId}/companies`, { method: 'POST', body: payload });
  },
  update(userId: string, assignmentId: string, payload: UpdateUserCompanyDto) {
    return apiRequest<UserCompanyLink>(`/users/${userId}/companies/${assignmentId}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(assignmentId: string) {
    return apiRequest<void>(`/users/companies/${assignmentId}`, { method: 'DELETE' });
  },
};
