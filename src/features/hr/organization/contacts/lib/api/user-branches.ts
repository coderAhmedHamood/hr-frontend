import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { UserBranchLink } from '@/features/hr/organization/lib/api/users';

export type AssignUserBranchDto = {
  branchId: string;
  isDefault?: boolean;
  isActive?: boolean;
  createdBy?: string | null;
};

export type UpdateUserBranchDto = {
  isActive?: boolean;
  isDefault?: boolean;
  updatedBy?: string | null;
};

export type UserBranchesListQuery = {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'all';
};

export const userBranchesApi = {
  list(userId: string, query?: UserBranchesListQuery) {
    return apiRequest<PaginatedResult<UserBranchLink>>(`/users/${userId}/branches`, { query });
  },
  assign(userId: string, payload: AssignUserBranchDto) {
    return apiRequest<UserBranchLink>(`/users/${userId}/branches`, { method: 'POST', body: payload });
  },
  update(userId: string, assignmentId: string, payload: UpdateUserBranchDto) {
    return apiRequest<UserBranchLink>(`/users/${userId}/branches/${assignmentId}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(assignmentId: string) {
    return apiRequest<void>(`/users/branches/${assignmentId}`, { method: 'DELETE' });
  },
};
