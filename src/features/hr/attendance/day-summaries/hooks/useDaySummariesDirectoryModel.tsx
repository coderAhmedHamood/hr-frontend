'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  attendanceDaySummariesApi,
  type AttendanceDayStatus,
  type DaySummaryResponseDto,
} from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { useEmployeeFilterPicker } from '@/features/hr/lib/use-employee-filter-picker';
import {
  DAY_SUMMARY_STATUS_LABELS,
  DAY_SUMMARY_STATUS_ORDER,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-labels';
import {
  currentYearMonth,
  monthDateBounds,
} from '@/features/hr/attendance/day-summaries/utils/month-date-range';
import { isPeriodFilterActive, normalizePeriodRange } from '@/features/hr/discipline/lib/discipline-date-filter';
import { Button } from '@/components/ui/button';
import { ListFilterBar, type ListFilterInlineSelect } from '@/components/ui/list-filter-bar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { recomputeTodayDaySummaries } from '@/features/hr/attendance/lib/api/recompute-today-day-summaries';
import {
  attendanceFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/attendance/lib/use-persisted-filter-state';
import { DaySummaryColumnsPicker } from '@/features/hr/attendance/day-summaries/components/day-summary-columns-picker';
import {
  DEFAULT_DAY_SUMMARY_COLUMN_VISIBILITY,
  normalizeDaySummaryColumnVisibility,
  type DaySummaryColumnVisibility,
  type DaySummaryOptionalColumnKey,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-column-config';

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
  const allEmployees = React.useMemo(
    () => pickerEmployees.map((e) => ({ id: e.id, name: e.name })),
    [pickerEmployees],
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

      const res = await attendanceDaySummariesApi.getAll({
        companyId,
        page,
        limit,
        from,
        to,
        ...(selectedEmpIds.size > 0 ? { employeeIds: [...selectedEmpIds] } : {}),
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.isManualOverride === 'true' ? { isManualOverride: true } : {}),
        ...(filters.isManualOverride === 'false' ? { isManualOverride: false } : {}),
      });
      setItems(res.items);
      setTotal(res.pagination.total);
    } catch (err) {
      handleApiError(err, 'day-summaries.load');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, filters, from, limit, page, selectedEmpIds, to]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  React.useEffect(() => {
    setPage(1);
  }, [from, to, selectedEmpKey, filters.status, filters.isManualOverride, limit]);

  const patchFilters = (patch: Partial<DaySummariesFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => [
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
  ], [filters.isManualOverride, filters.status]);

  const activeFilterCount =
    (periodFilterActive ? 1 : 0)
    + (selectedEmpIds.size > 0 ? 1 : 0)
    + (filters.status !== 'all' ? 1 : 0)
    + (filters.isManualOverride !== 'all' ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <DaySummaryColumnsPicker
          visibility={normalizedColumnVisibility}
          onToggle={toggleColumnVisibility}
          onReset={resetColumnVisibility}
        />
        <FilterToggleButton activeFilterCount={activeFilterCount} />
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
    [activeFilterCount, normalizedColumnVisibility, resetColumnVisibility, toggleColumnVisibility],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showStatusSection={false}
        periodValue={{ from, to }}
        onPeriodChange={onPeriodChange}
        defaultPeriod={defaultPeriod}
        onPeriodFilterClear={onPeriodFilterClear}
        empPickerEmployees={pickerEmployees}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        inlineSelects={inlineSelects}
      />
    ),
    [
      from,
      to,
      periodFilterActive,
      filters.status,
      filters.isManualOverride,
      selectedEmpKey,
      pickerEmployees,
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
    reload: load,
    columnVisibility: normalizedColumnVisibility,
  };
}
