import { defaultShiftPeriod } from '@/features/hr/attendance/lib/defaults';
import type { ShiftTemplate, WeekDayIndex } from '@/features/hr/attendance/lib/types';
import { genId } from '@/features/hr/attendance/lib/utils';
import type { ShiftGroup } from '@/features/hr/attendance/templates/types/shift-template-editor';

export function initGroups(template: ShiftTemplate): ShiftGroup[] {
  const workDays = template.weekDays.filter((w) => !w.isRest);
  if (workDays.length === 0) {
    return [{ id: genId('grp'), days: [], periods: [defaultShiftPeriod(genId('per'))] }];
  }
  const groups: ShiftGroup[] = [];
  for (const wd of workDays) {
    const firstP = wd.periods[0] ?? defaultShiftPeriod(genId('per'));
    const existing = groups.find(
      (g) => g.periods[0]?.startTime === firstP.startTime && g.periods[0]?.endTime === firstP.endTime,
    );
    if (existing) existing.days.push(wd.day);
    else
      groups.push({
        id: genId('grp'),
        days: [wd.day],
        periods: wd.periods.length > 0 ? [...wd.periods] : [defaultShiftPeriod(genId('per'))],
      });
  }
  return groups.length > 0 ? groups : [{ id: genId('grp'), days: [], periods: [defaultShiftPeriod(genId('per'))] }];
}
