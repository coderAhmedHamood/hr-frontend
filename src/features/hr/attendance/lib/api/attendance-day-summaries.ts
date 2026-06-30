import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  AttendanceDayStatus,
  DaySummaryDailyTotals,
  DaySummaryListQuery,
  DaySummaryResponseDto,
  PushToPayrollDto,
  PushToPayrollResult,
  RecomputeDto,
  RecomputeResult,
  SetOvertimePayrollAllowedDto,
  SettleDaySummaryDto,
  UpdateDaySummaryDto,
} from '@/features/hr/attendance/types/api/attendance-day-summaries';

export type {
  AttendanceDayStatus,
  DaySummaryDailyTotals,
  DaySummaryListQuery,
  DaySummaryResponseDto,
  PushToPayrollDto,
  PushToPayrollResult,
  RecomputeDto,
  RecomputeResult,
  SetOvertimePayrollAllowedDto,
  SettleDaySummaryDto,
  UpdateDaySummaryDto,
} from '@/features/hr/attendance/types/api/attendance-day-summaries';

export const attendanceDaySummariesApi = {
  getAll(query?: DaySummaryListQuery) {
    return apiRequest<PaginatedResult<DaySummaryResponseDto>>('/attendance/day-summaries', { query });
  },
  getById(id: string) {
    return apiRequest<DaySummaryResponseDto>(`/attendance/day-summaries/${id}`);
  },
  update(id: string, payload: UpdateDaySummaryDto) {
    return apiRequest<DaySummaryResponseDto>(`/attendance/day-summaries/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/day-summaries/${id}`, { method: 'DELETE' });
  },
  recompute(payload: RecomputeDto) {
    return apiRequest<RecomputeResult>('/attendance/day-summaries/recompute', {
      method: 'POST',
      body: payload,
    });
  },
  pushToPayroll(payload: PushToPayrollDto) {
    return apiRequest<PushToPayrollResult>('/attendance/day-summaries/push-to-payroll', {
      method: 'POST',
      body: payload,
    });
  },
  settle(id: string, payload?: SettleDaySummaryDto) {
    return apiRequest<DaySummaryResponseDto>(`/attendance/day-summaries/${id}/settle`, {
      method: 'POST',
      body: payload ?? {},
    });
  },
  setOvertimePayrollAllowed(id: string, payload: SetOvertimePayrollAllowedDto) {
    return apiRequest<DaySummaryResponseDto>(
      `/attendance/day-summaries/${id}/overtime-payroll-allowed`,
      {
        method: 'POST',
        body: payload,
      },
    );
  },
};
