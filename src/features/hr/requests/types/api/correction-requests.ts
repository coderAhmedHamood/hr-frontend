import type {
  RequestApprovalAssignmentCatalogDto,
  RequestApprovalAssignmentDto,
  RequestApproverDecisionOverlayDto,
  RequestApproverStatesSnapshot,
} from '@/features/hr/requests/types/api/request-approver-states-types';

export type { RequestApprovalAssignmentCatalogDto, RequestApproverDecisionOverlayDto };

export type CorrectionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type CorrectionPeriodPunchesDto = {
  checkInAt: string | null;
  checkOutAt: string | null;
};

export type CorrectionPeriodTimeDto = {
  periodId: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  /** @deprecated legacy nested punches — read-only from old payloads */
  recorded?: CorrectionPeriodPunchesDto;
  corrected?: CorrectionPeriodPunchesDto;
};

export type CorrectionTimesDto = {
  periods: CorrectionPeriodTimeDto[];
};

export type ApiCorrectionRequest = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  subtypeSlug: string | null;
  subtypeNameAr: string | null;
  attendanceDaySummaryId: string | null;
  departmentNameAr: string | null;
  workDate: string;
  previousCheckInAt: string | null;
  previousCheckOutAt: string | null;
  previousStatus: string | null;
  correctedCheckInAt: string | null;
  correctedCheckOutAt: string | null;
  correctedTimes?: CorrectionTimesDto | null;
  reasonAr: string | null;
  decisionNotesAr: string | null;
  attachments: unknown[];
  status: CorrectionRequestStatus;
  approverStates?: RequestApproverStatesSnapshot | null;
  approver_states?: RequestApproverStatesSnapshot | null;
  approvalAssignment?: RequestApprovalAssignmentDto | null;
  approvalAssignmentId?: string | null;
  approverDecisions?: RequestApproverDecisionOverlayDto[] | null;
  submittedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
  decidedByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCorrectionRequestDto = {
  companyId: string;
  employeeId: string;
  requestTypeId: string;
  subtypeSlug?: string;
  attendanceDaySummaryId?: string;
  workDate: string;
  correctedTimes?: CorrectionTimesDto;
  reasonAr: string;
  attachments?: unknown[];
  createdBy?: string;
};

export type UpdateCorrectionRequestDto = {
  subtypeSlug?: string | null;
  correctedTimes?: CorrectionTimesDto | null;
  reasonAr?: string;
  attachments?: unknown[];
  updatedBy?: string;
};

export type CorrectionDecisionDto = {
  decision: 'approve' | 'reject';
  approverStates?: RequestApproverStatesSnapshot;
  approverEmployeeId?: string;
  decidedByEmployeeId?: string;
  decisionNotesAr?: string;
  updatedBy?: string;
};

export type CorrectionCancelDto = {
  decisionNotesAr?: string;
  updatedBy?: string;
};

export type LeaveRequestStatusNew = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ApiLeaveRequest = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  leaveTypeId: string;
  leaveTypeNameAr: string;
  subtypeSlug: string | null;
  subtypeNameAr: string | null;
  departmentNameAr: string | null;
  startDate: string;
  endDate: string;
  workingDays: number;
  reasonAr: string | null;
  decisionNotesAr: string | null;
  attachments: unknown[];
  status: LeaveRequestStatusNew;
  approverStates?: RequestApproverStatesSnapshot | null;
  approver_states?: RequestApproverStatesSnapshot | null;
  approvalAssignment?: RequestApprovalAssignmentDto | null;
  approvalAssignmentId?: string | null;
  approverDecisions?: RequestApproverDecisionOverlayDto[] | null;
  submittedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
  decidedByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ApiCorrectionRequestListResponse = {
  items: ApiCorrectionRequest[];
  approvalAssignments: RequestApprovalAssignmentCatalogDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type ApiLeaveRequestListResponse = {
  items: ApiLeaveRequest[];
  approvalAssignments: RequestApprovalAssignmentCatalogDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type CreateLeaveRequestNewDto = {
  companyId: string;
  employeeId: string;
  requestTypeId: string;
  leaveTypeId: string;
  subtypeSlug?: string;
  startDate: string;
  endDate: string;
  workingDays?: number;
  reasonAr?: string;
  attachments?: unknown[];
  createdBy?: string;
};

export type LeaveDecisionDto = {
  decision: 'approve' | 'reject';
  approverStates?: RequestApproverStatesSnapshot;
  approverEmployeeId?: string;
  decidedByEmployeeId?: string;
  decisionNotesAr?: string;
  updatedBy?: string;
};
