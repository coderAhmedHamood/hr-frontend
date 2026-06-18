import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type UserRoleResponseDto = {
  id: string;
  userId: string;
  roleId: string;
  companyId: string;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssignUserRoleDto = {
  roleId: string;
  isActive?: boolean;
  expiresAt?: string | null;
};

export type UpdateUserRoleDto = {
  isActive?: boolean;
  expiresAt?: string | null;
};

export type UserRolesListQuery = {
  page?: number;
  limit?: number;
};

export const userRolesApi = {
  list(userId: string, query?: UserRolesListQuery) {
    return apiRequest<PaginatedResult<UserRoleResponseDto>>(
      `/users/${userId}/roles`,
      { query: { limit: 200, ...query } },
    );
  },
  assign(userId: string, dto: AssignUserRoleDto) {
    return apiRequest<UserRoleResponseDto>(`/users/${userId}/roles`, {
      method: 'POST',
      body: dto,
    });
  },
  update(userId: string, assignmentId: string, dto: UpdateUserRoleDto) {
    return apiRequest<UserRoleResponseDto>(`/users/${userId}/roles/${assignmentId}`, {
      method: 'PATCH',
      body: dto,
    });
  },
  revoke(assignmentId: string) {
    return apiRequest<void>(`/users/roles/${assignmentId}`, { method: 'DELETE' });
  },
};
