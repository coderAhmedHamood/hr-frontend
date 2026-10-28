'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  attendanceDaySummariesApi,
  type AttendanceDayStatus,
  type DaySummaryListQuery,
  type DaySummaryResponseDto,
} from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { useEmployeeFilterPicker } from '@/features/hr/lib/use-employee-filter-picker';
import {
  employeeMatchesStatus,
  employeeStatusFilterLabelAr,
  employeeStatusQuery,
  isEmployeeStatusFilterActive,
  useEmployeeStatusFilter,
} from '@/features/hr/lib/employee-status-filter';
import {
  DAY_SUMMARY_STATUS_LABELS,
  DAY_SUMMARY_STATUS_ORDER,
  daySummaryStatusLabel,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-labels';
import {
  currentYearMonth,
  monthDateBounds,
} from '@/features/hr/attendance/day-summaries/utils/month-date-range';
import { isPeriodFilterActive, normalizePeriodRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import { Button } from '@/components/ui/button';
import { ListSortMenu, listSortQuery, useListSort, type ListSortOption } from '@/components/ui/list-sort';
import {
  dateListGroupOptions,
  ListGroupMenu,
  listGroupQuery,
  ORG_LIST_GROUP_OPTIONS,
  useGroupedList,
  useListGroup,
  type ListGroupMeasure,
  type ListGroupOption,
} from '@/components/ui/list-group';
import { ListSavedViews, listStateKeys } from '@/components/ui/list-saved-views';
import { registerExportRows } from '@/components/pdf/lib/register-export-rows';
import { useOrgFilter } from '@/features/hr/lib/use-org-filter';
import { ListFilterBar, type ListFilterInlineSelect } from '@/components/ui/list-filter-bar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { RegisterExportMenu } from '@/components/pdf/register-export-menu';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useLatestCallback } from '@/shared/hooks/use-latest-callback';
import {
  daySummaryExportColumns,
} from '@/features/hr/attendance/day-summaries/utils/day-summary-export';
import { recomputeTodayDaySummaries } from '@/features/hr/attendance/lib/api/recompute-today-day-summaries';
import {
  attendanceFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/attendance/lib/use-persisted-filter-state';
import { DaySummaryColumnsPicker } from '@/features/hr/attendance/day-summaries/components/day-summary-columns-picker';
import {
  useAssignedBranchFilter,
} from '@/features/hr/attendance/lib/use-assigned-branch-filter';
import {
  DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY,
  normalizeDaySummaryColumnVisibility,
  type DaySummaryColumnVisibility,
  type DaySummaryOptionalColumnKey,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-column-config';

/** Fields the day-summaries list can be sorted by (server `sortBy` keys). */
export const DAY_SUMMARIES_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'workDate', label: 'اليوم' },
  { key: 'employeeName', label: 'الموظف' },
  { key: 'employeeCode', label: 'رقم الموظف' },
  { key: 'status', label: 'الحالة' },
  { key: 'actualCheckInAt', label: 'وقت الدخول' },
  { key: 'actualCheckOutAt', label: 'وقت الخروج' },
  { key: 'lateMinutes', label: 'التأخير' },
  { key: 'earlyLeaveMinutes', label: 'الخروج المبكر' },
  { key: 'workedMinutes', label: 'ساعات العمل' },
  { key: 'overtimeMinutes', label: 'الإضافي' },
  { key: 'shortageMinutes', label: 'النقص' },
];

/** Fields the day-summaries list can be grouped by (server `groupBy` keys). */
export const DAY_SUMMARIES_GROUP_OPTIONS: readonly ListGroupOption[] = [
  { key: 'employee', label: 'الموظف' },
  ...ORG_LIST_GROUP_OPTIONS,
  {
    key: 'status',
    label: 'الحالة',
    formatKey: (k) => daySummaryStatusLabel(k as AttendanceDayStatus),
  },
  ...dateListGroupOptions(),
];

/** Group totals the groups can be ordered by. */
export const DAY_SUMMARIES_GROUP_MEASURES: readonly ListGroupMeasure[] = [
  { key: 'late', label: 'مجموع التأخير' },
  { key: 'shortage', label: 'مجموع النقص' },
  { key: 'overtime', label: 'مجموع الإضافي' },
  { key: 'total', label: 'مجموع ساعات العمل' },
  { key: 'absentDays', label: 'أيام الغياب' },
  { key: 'lateDays', label: 'أيام التأخر' },
];

export type DaySummariesFilters = {
  status: 'all' | AttendanceDayStatus;
  isManualOverride: 'all' | 'true' | 'false';
};

export function useDaySummariesDirectoryModel() {
  const companyId = useDefaultCompanyId();
  const initialYm = currentYearMonth();
  const initialBounds = monthDateBounds(initialYm.year, initialYm.month);

  const [periodBounds, setPeriodBounds] = usePersistedFilterState(
    attendanceFiltersKey('day-summaries', companyId, 'periodBounds'),
    initialBounds,
  );
  const from = periodBounds.from;
  const to = periodBounds.to;

  const [items, setItems] = React.useState<DaySummaryResponseDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);
  const [loading, setLoading] = React.useState(true);
  const [selectedEmpIds, setSelectedEmpIds] = usePersistedEmpIdSet(
    attendanceFiltersKey('day-summaries', companyId, 'selectedEmpIds'),
  );
  const { employees: pickerEmployees } = useEmployeeFilterPicker(companyId);
  const {
    branchId: assignedBranchId,
    select: assignedBranchSelect,
    assignedIds,
    selectedBranchNameAr,
    branchByEmployeeId,
    resolveBranchByEmployeeId,
  } = useAssignedBranchFilter(
    companyId,
    'day-summaries',
  );
  const includeBranchColumn = assignedBranchId === 'all';
  const org = useOrgFilter('attendance', 'day-summaries', companyId, { branch: false });
  const stateKeys = listStateKeys('attendance', 'day-summaries', companyId);
  const sort = useListSort(stateKeys.sort, DAY_SUMMARIES_SORT_OPTIONS);
  const group = useListGroup(stateKeys.group, DAY_SUMMARIES_GROUP_OPTIONS, DAY_SUMMARIES_GROUP_MEASURES);
  const groupBy = group.groupBy;
  // The employees' own status: active by default, like the daily register.
  const [employeeStatus, setEmployeeStatus] = useEmployeeStatusFilter(
    attendanceFiltersKey('day-summaries', companyId, 'employeeStatus'),
  );
  const visiblePickerEmployees = React.useMemo(
    () =>
      pickerEmployees.filter(
        (employee) =>
          (!assignedIds || assignedIds.has(employee.id)) &&
          employeeMatchesStatus(employee.contractStatus, employeeStatus),
      ),
    [assignedIds, pickerEmployees, employeeStatus],
  );
  const allEmployees = React.useMemo(
    () => visiblePickerEmployees.map((e) => ({ id: e.id, name: e.name })),
    [visiblePickerEmployees],
  );
  const [recomputeOpen, setRecomputeOpen] = React.useState(false);
  const pageEnterRecomputeDone = React.useRef(false);

  const [filters, setFilters] = usePersistedFilterState<DaySummariesFilters>(
    attendanceFiltersKey('day-summaries', companyId, 'filters'),
    {
      status: 'all',
      isManualOverride: 'all',
    },
  );

  const [columnVisibility, setColumnVisibility] = usePersistedFilterState<DaySummaryColumnVisibility>(
    attendanceFiltersKey('day-summaries', companyId, 'columnVisibility'),
    DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY,
  );

  const normalizedColumnVisibility = React.useMemo(
    () => normalizeDaySummaryColumnVisibility(columnVisibility),
    [columnVisibility],
  );

  const toggleColumnVisibility = React.useCallback((key: DaySummaryOptionalColumnKey) => {
    setColumnVisibility((prev) => {
      const next = normalizeDaySummaryColumnVisibility(prev);
      return { ...next, [key]: !next[key] };
    });
  }, [setColumnVisibility]);

  const resetColumnVisibility = React.useCallback(() => {
    setColumnVisibility(DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY);
  }, [setColumnVisibility]);

  const defaultPeriod = React.useMemo(() => {
    const ym = currentYearMonth();
    return monthDateBounds(ym.year, ym.month);
  }, []);

  const onPeriodChange = React.useCallback((range: { from: string; to: string }) => {
    const normalized = normalizePeriodRange(range);
    if (!normalized) return;
    setPeriodBounds(normalized);
  }, [setPeriodBounds]);

  const onPeriodFilterClear = React.useCallback(() => {
    const ym = currentYearMonth();
    const bounds = monthDateBounds(ym.year, ym.month);
    setPeriodBounds(bounds);
  }, [setPeriodBounds]);

  const periodFilterActive = isPeriodFilterActive({ from, to }, defaultPeriod);

  /** The list query of the current filters (no paging); null when it matches nothing. */
  const buildListQuery = React.useCallback((): DaySummaryListQuery | null => {
    if (!companyId || !from || !to || from > to) return null;
    // The branch is filtered on the server (`branchId`), not by sending every
    // employee id of the branch (no cap on the branch size, no long URLs).
    return {
      companyId,
      from,
      to,
      ...(assignedBranchId !== 'all' ? { branchId: assignedBranchId } : {}),
      ...(selectedEmpIds.size > 0 ? { employeeIds: [...selectedEmpIds] } : {}),
      ...org.query,
      ...listSortQuery(sort.sort),
      ...employeeStatusQuery(employeeStatus),
      ...(filters.status !== 'all' ? { status: filters.status } : {}),
      ...(filters.isManualOverride === 'true' ? { isManualOverride: true } : {}),
      ...(filters.isManualOverride === 'false' ? { isManualOverride: false } : {}),
    };
  }, [assignedBranchId, companyId, employeeStatus, filters, from, selectedEmpIds, to, org.query, sort.sort]);

  const load = React.useCallback(async () => {
    if (!companyId) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    if (!from || !to || from > to) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (!pageEnterRecomputeDone.current) {
        pageEnterRecomputeDone.current = true;
        await recomputeTodayDaySummaries(companyId);
      }

      const query = buildListQuery();
      // Grouped, the rows load per group (useGroupedList), not as pages.
      if (!query || groupBy) {
        setItems([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const res = await attendanceDaySummariesApi.getAll({ ...query, page, limit });
      setItems(res.items);
      setTotal(res.pagination.total);
    } catch (err) {
      handleApiError(err, 'day-summaries.load');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [buildListQuery, companyId, from, groupBy, limit, page, to]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const listQuery = buildListQuery();
  // The groups (counts, subtotals, grand total) over every filtered row; when
  // not grouped, only the grand total for the table's totals row.
  const grouped = useGroupedList({
    enabled: listQuery != null,
    groupBy,
    resetKey: JSON.stringify(listQuery),
    fetchGroups: async () => {
      const query = buildListQuery();
      if (!query) throw new Error('no query');
      await recomputeTodayDaySummaries(companyId);
      const { sortBy: _sortBy, sortDir: _sortDir, ...filters } = query;
      return attendanceDaySummariesApi.groups({ ...filters, ...listGroupQuery(groupBy) });
    },
    fetchGroupRows: (groupValue, p, l) =>
      attendanceDaySummariesApi.getAll({
        ...(buildListQuery() ?? {}),
        ...listGroupQuery(groupBy),
        groupValue,
        page: p,
        limit: l,
      }),
  });

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  React.useEffect(() => {
    setPage(1);
  }, [
    assignedBranchId, employeeStatus, from, to, selectedEmpKey, filters.status, filters.isManualOverride, limit,
    org.resetKey, sort.sortKey,
  ]);

  const patchFilters = (patch: Partial<DaySummariesFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => [
    assignedBranchSelect,
    {
      id: 'status',
      value: filters.status,
      onChange: (v) => patchFilters({ status: (v || 'all') as DaySummariesFilters['status'] }),
      placeholder: 'الحالة',
      className: 'w-[8.5rem]',
      options: [
        { value: 'all', label: 'كل الحالات' },
        ...DAY_SUMMARY_STATUS_ORDER.map((s) => ({
          value: s,
          label: DAY_SUMMARY_STATUS_LABELS[s],
        })),
      ],
    },
    {
      id: 'manualOverride',
      value: filters.isManualOverride,
      onChange: (v) => patchFilters({ isManualOverride: (v || 'all') as DaySummariesFilters['isManualOverride'] }),
      placeholder: 'تعديل يدوي',
      className: 'w-[8rem]',
      options: [
        { value: 'all', label: 'الكل' },
        { value: 'true', label: 'يدوي فقط' },
        { value: 'false', label: 'آلي فقط' },
      ],
    },
    ...org.inlineSelects,
  ], [assignedBranchSelect, filters.isManualOverride, filters.status, org.inlineSelects]);

  const activeFilterCount =
    (periodFilterActive ? 1 : 0)
    + (isEmployeeStatusFilterActive(employeeStatus) ? 1 : 0)
    + (assignedBranchId !== 'all' ? 1 : 0)
    + (selectedEmpIds.size > 0 ? 1 : 0)
    + (filters.status !== 'all' ? 1 : 0)
    + (filters.isManualOverride !== 'all' ? 1 : 0)
    + org.activeCount;

  const exportColumns = React.useMemo(
    () =>
      daySummaryExportColumns(
        normalizedColumnVisibility,
        includeBranchColumn ? { branchByEmployeeId } : undefined,
      ),
    [branchByEmployeeId, includeBranchColumn, normalizedColumnVisibility],
  );

  // Every active filter and the order, printed under the register's title.
  const exportSubtitleLines = React.useMemo(() => {
    const lines = [
      `الفترة: ${from} — ${to}`,
      `حالة الموظفين: ${employeeStatusFilterLabelAr(employeeStatus)}`,
    ];
    if (selectedBranchNameAr) lines.push(`الفرع: ${selectedBranchNameAr}`);
    else if (includeBranchColumn) lines.push('الفرع: كل الفروع');
    lines.push(...org.summaryLines);
    if (selectedEmpIds.size > 0) {
      const names = pickerEmployees.filter((e) => selectedEmpIds.has(e.id)).map((e) => e.name);
      lines.push(names.length > 0 && names.length <= 5
        ? `الموظفون: ${names.join('، ')}`
        : `الموظفون: ${selectedEmpIds.size} موظف محدد`);
    }
    if (filters.status !== 'all') lines.push(`حالة اليوم: ${DAY_SUMMARY_STATUS_LABELS[filters.status]}`);
    if (filters.isManualOverride === 'true') lines.push('التعديل: يدوي فقط');
    if (filters.isManualOverride === 'false') lines.push('التعديل: آلي فقط');
    if (sort.label) lines.push(sort.label);
    if (group.label) lines.push(group.label);
    return lines;
  }, [
    from, to, employeeStatus, selectedBranchNameAr, includeBranchColumn, org.summaryLines,
    selectedEmpIds, pickerEmployees, filters.status, filters.isManualOverride, sort.label, group.label,
  ]);

  // Every filtered row (all pages) in the screen's order — grouped like the
  // screen, with each group's subtotals and the grand total.
  const getExportRows = useLatestCallback(async () => {
    const query = buildListQuery();
    if (!query) return [];
    const { sortBy: _sortBy, sortDir: _sortDir, ...filters } = query;
    const [{ items: all }, summary] = await Promise.all([
      fetchAllPaginatedItems((p, l) =>
        attendanceDaySummariesApi.getAll({ ...query, ...listGroupQuery(groupBy), page: p, limit: l }),
      ),
      attendanceDaySummariesApi.groups({ ...filters, ...listGroupQuery(groupBy) }),
    ]);
    const branchMap = includeBranchColumn
      ? await resolveBranchByEmployeeId()
      : undefined;
    const columns = branchMap
      ? daySummaryExportColumns(normalizedColumnVisibility, { branchByEmployeeId: branchMap })
      : exportColumns;
    return registerExportRows({
      columns,
      rows: all,
      total: summary.total,
      grouping: groupBy && group.option
        ? {
            fieldLabel: group.option.label,
            groups: group.sortGroups(summary.groups),
            labelOf: group.labelOf,
            groupKeyOf: (row) => row.groupKey,
          }
        : undefined,
    });
  });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <DaySummaryColumnsPicker
          visibility={normalizedColumnVisibility}
          onToggle={toggleColumnVisibility}
          onReset={resetColumnVisibility}
        />
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <ListSortMenu model={sort} />
        <ListGroupMenu model={group} />
        <ListSavedViews storageKey={stateKeys.views} prefixes={stateKeys.prefixes} />
        <RegisterExportMenu
          title="كشف الحضور"
          fileName={`attendance-day-summaries-${from}-${to}`}
          columns={exportColumns}
          getRows={getExportRows}
          pinnedColumnCount={includeBranchColumn ? 4 : 3}
          subtitleLines={exportSubtitleLines}
          landscape
        />
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
      </div>
    ),
    [
      activeFilterCount,
      exportSubtitleLines,
      exportColumns,
      from,
      includeBranchColumn,
      sort.sortKey,
      group.groupKey,
      JSON.stringify(group.group?.order),
      stateKeys.views,
      getExportRows,
      normalizedColumnVisibility,
      resetColumnVisibility,
      to,
      toggleColumnVisibility,
    ],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showStatusSection={false}
        periodValue={{ from, to }}
        onPeriodChange={onPeriodChange}
        defaultPeriod={defaultPeriod}
        onPeriodFilterClear={onPeriodFilterClear}
        empPickerEmployees={visiblePickerEmployees}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        employeeStatus={employeeStatus}
        onEmployeeStatusChange={setEmployeeStatus}
        inlineSelects={inlineSelects}
      />
    ),
    [
      from,
      employeeStatus,
      to,
      periodFilterActive,
      assignedBranchId,
      filters.status,
      filters.isManualOverride,
      selectedEmpKey,
      visiblePickerEmployees,
      inlineSelects,
      onPeriodChange,
      onPeriodFilterClear,
    ],
  );

  return {
    items,
    total,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    from,
    to,
    selectedEmpIds,
    allEmployees,
    recomputeOpen,
    setRecomputeOpen,
    reload: async () => {
      await load();
      await grouped.reload();
    },
    columnVisibility: normalizedColumnVisibility,
    sort,
    group,
    grouped,
  };
}
