'use client';

import * as React from 'react';
import { FileDown, FileSpreadsheet, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { AttendanceRegisterPrintHtml } from '@/components/pdf/print/attendance-register-print-html';
import { hasDateRangeFilter, normalizePeriodRange, thisCalendarMonthYMD, todayYMD } from '@/features/hr/discipline/lib/discipline-date-filter';
import type { AttendanceDaySummary, AttendanceEvent } from '@/features/hr/attendance/lib/types';
import { enumerateDates } from '@/features/hr/attendance/lib/utils';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import {
  ATT_VISUAL_STATUS_ORDER,
  STATUS,
} from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { resolveVisualKey } from '@/features/hr/attendance/daily/utils/daily-attendance-status-resolve';
import { minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import { attendanceDaySummariesApi } from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { attendanceEventsApi } from '@/features/hr/attendance/lib/api/attendance-events';
import { recomputeTodayDaySummaries } from '@/features/hr/attendance/lib/api/recompute-today-day-summaries';
import { companiesApi } from '@/features/hr/lib/api/companies';
import { useEmployeeFilterPicker } from '@/features/hr/lib/use-employee-filter-picker';
import { getDefaultCompanyId, useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  attendanceFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/attendance/lib/use-persisted-filter-state';

export type AttendanceViewMode = 'card' | 'table';

export function useDailyAttendanceModel() {
  const companyId = useDefaultCompanyId();
  const [daySummaries, setDaySummaries] = React.useState<AttendanceDaySummary[]>([]);
  const [events, setEvents] = React.useState<AttendanceEvent[]>([]);
  const { employees: pickerEmployees } = useEmployeeFilterPicker(companyId);
  const allEmployees = React.useMemo(
    () => pickerEmployees.map((e) => ({ id: e.id, name: e.name })),
    [pickerEmployees],
  );
  const [companyNameAr, setCompanyNameAr] = React.useState('');
  const [companyNameEn, setCompanyNameEn] = React.useState('');

  const [selectedEmpIds, setSelectedEmpIds] = usePersistedEmpIdSet(
    attendanceFiltersKey('daily', companyId, 'selectedEmpIds'),
  );
  const [dateBounds, setDateBounds] = usePersistedFilterState(
    attendanceFiltersKey('daily', companyId, 'dateBounds'),
    { from: todayYMD(), to: todayYMD() },
  );
  const [statusFilter, setStatusFilter] = usePersistedFilterState(
    attendanceFiltersKey('daily', companyId, 'statusFilter'),
    'all',
  );
  const [viewMode, setViewMode] = usePersistedFilterState<AttendanceViewMode>(
    attendanceFiltersKey('daily', companyId, 'viewMode'),
    'card',
  );
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [recomputeOpen, setRecomputeOpen] = React.useState(false);
  const [registerOpen, setRegisterOpen] = React.useState(false);

  const { from: filterFrom, to: filterTo } = dateBounds;

  // Load company info for the default company
  React.useEffect(() => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    void companiesApi.getById(companyId).then((companyRes) => {
      if (companyRes) {
        setCompanyNameAr(companyRes.nameAr);
        setCompanyNameEn(companyRes.nameEn ?? '');
      }
    });
  }, []);

  const reloadAttendanceData = React.useCallback(async (from: string, to: string) => {
    try {
      await recomputeTodayDaySummaries();
      const [summRes, evtRes] = await Promise.all([
        attendanceDaySummariesApi.getAll({ limit: 2000, from, to } as Parameters<typeof attendanceDaySummariesApi.getAll>[0]),
        attendanceEventsApi.getAll({ limit: 2000, workDateFrom: from, workDateTo: to }),
      ]);
      setDaySummaries(
        summRes.items.map((s) => ({
          id: s.id,
          employeeId: s.employeeId,
          employeeName: s.employeeNameAr,
          date: s.workDate,
          templateId: s.shiftAssignmentId ?? null,
          status: s.status as AttendanceDaySummary['status'],
          lateMinutes: s.lateMinutes,
          earlyLeaveMinutes: s.earlyLeaveMinutes,
          overtimeMinutes: s.overtimeMinutes,
          workedMinutes: s.workedMinutes,
          notes: s.notes ?? undefined,
          actualCheckInAt: (s as Record<string, unknown>).actualCheckInAt as string | null ?? null,
          actualCheckOutAt: (s as Record<string, unknown>).actualCheckOutAt as string | null ?? null,
          expectedStartAt: (s as Record<string, unknown>).expectedStartAt as string | null ?? null,
          expectedEndAt: (s as Record<string, unknown>).expectedEndAt as string | null ?? null,
        })),
      );
      setEvents(
        evtRes.items.map((e) => ({
          id: e.id,
          employeeId: e.employeeId,
          employeeName: e.employeeNameAr,
          date: e.workDate,
          type: e.eventType,
          at: e.occurredAt,
          source: e.source ?? 'manual_hr',
        })) as AttendanceEvent[],
      );
    } catch { /* ignore */ }
  }, []);

  // Load day summaries & events when date range changes
  React.useEffect(() => {
    const from = filterFrom || todayYMD();
    const to = filterTo || todayYMD();
    void reloadAttendanceData(from, to);
  }, [filterFrom, filterTo, reloadAttendanceData]);

  const spanFromData = React.useMemo(() => {
    let lo = '';
    let hi = '';
    for (const s of daySummaries) {
      if (!lo || s.date < lo) lo = s.date;
      if (!hi || s.date > hi) hi = s.date;
    }
    if (!lo) return thisCalendarMonthYMD();
    return { from: lo, to: hi };
  }, [daySummaries]);

  const { from, to } = React.useMemo(() => {
    if (hasDateRangeFilter(filterFrom, filterTo)) return dateBounds;
    return spanFromData;
  }, [dateBounds, spanFromData, filterFrom, filterTo]);

  const dates = React.useMemo(() => enumerateDates(from, to), [from, to]);

  const filtered = React.useMemo(
    () =>
      daySummaries.filter(
        (s) =>
          s.date >= from &&
          s.date <= to &&
          (selectedEmpIds.size === 0 || selectedEmpIds.has(s.employeeId)),
      ),
    [daySummaries, from, to, selectedEmpIds],
  );

  const eventsFiltered = React.useMemo(
    () =>
      events.filter(
        (e) =>
          e != null &&
          typeof e.id === 'string' &&
          e.date >= from &&
          e.date <= to &&
          (selectedEmpIds.size === 0 || selectedEmpIds.has(e.employeeId)),
      ),
    [events, from, to, selectedEmpIds],
  );

  const denseSummaries = filtered;

  const attendanceStatusLabels = React.useMemo(
    () => Object.fromEntries(ATT_VISUAL_STATUS_ORDER.map((k) => [k, STATUS[k].label])) as Record<string, string>,
    [],
  );

  const attendanceStatusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: denseSummaries.length };
    for (const k of ATT_VISUAL_STATUS_ORDER) counts[k] = 0;
    for (const s of denseSummaries) {
      counts[resolveVisualKey(s.status)] += 1;
    }
    return counts;
  }, [denseSummaries]);

  const denseForView = React.useMemo(() => {
    if (statusFilter === 'all') return denseSummaries;
    return denseSummaries.filter((s) => resolveVisualKey(s.status) === statusFilter);
  }, [denseSummaries, statusFilter]);

  // Do NOT filter events by summaries — employees may have events without a day summary
  const eventsForView = eventsFiltered;

  const attendancePdfRows = React.useMemo(
    () =>
      denseForView.map((s: AttendanceDaySummary) => ({
        employeeName: s.employeeName,
        date: s.date,
        statusLabel: STATUS[resolveVisualKey(s.status)].label,
        worked: minutesToHHMM(s.workedMinutes),
        late: minutesToHHMM(s.lateMinutes),
      })),
    [denseForView],
  );

  const attendancePrintable = React.useMemo(
    () =>
      attendancePdfRows.length === 0 ? null : (
        <AttendanceRegisterPrintHtml
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn}
          titleAr="تقرير الحضور اليومي"
          periodDateFrom={from}
          periodDateTo={to}
          employeesFilterAll={selectedEmpIds.size === 0}
          employeesSelectedCount={selectedEmpIds.size}
          statusFilterLabelAr={
            statusFilter === 'all' ? 'الكل' : attendanceStatusLabels[statusFilter] ?? statusFilter
          }
          rows={attendancePdfRows}
        />
      ),
    [attendancePdfRows, from, to, selectedEmpIds.size, statusFilter, attendanceStatusLabels, companyNameAr, companyNameEn],
  );

  const attendancePdfFileName = `attendance-${from}-${to}.pdf`;

  const handleExportAttendanceExcel = React.useCallback(async () => {
    if (denseForView.length === 0) {
      toast.error('لا توجد سجلات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const rows: XlsxCell[][] = [
      ['الموظف', 'معرف الموظف', 'اليوم', 'الحالة', 'دقائق العمل', 'دقائق التأخير'],
    ];
    for (const s of denseForView) {
      rows.push([
        s.employeeName,
        s.employeeId,
        s.date,
        STATUS[resolveVisualKey(s.status)].label,
        s.workedMinutes,
        s.lateMinutes,
      ]);
    }
    await downloadXlsxFromAoA(`attendance-${from}-${to}.xlsx`, 'الحضور', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [denseForView, from, to]);


  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const isDefaultDate = filterFrom === todayYMD() && filterTo === todayYMD();
  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0)
    + (selectedEmpIds.size > 0 ? 1 : 0)
    + (!isDefaultDate ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button
          type="button"
          size="sm"
          variant="luxe"
          onClick={() => setRegisterOpen(true)}
          className="h-8 gap-2"
        >
          <Plus className="h-4 w-4" />
          تسجيل حضور
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={() => setRecomputeOpen(true)}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث البيانات
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 w-8 shrink-0" aria-label="تصدير الحضور">
              <FileDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                if (attendancePdfRows.length === 0) {
                  toast.error('لا توجد سجلات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-4 w-4" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleExportAttendanceExcel()}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    [activeFilterCount, attendancePdfRows.length, handleExportAttendanceExcel],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        empPickerEmployees={pickerEmployees}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusOrder={ATT_VISUAL_STATUS_ORDER}
        statusLabels={attendanceStatusLabels}
        statusCounts={attendanceStatusCounts}
        onDateBoundsChange={(b) => {
          const normalized = normalizePeriodRange(b);
          if (normalized) {
            setDateBounds(normalized);
            return;
          }
          setDateBounds({ from: todayYMD(), to: todayYMD() });
        }}
        dataView={{
          value: viewMode,
          onChange: (v) => setViewMode(v as AttendanceViewMode),
          options: [
            { value: 'card', label: 'بطاقات', icon: 'layout-grid' },
            { value: 'table', label: 'جدول', icon: 'list' },
          ],
        }}
      />
    ),
    [
      statusFilter,
      selectedEmpKey,
      viewMode,
      pickerEmployees.length,
      dateBounds.from,
      dateBounds.to,
      attendanceStatusCounts.all,
      attendanceStatusCounts.present,
      attendanceStatusCounts.late,
      attendanceStatusCounts.absent,
      attendanceStatusCounts.early_leave,
      attendanceStatusCounts.holiday,
      attendanceStatusCounts.rest_day,
      attendanceStatusCounts.unscheduled,
      attendanceStatusCounts.on_leave,
    ],
  );

  const refreshAfterRecompute = React.useCallback(() => {
    const from = filterFrom || todayYMD();
    const to = filterTo || todayYMD();
    void reloadAttendanceData(from, to);
  }, [filterFrom, filterTo, reloadAttendanceData]);

  return {
    from,
    to,
    dates,
    dateBounds,
    selectedEmpIds,
    denseForView,
    eventsForView,
    allEmployees,
    attendancePrintable,
    attendancePdfFileName,
    pdfOpen,
    setPdfOpen,
    recomputeOpen,
    setRecomputeOpen,
    registerOpen,
    setRegisterOpen,
    refreshAfterRecompute,
    viewMode,
    setViewMode,
  };
}
