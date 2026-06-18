import { parseISO } from 'date-fns';
import type { AttendanceDaySummary, DaySummaryStatus } from '@/features/hr/attendance/lib/types';
import { isFriday } from '@/features/hr/attendance/daily/utils/daily-attendance-format';

/** لكل موظف وكل يوم في النطاق: سجل كامل — الجمعة عطلة، وغياب السجل يُعرض غائب */
export function densifySummaries(
  summaries: AttendanceDaySummary[],
  dates: string[],
  roster: { id: string; name: string }[],
): AttendanceDaySummary[] {
  const map = new Map<string, AttendanceDaySummary>();
  for (const s of summaries) map.set(`${s.employeeId}|${s.date}`, s);
  const TPL = 'tpl-s1';
  const out: AttendanceDaySummary[] = [];

  for (const emp of roster) {
    for (const d of dates) {
      const k = `${emp.id}|${d}`;
      const dParsed = parseISO(`${d}T12:00:00`);
      const friday = isFriday(dParsed);
      const existing = map.get(k);

      if (existing) {
        let st: DaySummaryStatus = existing.status;
        if (friday) st = 'holiday';
        else if (st === 'overtime') st = 'present';
        else if (st === 'incomplete') st = 'absent';
        out.push({
          ...existing,
          employeeName: emp.name,
          status: st,
          lateMinutes: st === 'holiday' ? 0 : existing.lateMinutes,
          earlyLeaveMinutes: st === 'holiday' ? 0 : existing.earlyLeaveMinutes,
          overtimeMinutes: st === 'holiday' ? 0 : existing.overtimeMinutes,
          workedMinutes: st === 'holiday' ? 0 : existing.workedMinutes,
        });
        continue;
      }

      if (friday) {
        out.push({
          id: `syn-${emp.id}-${d}`,
          employeeId: emp.id,
          employeeName: emp.name,
          date: d,
          templateId: null,
          status: 'holiday',
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeMinutes: 0,
          workedMinutes: 0,
        });
        continue;
      }

      out.push({
        id: `syn-${emp.id}-${d}`,
        employeeId: emp.id,
        employeeName: emp.name,
        date: d,
        templateId: TPL,
        status: 'absent',
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        workedMinutes: 0,
      });
    }
  }

  return out.sort((a, b) => a.employeeId.localeCompare(b.employeeId) || a.date.localeCompare(b.date));
}
