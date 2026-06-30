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

export type RequestApprovalStage = never;
