import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type ApprovalMode = 'sequential' | 'parallel' | 'any_one' | 'optional';

export type DisciplineApprovalAssignmentViolationType = {
  id: string;
  violationTypeId: string;
  violationTypeNameAr: string;
  violationTypeCode: string;
  sortOrder: number;
};

export type DisciplineApprovalAssignmentApprover = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string | null;
  sortOrder: number;
};

export type DisciplineApprovalTemplateResponseDto = {
  id: string;
  companyId: string;
  nameAr: string | null;
  approvalMode: ApprovalMode;
  displayOrder: number;
  isActive: boolean;
  notes: string | null;
  violationTypes: DisciplineApprovalAssignmentViolationType[];
  approvers: DisciplineApprovalAssignmentApprover[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineApprovalTemplateDto = {
  companyId: string;
  nameAr?: string | null;
  approvalMode: ApprovalMode;
  displayOrder?: number;
  isActive?: boolean;
  notes?: string | null;
  violationTypes: { violationTypeId: string; sortOrder?: number }[];
  approvers: { employeeId: string; sortOrder?: number }[];
  createdBy?: string | null;
};

export type UpdateDisciplineApprovalTemplateDto = {
  nameAr?: string | null;
  approvalMode?: ApprovalMode;
  displayOrder?: number;
  isActive?: boolean;
  notes?: string | null;
  violationTypes?: { violationTypeId: string; sortOrder?: number }[];
  approvers?: { employeeId: string; sortOrder?: number }[];
  updatedBy?: string | null;
};

export type DisciplineApprovalTemplateListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
  archiveScope?: OrganizationArchiveScope;
};

// keep old alias so hooks/components don't need rename
export type ApprovalTemplateStage = never;

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
