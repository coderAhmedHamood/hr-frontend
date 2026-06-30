import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { recomputeTodayDaySummaries } from '@/features/hr/attendance/lib/api/recompute-today-day-summaries';
import type { DailyBreakdownCheckInWindow, DailyBreakdownCheckOutWindow, DailyBreakdownPeriod, DailyBreakdownResponseDto, AttendanceEventType, AttendanceEventSource, AttendanceEventResponseDto, AttendanceEventListQuery, CreateAttendanceEventDto, NextEventTypeLastPunch, NextEventTypeResponseDto, NextEventTypeQuery } from '@/features/hr/attendance/types/api/attendance-events';
export type { DailyBreakdownCheckInWindow, DailyBreakdownCheckOutWindow, DailyBreakdownPeriod, DailyBreakdownResponseDto, AttendanceEventType, AttendanceEventSource, AttendanceEventResponseDto, AttendanceEventListQuery, CreateAttendanceEventDto, NextEventTypeLastPunch, NextEventTypeResponseDto, NextEventTypeQuery } from '@/features/hr/attendance/types/api/attendance-events';












export const attendanceEventsApi = {
  async getAll(query?: AttendanceEventListQuery) {
    await recomputeTodayDaySummaries(query?.companyId);
    return apiRequest<PaginatedResult<AttendanceEventResponseDto>>('/attendance/events', { query });
  },
  getById(id: string) {
    return apiRequest<AttendanceEventResponseDto>(`/attendance/events/${id}`);
  },
  getDailyBreakdown(params: { employeeId: string; workDate: string; companyId?: string; timezoneOffsetMinutes?: number }) {
    return apiRequest<DailyBreakdownResponseDto>('/attendance/events/daily-breakdown', { query: params });
  },
  getNextEventType(params: NextEventTypeQuery) {
    return apiRequest<NextEventTypeResponseDto>('/attendance/events/next-event-type', { query: params });
  },
  async create(payload: CreateAttendanceEventDto) {
    const result = await apiRequest<AttendanceEventResponseDto>('/attendance/events', { method: 'POST', body: payload });
    await recomputeTodayDaySummaries(payload.companyId);
    return result;
  },
  async void(id: string, voidReason: string) {
    const result = await apiRequest<AttendanceEventResponseDto>(`/attendance/events/${id}/void`, {
      method: 'PATCH',
      body: { voidReason },
    });
    await recomputeTodayDaySummaries();
    return result;
  },
};

