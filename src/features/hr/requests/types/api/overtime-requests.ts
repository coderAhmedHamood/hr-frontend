export type OvertimeRequestStatusDto = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type RequestApprovalCatalogApproverDto = {
  employeeId: string;
  employeeNameAr: string;
  sortOrder: number;
};

export type RequestApprovalAssignmentCatalogDto = {
  id: string;
  approvalMode: 'sequential' | 'parallel';
  approvers: RequestApprovalCatalogApproverDto[];
};

export type RequestApproverDecisionOverlayDto = {
  employeeId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decidedAt: string | null;
  notes: string | null;
};

export type RequestApprovalApproverResponseDto = RequestApprovalCatalogApproverDto & {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  decidedAt: string | null;
  notes: string | null;
};

export type RequestApprovalAssignmentResponseDto = {
  id: string;
  approvalMode: 'sequential' | 'parallel';
  approvers: RequestApprovalApproverResponseDto[];
};

export type OvertimeRequestResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  requestTypeSlug: string;
  requestTypeOfficialSlug: string | null;
  requestCategory: string | null;
  requestCategoryLabelAr: string | null;
  requestCategoryLabelEn: string | null;
  attendanceDaySummaryId: string | null;
  departmentNameAr: string | null;
  workDate: string;
  requestedMinutes: number;
  approvedMinutes: number | null;
  previousOvertimeMinutes: number | null;
  previousOvertimePayrollAllowed: boolean;
  reasonAr: string;
  decisionNotesAr: string | null;
  attachments: Array<Record<string, unknown>> | null;
  status: OvertimeRequestStatusDto;
  approvalAssignment: RequestApprovalAssignmentResponseDto | null;
  submittedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
  decidedByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type OvertimeRequestListItemDto = Omit<OvertimeRequestResponseDto, 'approvalAssignment'> & {
  approvalAssignmentId: string | null;
  approverDecisions: RequestApproverDecisionOverlayDto[] | null;
};

export type OvertimeRequestListResponseDto = {
  items: OvertimeRequestListItemDto[];
  approvalAssignments: RequestApprovalAssignmentCatalogDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type CreateOvertimeRequestDto = {
  companyId: string;
  employeeId: string;
  requestTypeId: string;
  attendanceDaySummaryId?: string;
  workDate: string;
  requestedMinutes: number;
  reasonAr: string;
  attachments?: Array<Record<string, unknown>>;
  createdBy?: string | null;
};

export type UpdateOvertimeRequestDto = {
  requestedMinutes?: number;
  reasonAr?: string;
  attachments?: Array<Record<string, unknown>> | null;
  updatedBy?: string | null;
};

export type DecideOvertimeRequestDto = {
  decision: 'approve' | 'reject';
  approverEmployeeId?: string;
  decidedByEmployeeId?: string;
  approvedMinutes?: number;
  decisionNotesAr?: string | null;
  updatedBy?: string | null;
};

export type CancelOvertimeRequestDto = {
  updatedBy?: string | null;
};

export type OvertimeRequestListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  employeeIds?: string[];
  requestTypeId?: string;
  status?: OvertimeRequestStatusDto;
  workDateFrom?: string;
  workDateTo?: string;
};
