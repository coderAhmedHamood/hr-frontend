import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type UserPermissionEffect = 'ALLOW' | 'DENY';

export type UserPermissionResponseDto = {
  id: string;
  userId: string;
  permissionId: string;
  companyId: string;
  branchId: string | null;
  effect: UserPermissionEffect;
  reason: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AssignUserPermissionDto = {
  permissionId: string;
  companyId: string;
  branchId?: string | null;
  effect: UserPermissionEffect;
  reason?: string | null;
  expiresAt?: string | null;
};

export type UpdateUserPermissionDto = {
  effect?: UserPermissionEffect;
  reason?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
};

export const userPermissionsApi = {
  list(userId: string) {
    return apiRequest<PaginatedResult<UserPermissionResponseDto>>(
      `/users/${userId}/permissions`,
      { query: { limit: 500 } },
    );
  },
  assign(userId: string, dto: AssignUserPermissionDto) {
    return apiRequest<UserPermissionResponseDto>(`/users/${userId}/permissions`, {
      method: 'POST',
      body: dto,
    });
  },
  update(userId: string, overlayId: string, dto: UpdateUserPermissionDto) {
    return apiRequest<UserPermissionResponseDto>(
      `/users/${userId}/permissions/${overlayId}`,
      { method: 'PATCH', body: dto },
    );
  },
  remove(overlayId: string) {
    return apiRequest<void>(`/users/permissions/${overlayId}`, { method: 'DELETE' });
  },
};
