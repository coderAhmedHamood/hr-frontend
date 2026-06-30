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
import { checkApprovalAccess, type ApprovalAccessResult } from '@/shared/approval';
import { AR_APPROVAL_ACCESS_MESSAGES } from '@/shared/i18n/ar';

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
  return checkApprovalAccess({
    employeeId,
    companyId,
    existingStates,
    messages: AR_APPROVAL_ACCESS_MESSAGES.request,
    fetchAssignment: () => requestApprovalTemplatesApi.getByRequestCategory(requestCategory, companyId),
    isActive: (assignment) => assignment.isActive,
    isAmongApprovers: isEmployeeAmongRequestApprovers,
    buildStates: buildRequestApproverStatesFromAssignment,
    getActionContext: getRequestApproverActionContext,
  }) as Promise<ApprovalAccessResult<RequestApprovalTemplateResponseDto, RequestApproverStatesSnapshot>>;
}
