import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';
import type { RequestTypeApprovalStage, RequestTypeSubtype, ApiRequestType, CreateRequestTypeDto, UpdateRequestTypeDto } from '@/features/hr/requests/types/api/request-types';
export type { RequestTypeApprovalStage, RequestTypeSubtype, ApiRequestType, CreateRequestTypeDto, UpdateRequestTypeDto } from '@/features/hr/requests/types/api/request-types';






export const requestTypesApi = {
  list: (params?: {
    companyId?: string;
    departmentId?: string;
    requestCategory?: string;
    isActive?: boolean;
    archiveScope?: OrganizationArchiveScope;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<ApiRequestType>>('/requests/request-types', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<ApiRequestType>(`/requests/request-types/${id}`),

  create: (body: CreateRequestTypeDto) =>
    apiRequest<ApiRequestType>('/requests/request-types', { method: 'POST', body }),

  update: (id: string, body: UpdateRequestTypeDto) =>
    apiRequest<ApiRequestType>(`/requests/request-types/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/requests/request-types/${id}`, { method: 'DELETE' }),
};

