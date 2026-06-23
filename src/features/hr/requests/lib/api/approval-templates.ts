import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type RequestApprovalMode = 'sequential' | 'parallel' | 'any_one' | 'optional';

export type RequestApprovalAssignmentRequestType = {
  id: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  requestTypeSlug: string;
  requestTypeCategory: string | null;
  sortOrder: number;
};

export type RequestApprovalAssignmentApprover = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string | null;
  sortOrder: number;
};

export type RequestApprovalTemplateResponseDto = {
  id: string;
  companyId: string;
  nameAr: string | null;
  approvalMode: RequestApprovalMode;
  displayOrder: number;
  isActive: boolean;
  isArchived?: boolean;
  archivedAt?: string | null;
  notes: string | null;
  requestTypes: RequestApprovalAssignmentRequestType[];
  approvers: RequestApprovalAssignmentApprover[];
  isCurrentUserApprover?: boolean;
  currentUserEmployeeId?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateRequestApprovalTemplateDto = {
  companyId: string;
  nameAr?: string | null;
  approvalMode: RequestApprovalMode;
  displayOrder?: number;
  isActive?: boolean;
  notes?: string | null;
  requestTypes: { requestTypeId: string; sortOrder?: number }[];
  approvers: { employeeId: string; sortOrder?: number }[];
  createdBy?: string | null;
};

export type UpdateRequestApprovalTemplateDto = {
  nameAr?: string | null;
  approvalMode?: RequestApprovalMode;
  displayOrder?: number;
  isActive?: boolean;
  notes?: string | null;
  requestTypes?: { requestTypeId: string; sortOrder?: number }[];
  approvers?: { employeeId: string; sortOrder?: number }[];
  updatedBy?: string | null;
};

// keep old alias used by some imports
export type RequestApprovalStage = never;

export const requestApprovalTemplatesApi = {
  getAll(query?: {
    companyId?: string;
    isActive?: boolean;
    archiveScope?: OrganizationArchiveScope;
    limit?: number;
    page?: number;
  }) {
    return apiRequest<PaginatedResult<RequestApprovalTemplateResponseDto>>(
      '/requests/approval-assignments',
      { query },
    );
  },
  create(payload: CreateRequestApprovalTemplateDto) {
    return apiRequest<RequestApprovalTemplateResponseDto>('/requests/approval-assignments', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateRequestApprovalTemplateDto) {
    return apiRequest<RequestApprovalTemplateResponseDto>(`/requests/approval-assignments/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/requests/approval-assignments/${id}`, { method: 'DELETE' });
  },
  getByRequestCategory(requestCategory: string, companyId: string) {
    return apiRequest<RequestApprovalTemplateResponseDto>(
      `/requests/approval-assignments/by-request-category/${requestCategory}`,
      { query: { companyId } },
    );
  },
};
