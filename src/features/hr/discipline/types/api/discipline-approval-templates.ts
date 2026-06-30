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

export type ApprovalTemplateStage = never;
