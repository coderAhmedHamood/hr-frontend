import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';
import type { RequestApprovalMode, RequestApprovalAssignmentRequestType, RequestApprovalAssignmentApprover, RequestApprovalTemplateResponseDto, CreateRequestApprovalTemplateDto, UpdateRequestApprovalTemplateDto, RequestApprovalStage } from '@/features/hr/requests/types/api/approval-templates';
export type { RequestApprovalMode, RequestApprovalAssignmentRequestType, RequestApprovalAssignmentApprover, RequestApprovalTemplateResponseDto, CreateRequestApprovalTemplateDto, UpdateRequestApprovalTemplateDto, RequestApprovalStage } from '@/features/hr/requests/types/api/approval-templates';







// keep old alias used by some imports

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

