import type { UnifiedLeaveType } from '@/features/hr/leaves/types/unified-management';

export type AnalyticsTimelineScale = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface EmployeeLeaveAnalyticsRow {
  id: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  branchId: string;
  annualConsumed: number;
  annualTotal: number;
  sickUsed: number;
  sickCap: number;
  absenceDays: number;
  avatarHue: number;
}

export interface TimelineLeaveBar {
  id: string;
  employeeId: string;
  branchId: string;
  leaveType: UnifiedLeaveType;
  rangeStart: string;
  rangeEnd: string;
  daysCount: number;
}
