import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';
import type { ApprovalMode, DisciplineApprovalAssignmentViolationType, DisciplineApprovalAssignmentApprover, DisciplineApprovalTemplateResponseDto, CreateDisciplineApprovalTemplateDto, UpdateDisciplineApprovalTemplateDto, DisciplineApprovalTemplateListQuery, ApprovalTemplateStage } from '@/features/hr/discipline/types/api/discipline-approval-templates';
export type { ApprovalMode, DisciplineApprovalAssignmentViolationType, DisciplineApprovalAssignmentApprover, DisciplineApprovalTemplateResponseDto, CreateDisciplineApprovalTemplateDto, UpdateDisciplineApprovalTemplateDto, DisciplineApprovalTemplateListQuery, ApprovalTemplateStage } from '@/features/hr/discipline/types/api/discipline-approval-templates';








// keep old alias so hooks/components don't need rename

export const disciplineApprovalTemplatesApi = {
  getAll(query?: DisciplineApprovalTemplateListQuery) {
    return apiRequest<PaginatedResult<DisciplineApprovalTemplateResponseDto>>(
      '/discipline/approval-assignments',
      { query },
    );
  },
  getById(id: string) {
    return apiRequest<DisciplineApprovalTemplateResponseDto>(`/discipline/approval-assignments/${id}`);
  },
  getByViolationType(violationTypeId: string) {
    return apiRequest<DisciplineApprovalTemplateResponseDto>(
      `/discipline/approval-assignments/by-violation-type/${violationTypeId}`,
    );
  },
  create(payload: CreateDisciplineApprovalTemplateDto) {
    return apiRequest<DisciplineApprovalTemplateResponseDto>('/discipline/approval-assignments', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateDisciplineApprovalTemplateDto) {
    return apiRequest<DisciplineApprovalTemplateResponseDto>(`/discipline/approval-assignments/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/approval-assignments/${id}`, { method: 'DELETE' });
  },
};

