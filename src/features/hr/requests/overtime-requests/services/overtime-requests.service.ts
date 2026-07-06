import { formatDurationMinutesAr } from '@/shared/utils';
import type {
  RequestApproverEntryStatus,
  RequestApproverStatesSnapshot,
} from '@/features/hr/requests/types/api/request-approver-states-types';
import type {
  OvertimeRequestResponseDto,
  OvertimeRequestListItemDto,
  RequestApprovalAssignmentCatalogDto,
} from '@/features/hr/requests/types/api/overtime-requests';

export type OvertimeRequestRecord = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  departmentNameAr: string | null;
  workDate: string;
  requestedMinutes: number;
  approvedMinutes: number | null;
  previousOvertimeMinutes: number | null;
  previousOvertimePayrollAllowed: boolean;
  reasonAr: string;
  decisionNotesAr: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approverStates: RequestApproverStatesSnapshot | null;
  submittedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toEntryStatus(status: string): RequestApproverEntryStatus {
  return status === 'approved' || status === 'rejected' ? status : 'pending';
}

/** Adapts the detail-response's merged `approvalAssignment.approvers[]` (identity + decision already combined) to the shared snapshot shape reused across the app's approval UI. */
export function overtimeApprovalAssignmentToStates(
  dto: OvertimeRequestResponseDto,
): RequestApproverStatesSnapshot | null {
  const assignment = dto.approvalAssignment;
  if (!assignment) return null;
  return {
    assignmentId: assignment.id,
    approvalMode: assignment.approvalMode,
    approvers: assignment.approvers.map((a) => ({
      employeeId: a.employeeId,
      employeeNameAr: a.employeeNameAr,
      sortOrder: a.sortOrder,
      status: toEntryStatus(a.status),
      decidedAt: a.decidedAt,
      decidedBy: null,
      notes: a.notes,
    })),
  };
}

/** Adapts a list-item's `approvalAssignmentId` + `approverDecisions` overlay by merging it against the deduplicated `approvalAssignments` catalog returned alongside `items`. */
export function overtimeListItemToStates(
  item: OvertimeRequestListItemDto,
  catalog: RequestApprovalAssignmentCatalogDto[],
): RequestApproverStatesSnapshot | null {
  if (!item.approvalAssignmentId) return null;
  const assignment = catalog.find((a) => a.id === item.approvalAssignmentId);
  if (!assignment) return null;
  const decisionByEmployee = new Map((item.approverDecisions ?? []).map((d) => [d.employeeId, d]));
  return {
    assignmentId: assignment.id,
    approvalMode: assignment.approvalMode,
    approvers: assignment.approvers.map((a) => {
      const decision = decisionByEmployee.get(a.employeeId);
      return {
        employeeId: a.employeeId,
        employeeNameAr: a.employeeNameAr,
        sortOrder: a.sortOrder,
        status: toEntryStatus(decision?.status ?? 'pending'),
        decidedAt: decision?.decidedAt ?? null,
        decidedBy: null,
        notes: decision?.notes ?? null,
      };
    }),
  };
}

export function mapOvertimeRequestDetail(dto: OvertimeRequestResponseDto): OvertimeRequestRecord {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    employeeNameAr: dto.employeeNameAr,
    departmentNameAr: dto.departmentNameAr,
    workDate: dto.workDate,
    requestedMinutes: dto.requestedMinutes,
    approvedMinutes: dto.approvedMinutes,
    previousOvertimeMinutes: dto.previousOvertimeMinutes,
    previousOvertimePayrollAllowed: dto.previousOvertimePayrollAllowed,
    reasonAr: dto.reasonAr,
    decisionNotesAr: dto.decisionNotesAr,
    status: dto.status,
    approverStates: overtimeApprovalAssignmentToStates(dto),
    submittedAt: dto.submittedAt,
    decidedAt: dto.decidedAt,
    cancelledAt: dto.cancelledAt,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function mapOvertimeRequestListItem(
  item: OvertimeRequestListItemDto,
  catalog: RequestApprovalAssignmentCatalogDto[],
): OvertimeRequestRecord {
  return {
    id: item.id,
    employeeId: item.employeeId,
    employeeNameAr: item.employeeNameAr,
    departmentNameAr: item.departmentNameAr,
    workDate: item.workDate,
    requestedMinutes: item.requestedMinutes,
    approvedMinutes: item.approvedMinutes,
    previousOvertimeMinutes: item.previousOvertimeMinutes,
    previousOvertimePayrollAllowed: item.previousOvertimePayrollAllowed,
    reasonAr: item.reasonAr,
    decisionNotesAr: item.decisionNotesAr,
    status: item.status,
    approverStates: overtimeListItemToStates(item, catalog),
    submittedAt: item.submittedAt,
    decidedAt: item.decidedAt,
    cancelledAt: item.cancelledAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/** 60 → "1س 0د"، 90 → "1س 30د" */
export function formatMinutesAsHM(minutes: number): string {
  return formatDurationMinutesAr(minutes);
}
