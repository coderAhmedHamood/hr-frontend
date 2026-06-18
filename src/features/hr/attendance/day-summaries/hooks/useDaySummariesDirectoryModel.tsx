'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  attendanceDaySummariesApi,
  type AttendanceDayStatus,
  type DaySummaryResponseDto,
} from '@/features/hr/attendance/lib/api/attendance-day-summaries';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import {
  AR_MONTH_NAMES,
  DAY_SUMMARY_STATUS_LABELS,
  DAY_SUMMARY_STATUS_ORDER,
} from '@/features/hr/attendance/day-summaries/constants/day-summary-labels';
import {
  currentYearMonth,
  monthDateBounds,
  yearOptions,
} from '@/features/hr/attendance/day-summaries/utils/month-date-range';
import { Button } from '@/components/ui/button';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EntityFilterToolbar, type EntityFilterInlineSelect } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';

export type DaySummariesFilters = {
  status: 'all' | AttendanceDayStatus;
  isManualOverride: 'all' | 'true' | 'false';
};

export function useDaySummariesDirectoryModel() {
  const companyId = useDefaultCompanyId();
  const initialYm = currentYearMonth();
  const initialBounds = monthDateBounds(initialYm.year, initialYm.month);

  const [year, setYear] = React.useState(initialYm.year);
  const [month, setMonth] = React.useState(initialYm.month);
  const [from, setFrom] = React.useState(initialBounds.from);
  const [to, setTo] = React.useState(initialBounds.to);
  const [customRange, setCustomRange] = React.useState(false);

  const [items, setItems] = React.useState<DaySummaryResponseDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(50);
  const [loading, setLoading] = React.useState(true);
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [allEmployees, setAllEmployees] = React.useState<{ id: string; name: string }[]>([]);
  const [recomputeOpen, setRecomputeOpen] = React.useState(false);

  const [filters, setFilters] = React.useState<DaySummariesFilters>({
    status: 'all',
    isManualOverride: 'all',
  });

  React.useEffect(() => {
    if (!companyId) {
      setAllEmployees([]);
      return;
    }
    void employeesApi
      .getAll({ companyId, limit: 500 })
      .then((res) => {
        setAllEmployees(res.items.map((e) => ({ id: e.id, name: e.nameAr })));
      })
      .catch((err) => {
        handleApiError(err, 'day-summaries.employees');
        setAllEmployees([]);
      });
  }, [companyId]);

  const empPickerList = React.useMemo(() => allEmployees, [allEmployees]);

  const applyMonthBounds = React.useCallback((y: number, m: number) => {
    const bounds = monthDateBounds(y, m);
    setFrom(bounds.from);
    setTo(bounds.to);
    setCustomRange(false);
  }, []);

  const onYearChange = (value: string) => {
    const y = Number(value);
    setYear(y);
    if (!customRange) applyMonthBounds(y, month);
  };

  const onMonthChange = (value: string) => {
    const m = Number(value);
    setMonth(m);
    if (!customRange) applyMonthBounds(year, m);
  };

  const onFromChange = (value: string) => {
    setFrom(value);
    setCustomRange(true);
  };

  const onToChange = (value: string) => {
    setTo(value);
    setCustomRange(true);
  };

  const syncToSelectedMonth = () => {
    applyMonthBounds(year, month);
  };

  const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;

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
      const res = await attendanceDaySummariesApi.getAll({
        companyId,
        page: selectedEmpIds.size > 1 ? 1 : page,
        limit: selectedEmpIds.size > 1 ? 2000 : limit,
        from,
        to,
        ...(employeeId ? { employeeId } : {}),
        ...(filters.status !== 'all' ? { status: filters.status } : {}),
        ...(filters.isManualOverride === 'true' ? { isManualOverride: true } : {}),
        ...(filters.isManualOverride === 'false' ? { isManualOverride: false } : {}),
      });
    if (selectedEmpIds.size > 1) {
      const filtered = res.items.filter((r) => selectedEmpIds.has(r.employeeId));
      const start = (page - 1) * limit;
      setItems(filtered.slice(start, start + limit));
      setTotal(filtered.length);
    } else {
      setItems(res.items);
      setTotal(res.pagination.total);
    }
    } catch (err) {
      handleApiError(err, 'day-summaries.load');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, employeeId, filters, from, limit, page, selectedEmpIds, to]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [from, to, employeeId, filters.status, filters.isManualOverride, selectedEmpIds.size, limit]);

  const patchFilters = (patch: Partial<DaySummariesFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  const yearMonthFilters = (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={String(year)} onValueChange={onYearChange}>
        <SelectTrigger className="h-8 w-[5.5rem] text-xs">
          <SelectValue placeholder="السنة" />
        </SelectTrigger>
        <SelectContent>
          {yearOptions(year).map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(month)} onValueChange={onMonthChange}>
        <SelectTrigger className="h-8 w-[7.5rem] text-xs">
          <SelectValue placeholder="الشهر" />
        </SelectTrigger>
        <SelectContent>
          {AR_MONTH_NAMES.map((label, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1.5">
        <DatePickerInput
          id="day-summaries-from"
          value={from}
          onChange={onFromChange}
          className="h-8 w-[9.5rem] text-xs"
        />
        <span className="text-xs text-muted-foreground">—</span>
        <DatePickerInput
          id="day-summaries-to"
          value={to}
          onChange={onToChange}
          className="h-8 w-[9.5rem] text-xs"
        />
      </div>
      {customRange ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-8 px-1 text-xs text-primary"
          onClick={syncToSelectedMonth}
        >
          مواءمة مع {AR_MONTH_NAMES[month - 1]} {year}
        </Button>
      ) : null}
    </div>
  );

  const inlineSelects = React.useMemo((): EntityFilterInlineSelect[] => [
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

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        leadingFilters={yearMonthFilters}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        inlineSelects={inlineSelects}
        onDateBoundsChange={() => {}}
        trailingActions={(
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setRecomputeOpen(true)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            تحديث البيانات
          </Button>
        )}
      />
    ),
    [
      year,
      month,
      from,
      to,
      customRange,
      filters.status,
      filters.isManualOverride,
      selectedEmpKey,
      empPickerList,
      inlineSelects,
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
  };
}
