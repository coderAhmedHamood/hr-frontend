'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  monthlyInputsApi,
  type MonthlyInputDirectionDto,
  type MonthlyInputKindDto,
  type MonthlyInputResponseDto,
  type MonthlyInputSourceKindDto,
} from '@/features/hr/payroll/lib/api/monthly-inputs';
import { payrollPeriodsApi, type PayrollPeriodResponseDto } from '@/features/hr/payroll/lib/api/payroll-periods';
import { formatPayrollPeriodLabel } from '@/features/hr/payroll/monthly-inputs/constants/monthly-input-labels';
import { fetchEmployeeFilterPickerOptions } from '@/features/hr/lib/use-employee-filter-picker';
import type { EmployeePickerOption } from '@/components/ui/employee-picker';

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

export function useMonthlyInputsDirectoryModel() {
  const searchParams = useSearchParams();
  const companyId = useDefaultCompanyId();

  const [periods, setPeriods] = React.useState<PayrollPeriodResponseDto[]>([]);
  const periodsFetchStarted = React.useRef(false);
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const [empPickerEmployees, setEmpPickerEmployees] = React.useState<EmployeePickerOption[]>([]);
  const [employeePickerLoading, setEmployeePickerLoading] = React.useState(false);
  const employeesFetchStarted = React.useRef(false);

  const [filters, setFilters] = React.useState<MonthlyInputsFilters>(() => ({
    payrollPeriodId: searchParams.get('period') ?? 'all',
    inputKind: 'all',
    direction: 'all',
    sourceKind: 'all',
    affectsSalary: 'all',
  }));

  React.useEffect(() => {
    const periodFromUrl = searchParams.get('period');
    if (!periodFromUrl) return;
    setFilters((f) => (f.payrollPeriodId === periodFromUrl ? f : { ...f, payrollPeriodId: periodFromUrl }));
  }, [searchParams]);

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

  const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as MonthlyInputResponseDto[], total: 0 };
    try {
      const res = await monthlyInputsApi.list({
        companyId,
        page,
        limit: pageSize,
        ...(filters.payrollPeriodId !== 'all' ? { payrollPeriodId: filters.payrollPeriodId } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(filters.inputKind !== 'all' ? { inputKind: filters.inputKind } : {}),
        ...(filters.direction !== 'all' ? { direction: filters.direction } : {}),
        ...(filters.sourceKind !== 'all' ? { sourceKind: filters.sourceKind } : {}),
        ...(filters.affectsSalary === 'true' ? { affectsSalary: true } : {}),
        ...(filters.affectsSalary === 'false' ? { affectsSalary: false } : {}),
      });
      return { items: res.items, total: res.pagination.total };
    } catch (err) {
      handleApiError(err, 'monthly-inputs.load');
      return { items: [], total: 0 };
    }
  }, [companyId, employeeId, filters]);

  const {
    items,
    loading,
    pagination,
    reload: reloadInputs,
  } = useServerDirectoryPagination(loadPage, {
    enabled: !!companyId,
    resetDeps: [filters, employeeId],
  });

  const periodOptions = React.useMemo(
    () => periods.map((p) => ({
      value: p.id,
      label: formatPayrollPeriodLabel(p.periodYear, p.periodMonth),
    })),
    [periods],
  );

  const patchFilters = React.useCallback((patch: Partial<MonthlyInputsFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  const activeFilterCount =
    (filters.payrollPeriodId !== 'all' ? 1 : 0) +
    (filters.inputKind !== 'all' ? 1 : 0) +
    (filters.direction !== 'all' ? 1 : 0) +
    (filters.sourceKind !== 'all' ? 1 : 0) +
    (filters.affectsSalary !== 'all' ? 1 : 0) +
    (selectedEmpIds.size > 0 ? 1 : 0);

  const clearFilters = React.useCallback(() => {
    setFilters({
      payrollPeriodId: 'all',
      inputKind: 'all',
      direction: 'all',
      sourceKind: 'all',
      affectsSalary: 'all',
    });
    setSelectedEmpIds(new Set());
  }, []);

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
    empPickerEmployees,
    employeePickerLoading,
    loadEmployeePicker,
    activeFilterCount,
    clearFilters,
    reload: reloadInputs,
  };
}
