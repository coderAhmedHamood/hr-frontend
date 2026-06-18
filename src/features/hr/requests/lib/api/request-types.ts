import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type RequestTypeApprovalStage = {
  order: number;
  nameAr: string;
  nameEn?: string;
  approverKind: 'manager' | 'hr' | 'specific';
  approverIds?: string[];
  isRequired?: boolean;
  meta?: Record<string, unknown>;
};

export type RequestTypeSubtype = {
  slug: string;
  nameAr: string;
  nameEn?: string;
  sortOrder?: number;
  isActive?: boolean;
  meta?: Record<string, unknown>;
};

export type ApiRequestType = {
  id: string;
  companyId: string;
  departmentId: string | null;
  slug: string;
  nameAr: string;
  nameEn: string;
  requestCategory: string;
  approvalAssignmentTemplateId: string | null;
  approvalStages: RequestTypeApprovalStage[];
  subtypes: RequestTypeSubtype[];
  sortOrder: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
};

export type CreateRequestTypeDto = {
  companyId: string;
  departmentId?: string | null;
  slug?: string;
  nameAr: string;
  nameEn?: string;
  requestCategory?: string;
  approvalAssignmentTemplateId?: string | null;
  approvalStages?: RequestTypeApprovalStage[];
  subtypes?: RequestTypeSubtype[];
  sortOrder?: number;
  isActive?: boolean;
  notes?: string;
  createdBy?: string;
};

export type UpdateRequestTypeDto = Partial<Omit<CreateRequestTypeDto, 'companyId' | 'createdBy'>> & {
  updatedBy?: string;
};

export const requestTypesApi = {
  list: (params?: {
    companyId?: string;
    departmentId?: string;
    requestCategory?: string;
    isActive?: boolean;
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
