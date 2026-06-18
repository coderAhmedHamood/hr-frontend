import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type AttendanceDayStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'rest_day'
  | 'unscheduled'
  | 'holiday'
  | 'on_leave';

export type DaySummaryResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  workDate: string;
  status: AttendanceDayStatus;
  shiftAssignmentId: string | null;
  expectedStartAt: string | null;
  expectedEndAt: string | null;
  actualCheckInAt: string | null;
  actualCheckOutAt: string | null;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workedMinutes: number;
  overtimeMinutes: number;
  isManualOverride: boolean;
  isFinalized: boolean;
  notes: string | null;
  computedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type DaySummaryListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  status?: AttendanceDayStatus;
  from?: string;
  to?: string;
  isManualOverride?: boolean;
};

export type UpdateDaySummaryDto = {
  status?: AttendanceDayStatus;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  workedMinutes?: number;
  overtimeMinutes?: number;
  isFinalized?: boolean;
  notes?: string | null;
  updatedBy?: string | null;
};

export type RecomputeDto = {
  companyId: string;
  from: string;
  to: string;
  employeeIds?: string[];
  timezoneOffsetMinutes?: number;
  overwriteManualOverrides?: boolean;
  computedBy?: string | null;
};

export type RecomputeResult = {
  created: number;
  updated: number;
  skipped: number;
  totalDays: number;
  employees: number;
};

export type PushToPayrollDto = {
  payrollPeriodId: string;
  employeeIds?: string[];
  replaceExisting?: boolean;
  applyOvertime?: boolean;
  applyAbsence?: boolean;
  applyLateness?: boolean;
  absenceDailyRateOverride?: number;
  lateMinuteRateOverride?: number;
  overtimeMultiplier?: number;
  createdBy?: string | null;
};

export type PushToPayrollResult = {
  inputsCreated: number;
  inputsDeleted: number;
  employeesProcessed: number;
};

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
};
