'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { listSortQuery, useListSort, type ListSortOption } from '@/components/ui/list-sort';
import {
  listGroupQuery,
  ORG_LIST_GROUP_OPTIONS,
  useGroupedList,
  useListGroup,
  type ListGroupMeasure,
  type ListGroupOption,
} from '@/components/ui/list-group';
import { listStateKeys } from '@/components/ui/list-saved-views';
import { useColumnVisibility, type ListColumnOption } from '@/components/ui/list-columns-picker';
import { useOrgFilter } from '@/features/hr/lib/use-org-filter';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import {
  monthlyInputsApi,
  type MonthlyInputDirectionDto,
  type MonthlyInputKindDto,
  type MonthlyInputResponseDto,
  type MonthlyInputSourceKindDto,
} from '@/features/hr/payroll/lib/api/monthly-inputs';
import { payrollPeriodsApi, type PayrollPeriodResponseDto } from '@/features/hr/payroll/lib/api/payroll-periods';
import {
  formatPayrollPeriodLabel,
  MONTHLY_INPUT_DIRECTION_LABELS,
  MONTHLY_INPUT_KIND_LABELS,
  MONTHLY_INPUT_SOURCE_KIND_LABELS,
} from '@/features/hr/payroll/monthly-inputs/constants/monthly-input-labels';
import { fetchEmployeeFilterPickerOptions } from '@/features/hr/lib/use-employee-filter-picker';
import type { EmployeePickerOption } from '@/components/ui/employee-picker';
import {
  hrFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/lib/use-persisted-filter-state';
import {
  EMPLOYEE_STATUS_FILTER_DEFAULT,
  employeeStatusQuery,
  isEmployeeStatusFilterActive,
  useEmployeeStatusFilter,
} from '@/features/hr/lib/employee-status-filter';

const periodsCatalogCache = new Map<string, PayrollPeriodResponseDto[]>();
let periodsCatalogInflight: { companyId: string; promise: Promise<PayrollPeriodResponseDto[]> } | null = null;

async function loadPayrollPeriodsCatalog(companyId: string): Promise<PayrollPeriodResponseDto[]> {
  const cached = periodsCatalogCache.get(companyId);
  if (cached) return cached;
  if (periodsCatalogInflight?.companyId === companyId) return periodsCatalogInflight.promise;

  const promise = payrollPeriodsApi
    .list({ companyId, limit: 200 })
    .then((res) => {
      periodsCatalogCache.set(companyId, res.items);
      return res.items;
    })
    .catch(() => [] as PayrollPeriodResponseDto[])
    .finally(() => {
      if (periodsCatalogInflight?.companyId === companyId) periodsCatalogInflight = null;
    });

  periodsCatalogInflight = { companyId, promise };
  return promise;
}

export type MonthlyInputsFilters = {
  payrollPeriodId: string;
  inputKind: 'all' | MonthlyInputKindDto;
  direction: 'all' | MonthlyInputDirectionDto;
  sourceKind: 'all' | MonthlyInputSourceKindDto;
  affectsSalary: 'all' | 'true' | 'false';
};

/** Fields the monthly-inputs list can be sorted by (server `sortBy` keys). */
export const MONTHLY_INPUTS_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'period', label: 'الفترة' },
  { key: 'employeeName', label: 'الموظف' },
  { key: 'employeeCode', label: 'رقم الموظف' },
  { key: 'inputKind', label: 'نوع المدخل' },
  { key: 'direction', label: 'الاتجاه' },
  { key: 'amount', label: 'المبلغ' },
  { key: 'sourceKind', label: 'المصدر' },
  { key: 'affectsSalary', label: 'يؤثر على الراتب' },
  { key: 'createdAt', label: 'تاريخ الإنشاء' },
];

/** Fields the monthly-inputs list can be grouped by (server `groupBy` keys). */
export const MONTHLY_INPUTS_GROUP_OPTIONS: readonly ListGroupOption[] = [
  { key: 'employee', label: 'الموظف' },
  ...ORG_LIST_GROUP_OPTIONS,
  {
    key: 'period',
    label: 'الفترة',
    orderByKey: true,
    formatKey: (k) => {
      const [y, m] = k.split('-').map(Number);
      return formatPayrollPeriodLabel(y || null, m || null);
    },
  },
  {
    key: 'inputKind',
    label: 'نوع المدخل',
    formatKey: (k) => MONTHLY_INPUT_KIND_LABELS[k as keyof typeof MONTHLY_INPUT_KIND_LABELS] ?? k,
  },
  {
    key: 'direction',
    label: 'الاتجاه',
    formatKey: (k) => MONTHLY_INPUT_DIRECTION_LABELS[k as keyof typeof MONTHLY_INPUT_DIRECTION_LABELS] ?? k,
  },
  {
    key: 'sourceKind',
    label: 'المصدر',
    emptyLabel: 'بدون مصدر',
    formatKey: (k) => MONTHLY_INPUT_SOURCE_KIND_LABELS[k as keyof typeof MONTHLY_INPUT_SOURCE_KIND_LABELS] ?? k,
  },
];

