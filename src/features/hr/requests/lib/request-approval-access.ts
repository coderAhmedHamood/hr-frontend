import { ApiError } from '@/features/hr/lib/api/client';
import {
  requestApprovalTemplatesApi,
  type RequestApprovalTemplateResponseDto,
} from '@/features/hr/requests/lib/api/approval-templates';
import type { ApprovalAssignmentRequestCategory } from '@/features/hr/requests/approval-assignment/lib/approval-assignable-request-types';
import type { RequestApproverStatesSnapshot } from '@/features/hr/requests/lib/api/request-approver-states-types';
import {
  buildRequestApproverStatesFromAssignment,
  getRequestApproverActionContext,
  isEmployeeAmongRequestApprovers,
} from '@/features/hr/requests/lib/request-approver-states';

export type RequestApprovalAccessResult =
  | {
      ok: true;
      assignment: RequestApprovalTemplateResponseDto;
      states: RequestApproverStatesSnapshot;
    }
  | { ok: false; message: string };

export async function checkRequestApprovalAccess(
  requestCategory: ApprovalAssignmentRequestCategory,
  companyId: string,
  employeeId: string | null | undefined,
  existingStates: RequestApproverStatesSnapshot | null = null,
): Promise<RequestApprovalAccessResult> {
  if (!employeeId) {
    return {
      ok: false,
      message: 'لم يتم ربط حسابك بسجل موظف؛ لا يمكنك اعتماد أو رفض الطلبات.',
    };
  }

  if (!companyId) {
    return { ok: false, message: 'تعذر تحديد الشركة.' };
  }

  try {
    const assignment = await requestApprovalTemplatesApi.getByRequestCategory(requestCategory, companyId);

    if (!assignment.isActive) {
      return {
        ok: false,
        message: 'إسناد الموافقة غير نشط لهذا النوع من الطلبات.',
      };
    }

    if (!isEmployeeAmongRequestApprovers(assignment, employeeId)) {
      return {
        ok: false,
        message: 'أنت لست ضمن المعتمدين المسندين لهذا النوع من الطلبات.',
      };
    }

    const states = existingStates ?? buildRequestApproverStatesFromAssignment(assignment);
    const action = getRequestApproverActionContext(states, employeeId);
    if (!action.canAct) {
      return {
        ok: false,
        message: action.reasonAr ?? 'لا يمكنك اتخاذ قرار على هذا الطلب الآن.',
      };
    }

    return { ok: true, assignment, states };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return {
        ok: false,
        message: 'لا يوجد إسناد موافقة لهذا النوع من الطلبات.',
      };
    }
    throw err;
  }
}
