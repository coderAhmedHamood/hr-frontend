export type AttendanceDayStatus =
  | 'present'
  | 'partial'
  | 'late'
  | 'absent'
  | 'rest_day'
  | 'unscheduled'
  | 'holiday'
  | 'on_leave';

export type DaySummaryDailyTotals = {
  minutes: {
    expected: number;
    total: number;
    insidePeriods?: number;
    outsidePeriods?: number;
    late: number;
    earlyLeave: number;
    earlyArrival?: number;
    overtime: number;
    payrollOvertime?: number;
    shortage: number;
  };
  display: {
    expected: string;
    total: string;
    insidePeriods?: string;
    outsidePeriods?: string;
    late: string;
    earlyLeave: string;
    earlyArrival?: string;
    overtime: string;
    payrollOvertime?: string;
    shortage: string;
  };
};

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
  correctedTimes?: unknown | null;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workedMinutes: number;
  workedMinutesInsidePeriods?: number;
  workedMinutesOutsidePeriods?: number;
  earlyArrivalMinutes?: number;
  overtimeMinutes: number;
  overtimePayrollAllowed?: boolean;
  overtimePayrollAllowedAt?: string | null;
  payrollOvertimeMinutes?: number;
  canAllowOvertimeForPayroll?: boolean;
  expectedMinutes?: number;
  shortageMinutes?: number;
  dailyTotals?: DaySummaryDailyTotals | null;
  isSettled?: boolean;
  settledAt?: string | null;
  settledMinutes?: number;
  canSettle?: boolean;
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

export type SettleDaySummaryDto = {
  updatedBy?: string | null;
  notes?: string | null;
};

export type SetOvertimePayrollAllowedDto = {
  allowed: boolean;
  updatedBy?: string | null;
  notes?: string | null;
};
