import { apiRequest } from '@/features/hr/lib/api/client';
import type { ApprovalMode } from '@/features/hr/discipline/lib/api/discipline-approval-templates';
import type { ViolationRecordStatus, ViolationApproverEntryStatus, ViolationApproverStateEntry, ViolationApproverStatesSnapshot, ViolationTypeSummaryDto, ViolationInvestigationDto, ViolationRecordResponseDto, ViolationRecordListItemDto, ViolationRecordListResponseDto, UpdateViolationRecordDto, DecideViolationRecordDto, ViolationRecordListQuery, ViolationRecordByPeriodQuery, ViolationRecordByPeriodResult, CreateViolationRecordDto, PushViolationsToPayrollDto, PushViolationsToPayrollResponseDto } from '@/features/hr/discipline/types/api/violation-records';
export type { ViolationRecordStatus, ViolationApproverEntryStatus, ViolationApproverStateEntry, ViolationApproverStatesSnapshot, ViolationTypeSummaryDto, ViolationInvestigationDto, ViolationRecordResponseDto, ViolationRecordListItemDto, ViolationRecordListResponseDto, UpdateViolationRecordDto, DecideViolationRecordDto, ViolationRecordListQuery, ViolationRecordByPeriodQuery, ViolationRecordByPeriodResult, CreateViolationRecordDto, PushViolationsToPayrollDto, PushViolationsToPayrollResponseDto } from '@/features/hr/discipline/types/api/violation-records';














export const violationRecordsApi = {
  getAll(query?: ViolationRecordListQuery) {
    return apiRequest<ViolationRecordListResponseDto>('/discipline/violation-records', { query });
  },
  getById(id: string) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}`);
  },
  create(payload: CreateViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>('/discipline/violation-records', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}`, { method: 'PATCH', body: payload });
  },
  decide(id: string, payload: DecideViolationRecordDto) {
    return apiRequest<ViolationRecordResponseDto>(`/discipline/violation-records/${id}/decision`, {
      method: 'POST',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/violation-records/${id}`, { method: 'DELETE' });
  },

  byPeriod(query: ViolationRecordByPeriodQuery) {
    return apiRequest<ViolationRecordByPeriodResult>('/discipline/violation-records/by-period', { query });
  },

  pushToPayroll: (body: PushViolationsToPayrollDto) =>
    apiRequest<PushViolationsToPayrollResponseDto>('/discipline/violation-records/push-to-payroll', {
      method: 'POST',
      body,
    }),
};

