import type {
  EmployeeAdvanceListItemDto,
  EmployeeAdvanceResponseDto,
} from './api/employee-advances';
import type { RequestApprovalAssignmentCatalogDto } from '@/features/hr/requests/types/api/overtime-requests';
import type {
  RequestApproverStatesSnapshot,
  RequestApproverStatesCarrier,
  RequestApproverEntryStatus,
} from '@/features/hr/requests/lib/api/request-approver-states-types';
import { normalizeRequestApproverStates } from '@/features/hr/requests/lib/request-approver-states';
import type {
  HREmployeeAdvance,
  HREmployeeAdvanceKind,
  HREmployeeAdvanceRepaymentMode,
} from './employee-advances-store';
import type { AdvanceKindDto, RepaymentModeDto } from './api/employee-advances';

export type EmployeeNameLookup = (employeeId: string) => string | null | undefined;

function toEntryStatus(status: string): RequestApproverEntryStatus {
  return status === 'approved' || status === 'rejected' ? status : 'pending';
}

export function resolveEmployeeNameAr(
  employeeId: string,
  preferred: string | null | undefined,
  lookup?: EmployeeNameLookup,
): string {
  const fromPreferred = preferred?.trim();
  if (fromPreferred) return fromPreferred;
  const fromLookup = lookup?.(employeeId)?.trim();
  if (fromLookup) return fromLookup;
  return employeeId;
}

/** Merges list-item decisions with the shared approval catalog (same pattern as overtime requests). */
export function employeeAdvanceListItemToStates(
  item: Pick<EmployeeAdvanceListItemDto, 'approvalAssignmentId' | 'approverDecisions'>,
  catalog: RequestApprovalAssignmentCatalogDto[],
  lookup?: EmployeeNameLookup,
): RequestApproverStatesSnapshot | null {
  if (item.approvalAssignmentId) {
    const assignment = catalog.find((a) => a.id === item.approvalAssignmentId);
    if (assignment) {
      const decisionByEmployee = new Map(
        (item.approverDecisions ?? []).map((d) => [d.employeeId, d]),
      );
      return {
        assignmentId: assignment.id,
        approvalMode: assignment.approvalMode,
        approvers: assignment.approvers.map((a) => {
          const decision = decisionByEmployee.get(a.employeeId);
          return {
            employeeId: a.employeeId,
            employeeNameAr: resolveEmployeeNameAr(a.employeeId, a.employeeNameAr, lookup),
            sortOrder: a.sortOrder,
            status: toEntryStatus(decision?.status ?? 'pending'),
            decidedAt: decision?.decidedAt ?? null,
            decidedBy: null,
            notes: decision?.notes ?? null,
          };
        }),
      };
    }
  }

  const decisions = item.approverDecisions ?? [];
  if (decisions.length === 0) return null;

  return {
    assignmentId: item.approvalAssignmentId ?? '',
    approvalMode: 'parallel',
    approvers: decisions.map((d, index) => ({
      employeeId: d.employeeId,
      employeeNameAr: resolveEmployeeNameAr(d.employeeId, null, lookup),
      sortOrder: index,
      status: toEntryStatus(d.status),
      decidedAt: d.decidedAt ?? null,
      decidedBy: null,
      notes: d.notes ?? null,
    })),
  };
}

function mapKind(k: AdvanceKindDto | null): HREmployeeAdvanceKind {
  if (k === 'housing') return 'housing';
  if (k === 'emergency') return 'urgent';
  return 'personal';
}

function mapRepaymentMode(m: RepaymentModeDto | null): HREmployeeAdvanceRepaymentMode {
  if (m === 'monthly_payroll') return 'by_months';
  return 'by_monthly_amount';
}

function isEmployeeAdvanceListItemDto(
  r: EmployeeAdvanceResponseDto | EmployeeAdvanceListItemDto,
): r is EmployeeAdvanceListItemDto {
  return 'approverDecisions' in r || 'approvalAssignmentId' in r;
}

export function mapEmployeeAdvanceFromApi(
  r: EmployeeAdvanceResponseDto | EmployeeAdvanceListItemDto,
  options?: {
    catalog?: RequestApprovalAssignmentCatalogDto[];
    employeeNameLookup?: EmployeeNameLookup;
  },
): HREmployeeAdvance {
  const note = (r.note ?? '').trim();
  const reasonAr = (r.reasonAr ?? r.note ?? '').trim();

  const fromListOverlay = isEmployeeAdvanceListItemDto(r)
    ? employeeAdvanceListItemToStates(
        {
          approvalAssignmentId: r.approvalAssignmentId ?? null,
          approverDecisions: r.approverDecisions ?? null,
        },
        options?.catalog ?? [],
        options?.employeeNameLookup,
      )
    : null;

  const approverStates =
    fromListOverlay
    ?? normalizeRequestApproverStates(r as RequestApproverStatesCarrier);

  return {
    id: r.id,
    advanceNumber: r.advanceNumber,
    employeeId: r.employeeId,
    employeeNameAr: resolveEmployeeNameAr(r.employeeId, r.employeeNameAr, options?.employeeNameLookup),
    branchNameAr: r.branchNameAr ?? null,
    amount: parseFloat(r.amount) || 0,
    currency: r.currency,
    advanceDate: r.advanceDate,
    note,
    reasonAr,
    status: r.status,
    advanceKind: mapKind(r.advanceKind),
    repaymentMode: mapRepaymentMode(r.repaymentMode),
    repaymentMonths: r.repaymentMonths ?? null,
    monthlyInstallmentAmount:
      r.monthlyInstallmentAmount != null ? parseFloat(r.monthlyInstallmentAmount) : null,
    totalRepaidAmount: parseFloat(r.totalRepaidAmount) || 0,
    remainingAmount: parseFloat(r.remainingAmount) || 0,
    approvedAt: r.approvedAt,
    rejectedAt: r.rejectedAt ?? null,
    decisionNotes: r.decisionNotes ?? null,
    disbursedAt: r.disbursedAt,
    createdAt: r.createdAt,
    approverStates,
    updatedAt: r.updatedAt,
  };
}