/** Group totals the groups can be ordered by. */
export const MONTHLY_INPUTS_GROUP_MEASURES: readonly ListGroupMeasure[] = [
  { key: 'net', label: 'الصافي' },
  { key: 'additions', label: 'الإضافات' },
  { key: 'deductions', label: 'الخصومات' },
];

/** Columns the user may hide (the employee always shows). */
export const MONTHLY_INPUTS_COLUMN_OPTIONS: readonly ListColumnOption[] = [
  { key: 'period', label: 'الفترة' },
  { key: 'kind', label: 'نوع المدخل' },
  { key: 'direction', label: 'الاتجاه' },
  { key: 'amount', label: 'المبلغ' },
  { key: 'source', label: 'المصدر' },
  { key: 'affects', label: 'يؤثر على الراتب' },
  { key: 'note', label: 'ملاحظة' },
];

export function useMonthlyInputsDirectoryModel() {
  const searchParams = useSearchParams();
  const companyId = useDefaultCompanyId();

  const [periods, setPeriods] = React.useState<PayrollPeriodResponseDto[]>([]);
  const periodsFetchStarted = React.useRef(false);
  const [selectedEmpIds, setSelectedEmpIds] = usePersistedEmpIdSet(
    hrFiltersKey('payroll', 'monthly-inputs', companyId, 'selectedEmpIds'),
  );
  const [employeeStatus, setEmployeeStatus] = useEmployeeStatusFilter(
    hrFiltersKey('payroll', 'monthly-inputs', companyId, 'employeeStatus'),
  );

  const org = useOrgFilter('payroll', 'monthly-inputs', companyId);
  const stateKeys = listStateKeys('payroll', 'monthly-inputs', companyId);
  const sort = useListSort(stateKeys.sort, MONTHLY_INPUTS_SORT_OPTIONS);
  const group = useListGroup(stateKeys.group, MONTHLY_INPUTS_GROUP_OPTIONS, MONTHLY_INPUTS_GROUP_MEASURES);
  const groupBy = group.groupBy;
  const columnVisibility = useColumnVisibility(
    hrFiltersKey('payroll', 'monthly-inputs', companyId, 'hiddenColumns'),
    MONTHLY_INPUTS_COLUMN_OPTIONS,
  );

  const [empPickerEmployees, setEmpPickerEmployees] = React.useState<EmployeePickerOption[]>([]);
  const [employeePickerLoading, setEmployeePickerLoading] = React.useState(false);
  const employeesFetchStarted = React.useRef(false);

  // Kept per user and screen like the other lists (a `?period=` link still wins).
  const [filters, setFilters] = usePersistedFilterState<MonthlyInputsFilters>(
    hrFiltersKey('payroll', 'monthly-inputs', companyId, 'filters'),
    {
      payrollPeriodId: searchParams.get('period') ?? 'all',
      inputKind: 'all',
      direction: 'all',
      sourceKind: 'all',
      affectsSalary: 'all',
    },
  );

  React.useEffect(() => {
    const periodFromUrl = searchParams.get('period');
    if (!periodFromUrl) return;
    setFilters((f) => (f.payrollPeriodId === periodFromUrl ? f : { ...f, payrollPeriodId: periodFromUrl }));
  }, [searchParams, setFilters]);

  React.useEffect(() => {
    periodsFetchStarted.current = false;
    setPeriods([]);
    employeesFetchStarted.current = false;
    setEmpPickerEmployees([]);
    setEmployeePickerLoading(false);
  }, [companyId]);

  const loadPeriods = React.useCallback(() => {
    if (!companyId || periodsFetchStarted.current) return;
    periodsFetchStarted.current = true;
    void loadPayrollPeriodsCatalog(companyId).then(setPeriods);
  }, [companyId]);

  const loadEmployeePicker = React.useCallback(() => {
    if (!companyId || employeesFetchStarted.current) return;
    employeesFetchStarted.current = true;
    setEmployeePickerLoading(true);
    void fetchEmployeeFilterPickerOptions(companyId)
      .then(setEmpPickerEmployees)
      .catch(() => setEmpPickerEmployees([]))
      .finally(() => setEmployeePickerLoading(false));
  }, [companyId]);

  React.useEffect(() => {
    if (filters.payrollPeriodId !== 'all') loadPeriods();
  }, [filters.payrollPeriodId, loadPeriods]);

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  // The list query of the current filters and order (one page).
  const listQuery = React.useCallback((page: number, pageSize: number) => ({
    companyId: companyId ?? '',
    page,
    limit: pageSize,
    ...(filters.payrollPeriodId !== 'all' ? { payrollPeriodId: filters.payrollPeriodId } : {}),
    ...(selectedEmpKey ? { employeeIds: selectedEmpKey.split(',') } : {}),
    ...employeeStatusQuery(employeeStatus),
    ...(filters.inputKind !== 'all' ? { inputKind: filters.inputKind } : {}),
    ...(filters.direction !== 'all' ? { direction: filters.direction } : {}),
    ...(filters.sourceKind !== 'all' ? { sourceKind: filters.sourceKind } : {}),
    ...(filters.affectsSalary === 'true' ? { affectsSalary: true } : {}),
    ...(filters.affectsSalary === 'false' ? { affectsSalary: false } : {}),
    ...org.query,
    ...listSortQuery(sort.sort),
  }), [companyId, selectedEmpKey, employeeStatus, filters, org.query, sort.sort]);

  const fetchListPage = React.useCallback(
    (page: number, pageSize: number) => monthlyInputsApi.list(listQuery(page, pageSize)),
    [listQuery],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as MonthlyInputResponseDto[], total: 0 };
    try {
      const res = await fetchListPage(page, pageSize);
      return { items: res.items, total: res.pagination.total };
    } catch (err) {
      handleApiError(err, 'monthly-inputs.load');
      return { items: [], total: 0 };
    }
  }, [companyId, fetchListPage]);

  /** The filters (no paging, no order) and `groupBy`, for `/groups`. */
  const groupsQuery = React.useCallback(() => {
    const { page: _p, limit: _l, sortBy: _sb, sortDir: _sd, ...filtersOnly } = listQuery(1, 1);
    return { ...filtersOnly, ...listGroupQuery(groupBy) };
  }, [listQuery, groupBy]);

  /**
   * Every input matching the current filters (all pages), with the groups
   * and totals — for export.
   */
  const fetchAllForExport = React.useCallback(async () => {
    if (!companyId) return null;
    const [{ items: all }, summary] = await Promise.all([
      fetchAllPaginatedItems((p, l) => monthlyInputsApi.list({ ...listQuery(p, l), ...listGroupQuery(groupBy) })),
      monthlyInputsApi.groups(groupsQuery()),
    ]);
    return { items: all, summary };
  }, [companyId, groupBy, groupsQuery, listQuery]);

  const {
    items,
    loading,
    pagination,
    reload: reloadInputs,
  } = useServerDirectoryPagination(loadPage, {
    // Grouped, the rows load per group (useGroupedList), not as pages.
    enabled: !!companyId && !groupBy,
    resetDeps: [filters, selectedEmpKey, employeeStatus, org.resetKey, sort.sortKey, groupBy],
  });

  // Groups (counts and amounts per group) and the grand total over every
  // filtered input; when not grouped, only the grand total for the totals row.
  const grouped = useGroupedList<MonthlyInputResponseDto>({
    enabled: !!companyId,
    groupBy,
    resetKey: JSON.stringify(listQuery(1, 1)),
    fetchGroups: () => monthlyInputsApi.groups(groupsQuery()),
    fetchGroupRows: (groupValue, p, l) =>
      monthlyInputsApi.list({ ...listQuery(p, l), ...listGroupQuery(groupBy), groupValue }),
  });

  const reloadAll = React.useCallback(async () => {
    if (!groupBy) await reloadInputs();
    await grouped.reload();
  }, [groupBy, grouped, reloadInputs]);

  const periodOptions = React.useMemo(
    () => periods.map((p) => ({
      value: p.id,
      label: formatPayrollPeriodLabel(p.periodYear, p.periodMonth),
    })),
    [periods],
  );

  const patchFilters = React.useCallback((patch: Partial<MonthlyInputsFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, [setFilters]);

  const activeFilterCount =
    (filters.payrollPeriodId !== 'all' ? 1 : 0) +
    (filters.inputKind !== 'all' ? 1 : 0) +
    (filters.direction !== 'all' ? 1 : 0) +
    (filters.sourceKind !== 'all' ? 1 : 0) +
    (filters.affectsSalary !== 'all' ? 1 : 0) +
    (selectedEmpIds.size > 0 ? 1 : 0) +
    (isEmployeeStatusFilterActive(employeeStatus) ? 1 : 0) +
    org.activeCount;

  const clearFilters = React.useCallback(() => {
    setFilters({
      payrollPeriodId: 'all',
      inputKind: 'all',
      direction: 'all',
      sourceKind: 'all',
      affectsSalary: 'all',
    });
    setSelectedEmpIds(new Set());
    setEmployeeStatus(EMPLOYEE_STATUS_FILTER_DEFAULT);
  }, [setEmployeeStatus, setFilters, setSelectedEmpIds]);

  return {
    items,
    total: pagination.total,
    page: pagination.page,
    setPage: pagination.setPage,
    limit: pagination.pageSize,
    setLimit: pagination.setPageSize,
    loading,
    filters,
    patchFilters,
    periodOptions,
    loadPeriods,
    selectedEmpIds,
    setSelectedEmpIds,
    employeeStatus,
    setEmployeeStatus,
    empPickerEmployees,
    employeePickerLoading,
    loadEmployeePicker,
    activeFilterCount,
    clearFilters,
    fetchAllForExport,
    reload: reloadAll,
    org,
    sort,
    group,
    grouped,
    stateKeys,
    columnVisibility,
  };
}
