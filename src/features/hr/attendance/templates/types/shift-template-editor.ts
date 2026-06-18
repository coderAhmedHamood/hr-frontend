import type { ShiftPeriod, WeekDayIndex } from '@/features/hr/attendance/lib/types';

export type ShiftGroup = {
  id: string;
  days: WeekDayIndex[];
  periods: ShiftPeriod[];
};
