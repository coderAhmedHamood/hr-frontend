import type {
  ViolationRecordListItemDto,
  ViolationRecordResponseDto,
  ViolationApproverStatesSnapshot,
} from '@/features/hr/discipline/types/api/violation-records';
import { normalizeViolationApproverStates } from '@/features/hr/discipline/lib/violation-approver-states';
import { buildRequestApproverStatesFromListItem } from '@/features/hr/requests/lib/request-approver-states';
import type { RequestApprovalAssignmentCatalogDto } from '@/features/hr/requests/types/api/request-approver-states-types';

export function resolveViolationApproverStates(
  dto: ViolationRecordListItemDto | ViolationRecordResponseDto,
  catalog?: RequestApprovalAssignmentCatalogDto[],
): ViolationApproverStatesSnapshot | null {
  if (catalog?.length) {
    const fromList = buildRequestApproverStatesFromListItem(
      {
        approvalAssignmentId: 'approvalAssignmentId' in dto ? (dto.approvalAssignmentId ?? null) : null,
        approverDecisions: 'approverDecisions' in dto ? (dto.approverDecisions ?? null) : null,
      },
      catalog,
    );
    if (fromList) return fromList as ViolationApproverStatesSnapshot;
  }
  return normalizeViolationApproverStates(dto);
}
