import { DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY } from '@/features/hr/attendance/day-summaries/constants/day-summary-column-config';
import type { DaySummaryResponseDto } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { daySummaryExportColumns, daySummaryExportRow } from '@/features/hr/attendance/day-summaries/utils/day-summary-export';

const row = {
  employeeId: 'emp-1',
  employeeNameAr: 'أحمد',
  workDate: '2026-10-31',
  status: 'present',
} as DaySummaryResponseDto;

describe('daySummaryExportColumns branch', () => {
  it('does not add a branch column when the register is one branch', () => {
    const columns = daySummaryExportColumns(DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY);
    expect(columns.map((c) => c.label)).not.toContain('الفرع');
  });

  it('prints each employee branch when every branch is included', () => {
    const columns = daySummaryExportColumns(DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY, {
      branchByEmployeeId: new Map([['emp-1', 'صنعاء']]),
    });
    expect(columns.map((c) => c.label).slice(0, 4)).toEqual(['الموظف', 'الفرع', 'اليوم', 'الحالة']);
    expect(daySummaryExportRow(columns, row)[1]).toBe('صنعاء');
  });
});
