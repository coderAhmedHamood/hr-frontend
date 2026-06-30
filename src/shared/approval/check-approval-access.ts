import { ApiError } from '@/features/hr/lib/api/client';
import type { ApproverStatesSnapshot } from '@/shared/approval/types';

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
      return { ok: false, message: messages.notFound };
    }
    throw err;
  }
}
