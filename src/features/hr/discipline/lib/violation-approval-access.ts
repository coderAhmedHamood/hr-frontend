import { ApiError } from '@/features/hr/lib/api/client';
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
  if (!employeeId) {
    return {
      ok: false,
      message: 'لم يتم ربط حسابك بسجل موظف؛ لا يمكنك اعتماد أو رفض المخالفات.',
    };
  }

  try {
    const assignment = await disciplineApprovalTemplatesApi.getByViolationType(violationTypeId);

    if (!assignment.isActive) {
      return {
        ok: false,
        message: 'إسناد الموافقة غير نشط لهذا النوع من المخالفات.',
      };
    }

    if (!isEmployeeAmongViolationApprovers(assignment, employeeId)) {
      return {
        ok: false,
        message: 'أنت لست ضمن المعتمدين المسندين لهذا النوع من المخالفات.',
      };
    }

    const states = existingStates ?? buildApproverStatesFromAssignment(assignment);
    const action = getViolationApproverActionContext(states, employeeId);
    if (!action.canAct) {
      return {
        ok: false,
        message: action.reasonAr ?? 'لا يمكنك اتخاذ قرار على هذه المخالفة الآن.',
      };
    }

    return { ok: true, assignment, states };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return {
        ok: false,
        message: 'لا يوجد إسناد موافقة لهذا النوع من المخالفات.',
      };
    }
    throw err;
  }
}
