import { ApiError } from '@/features/hr/lib/api/client';
import type { ApproverStatesSnapshot } from '@/shared/approval/types';
import { isEmployeeInApproverStates } from '@/shared/approval/approver-states';

export type ApprovalAccessMessages = {
  notLinked: string;
  companyUnknown?: string;
  inactive: string;
  notAmongApprovers: string;
  cannotActFallback: string;
  notFound: string;
};

export type ApprovalAccessResult<TAssignment, TStates extends ApproverStatesSnapshot> =
  | { ok: true; assignment: TAssignment; states: TStates }
  | { ok: false; message: string };

type CheckApprovalAccessParams<TAssignment, TStates extends ApproverStatesSnapshot> = {
  employeeId: string | null | undefined;
  companyId?: string | null;
  existingStates?: TStates | null;
  messages: ApprovalAccessMessages;
  fetchAssignment: () => Promise<TAssignment>;
  isActive: (assignment: TAssignment) => boolean;
  isAmongApprovers: (assignment: TAssignment, employeeId: string) => boolean;
  buildStates: (assignment: TAssignment) => TStates;
  getActionContext: (states: TStates, employeeId: string) => { canAct: boolean; reasonAr: string | null };
};

function tryValidateExistingStates<TAssignment, TStates extends ApproverStatesSnapshot>(
  employeeId: string,
  existingStates: TStates | null | undefined,
  messages: ApprovalAccessMessages,
  getActionContext: (states: TStates, employeeId: string) => { canAct: boolean; reasonAr: string | null },
): ApprovalAccessResult<TAssignment, TStates> | null {
  if (!existingStates?.approvers?.length) {
    return null;
  }

  if (!isEmployeeInApproverStates(existingStates, employeeId)) {
    return { ok: false, message: messages.notAmongApprovers };
  }

  const action = getActionContext(existingStates, employeeId);
  if (!action.canAct) {
    return { ok: false, message: action.reasonAr ?? messages.cannotActFallback };
  }

  return { ok: true, assignment: {} as TAssignment, states: existingStates };
}

export async function checkApprovalAccess<TAssignment, TStates extends ApproverStatesSnapshot>(
  params: CheckApprovalAccessParams<TAssignment, TStates>,
): Promise<ApprovalAccessResult<TAssignment, TStates>> {
  const {
    employeeId,
    companyId,
    existingStates = null,
    messages,
    fetchAssignment,
    isActive,
    isAmongApprovers,
    buildStates,
    getActionContext,
  } = params;

  if (!employeeId) {
    return { ok: false, message: messages.notLinked };
  }

  if (messages.companyUnknown && !companyId) {
    return { ok: false, message: messages.companyUnknown };
  }

  try {
    const assignment = await fetchAssignment();

    if (!isActive(assignment)) {
      return { ok: false, message: messages.inactive };
    }

    if (!isAmongApprovers(assignment, employeeId)) {
      return { ok: false, message: messages.notAmongApprovers };
    }

    const states = existingStates ?? buildStates(assignment);
    const action = getActionContext(states, employeeId);
    if (!action.canAct) {
      return { ok: false, message: action.reasonAr ?? messages.cannotActFallback };
    }

    return { ok: true, assignment, states };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const fromStates = tryValidateExistingStates<TAssignment, TStates>(
        employeeId,
        existingStates,
        messages,
        getActionContext,
      );
      if (fromStates) {
        return fromStates;
      }
      return { ok: false, message: messages.notFound };
    }
    throw err;
  }
}
