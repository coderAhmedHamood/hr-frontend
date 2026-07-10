import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type PermissionResponseDto = {
  id: string;
  applicationId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  nodeType: 'GROUP' | 'ACTION';
  action: string | null;
  resource: string | null;
  parentId: string | null;
  sortOrder: number;
  isSystem: boolean;
  status: string;
};

export type PermissionListQuery = {
  limit?: number;
  page?: number;
  applicationId?: string;
};

export const permissionsApi = {
  getAll(query?: PermissionListQuery) {
    return apiRequest<PaginatedResult<PermissionResponseDto>>('/permissions', { query });
  },
};
