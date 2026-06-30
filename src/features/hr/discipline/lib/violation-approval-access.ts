import {
  disciplineApprovalTemplatesApi,
  type DisciplineApprovalTemplateResponseDto,
} from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import type { ViolationApproverStatesSnapshot } from '@/features/hr/discipline/lib/api/violation-records';
import {
  buildApproverStatesFromAssignment,
  getViolationApproverActionContext,
  isEmployeeAmongViolationApprovers,
} from '@/features/hr/discipline/lib/violation-approver-states';
import { checkApprovalAccess, type ApprovalAccessResult } from '@/shared/approval';
import { AR_APPROVAL_ACCESS_MESSAGES } from '@/shared/i18n/ar';

export type ViolationApprovalAccessResult =
  | {
      ok: true;
      assignment: DisciplineApprovalTemplateResponseDto;
      states: ViolationApproverStatesSnapshot;
    }
  | { ok: false; message: string };

export async function checkViolationApprovalAccess(
  violationTypeId: string,
  employeeId: string | null | undefined,
  existingStates: ViolationApproverStatesSnapshot | null = null,
): Promise<ViolationApprovalAccessResult> {
  return checkApprovalAccess({
    employeeId,
    existingStates,
    messages: AR_APPROVAL_ACCESS_MESSAGES.violation,
    fetchAssignment: () => disciplineApprovalTemplatesApi.getByViolationType(violationTypeId),
    isActive: (assignment) => assignment.isActive,
    isAmongApprovers: isEmployeeAmongViolationApprovers,
    buildStates: buildApproverStatesFromAssignment,
    getActionContext: getViolationApproverActionContext,
  }) as Promise<ApprovalAccessResult<DisciplineApprovalTemplateResponseDto, ViolationApproverStatesSnapshot>>;
}
