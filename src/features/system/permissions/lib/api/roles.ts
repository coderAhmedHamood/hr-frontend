import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type RoleResponseDto = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  /** Some serialisers surface this as 'name' — keep both for compatibility */
  name?: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  isDefault: boolean;
  status: string;
  companyId: string | null;
  applicationId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RolePermissionResponseDto = {
  id: string;
  roleId: string;
  permissionId: string;
  permission?: { id: string; code: string; nameAr: string; resource: string | null; action: string | null };
};

export type RoleListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
};

export type CreateRoleDto = {
  nameAr: string;
  nameEn?: string;
  code: string;
  description?: string;
  companyId: string;
  applicationId?: string;
};

export type UpdateRoleDto = {
  nameAr?: string;
  nameEn?: string;
  description?: string;
};

export const rolesApi = {
  getAll(query?: RoleListQuery) {
    return apiRequest<PaginatedResult<RoleResponseDto>>('/roles', { query });
  },
  getById(id: string) {
    return apiRequest<RoleResponseDto>(`/roles/${id}`);
  },
  create(dto: CreateRoleDto) {
    return apiRequest<RoleResponseDto>('/roles', { method: 'POST', body: dto });
  },
  update(id: string, dto: UpdateRoleDto) {
    return apiRequest<RoleResponseDto>(`/roles/${id}`, { method: 'PATCH', body: dto });
  },
  delete(id: string) {
    return apiRequest<void>(`/roles/${id}`, { method: 'DELETE' });
  },
  getPermissions(roleId: string) {
    return apiRequest<PaginatedResult<RolePermissionResponseDto>>(
      `/roles/${roleId}/permissions`,
      { query: { limit: 500 } },
    );
  },
  bulkAssignPermissions(
    roleId: string,
    permissionIds: string[],
    createdBy?: string | null,
  ) {
    const actor = createdBy?.trim() || undefined;
    return apiRequest<void>(`/roles/${roleId}/permissions/bulk`, {
      method: 'POST',
      body: {
        permissions: permissionIds.map((permissionId) => ({
          permissionId,
          ...(actor ? { createdBy: actor } : {}),
        })),
      },
    });
  },
  removePermission(rolePermissionId: string) {
    return apiRequest<void>(`/roles/permissions/${rolePermissionId}`, { method: 'DELETE' });
  },
};
