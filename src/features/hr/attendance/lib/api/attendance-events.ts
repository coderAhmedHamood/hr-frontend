import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type DailyBreakdownCheckInWindow = {
  beforeStartMinutes: number;
  graceMinutes: number;
  afterStartMinutes: number;
};

export type DailyBreakdownCheckOutWindow = {
  beforeEndMinutes: number;
  allowedShortageMinutes: number;
  afterEndMinutes: number;
};

export type DailyBreakdownPeriod = {
  expected: {
    periodId: string;
    sortOrder: number;
    startTime: string;
    endTime: string;
    startAt: string;
    endAt: string;
    durationMinutes: number;
    flexibilityEnabled: boolean;
    flexibilityMinutes: number | null;
    checkInWindow: DailyBreakdownCheckInWindow;
    checkOutWindow: DailyBreakdownCheckOutWindow;
    checkInWindowStartAt: string;
    checkInWindowEndAt: string;
    lateThresholdAt: string;
    checkOutWindowStartAt: string;
    checkOutWindowEndAt: string;
    earlyLeaveThresholdAt: string;
    breakEnabled: boolean;
    breakStart: string | null;
    breakEnd: string | null;
    checkOutNotRequired: boolean;
    autoOvertime: boolean;
    strictMode: boolean;
  };
  actual: {
    checkInAt: string | null;
    checkOutAt: string | null;
    checkInEventId: string | null;
    checkOutEventId: string | null;
    breakStartAt: string | null;
    breakEndAt: string | null;
    breakMinutes: number;
    workedMinutes: number;
  };
  analysis: {
    hasCheckIn: boolean;
    hasCheckOut: boolean;
    checkInWithinWindow: boolean | null;
    checkOutWithinWindow: boolean | null;
    checkInBeforeWindow: boolean;
    checkInAfterWindow: boolean;
    checkOutBeforeWindow: boolean;
    checkOutAfterWindow: boolean;
    rawLateMinutes: number;
    lateMinutes: number;
    earlyArrivalMinutes: number;
    rawEarlyLeaveMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    shortageMinutes: number;
    isLate: boolean;
    isEarlyLeave: boolean;
    isAbsent: boolean;
    isComplete: boolean;
    strictModeViolation: boolean;
    status: string;
  };
  events: AttendanceEventResponseDto[];
};

export type DailyBreakdownResponseDto = {
  employeeId: string;
  employeeNameAr: string;
  workDate: string;
  weekDay: number;
  timezoneOffsetMinutes: number;
  status: string;
  isRestDay: boolean;
  isUnscheduled: boolean;
  shiftAssignment: { id: string; effectiveFrom: string; effectiveTo: string | null } | null;
  shiftTemplate: { id: string; nameAr: string; nameEn: string | null; colorHex: string | null } | null;
  totals: {
    expectedMinutes: number;
    workedMinutes: number;
    breakMinutes: number;
    lateMinutes: number;
    earlyLeaveMinutes: number;
    overtimeMinutes: number;
    shortageMinutes: number;
    periodsTotal: number;
    periodsAttended: number;
    periodsLate: number;
    periodsMissed: number;
  };
  periods: DailyBreakdownPeriod[];
  unmatchedEvents: AttendanceEventResponseDto[];
};

export type AttendanceEventType = 'check_in' | 'check_out' | 'break_start' | 'break_end';
export type AttendanceEventSource = 'mobile_app' | 'web_portal' | 'kiosk' | 'manual_hr' | 'biometric' | 'system';

export type AttendanceEventResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  workDate: string;
  eventType: AttendanceEventType;
  occurredAt: string;
  source: AttendanceEventSource | null;
  checkInPointId: string | null;
  checkInPointNameAr: string | null;
  shiftAssignmentId: string | null;
  latitude: string | null;
  longitude: string | null;
  distanceMeters: number | null;
  withinRadius: boolean | null;
  periodSortOrder: number | null;
  notes: string | null;
  isVoided: boolean;
  voidReason: string | null;
  voidedAt: string | null;
  recordedBy: string | null;
  createdAt: string;
};

export type AttendanceEventListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  workDateFrom?: string;
  workDateTo?: string;
  eventType?: AttendanceEventType;
  source?: AttendanceEventSource;
  checkInPointId?: string;
  includeVoided?: boolean;
};

export type CreateAttendanceEventDto = {
  companyId: string;
  employeeId: string;
  eventType: AttendanceEventType;
  occurredAt: string;
  workDate: string;
  source?: string;
  checkInPointId?: string | null;
  shiftAssignmentId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number | null;
  withinRadius?: boolean | null;
  periodSortOrder?: number | null;
  notes?: string | null;
  recordedBy?: string | null;
};

export const attendanceEventsApi = {
  getAll(query?: AttendanceEventListQuery) {
    return apiRequest<PaginatedResult<AttendanceEventResponseDto>>('/attendance/events', { query });
  },
  getById(id: string) {
    return apiRequest<AttendanceEventResponseDto>(`/attendance/events/${id}`);
  },
  getDailyBreakdown(params: { employeeId: string; workDate: string; companyId?: string; timezoneOffsetMinutes?: number }) {
    return apiRequest<DailyBreakdownResponseDto>('/attendance/events/daily-breakdown', { query: params });
  },
  create(payload: CreateAttendanceEventDto) {
    return apiRequest<AttendanceEventResponseDto>('/attendance/events', { method: 'POST', body: payload });
  },
  void(id: string, voidReason: string) {
    return apiRequest<AttendanceEventResponseDto>(`/attendance/events/${id}/void`, {
      method: 'PATCH',
      body: { voidReason },
    });
  },
};
