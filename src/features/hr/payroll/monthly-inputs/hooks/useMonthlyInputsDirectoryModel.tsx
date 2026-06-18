'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
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

  const [items, setItems] = React.useState<MonthlyInputResponseDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(30);
  const [loading, setLoading] = React.useState(true);
  const [periods, setPeriods] = React.useState<PayrollPeriodResponseDto[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const [filters, setFilters] = React.useState<MonthlyInputsFilters>(() => ({
    payrollPeriodId: searchParams.get('period') ?? 'all',
    inputKind: 'all',
    direction: 'all',
    sourceKind: 'all',
    affectsSalary: 'all',
  }));

  React.useEffect(() => {
    const periodFromUrl = searchParams.get('period');
    if (periodFromUrl) {
      setFilters((f) => ({ ...f, payrollPeriodId: periodFromUrl }));
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (!companyId) return;
    void payrollPeriodsApi.list({ companyId, limit: 200 }).then((res) => {
      setPeriods(res.items);
    }).catch(() => {
      setPeriods([]);
    });
  }, [companyId]);

  const employeeId = selectedEmpIds.size === 1 ? [...selectedEmpIds][0] : undefined;

  const load = React.useCallback(async () => {
    if (!companyId) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await monthlyInputsApi.list({
        companyId,
        page,
        limit,
        ...(filters.payrollPeriodId !== 'all' ? { payrollPeriodId: filters.payrollPeriodId } : {}),
        ...(employeeId ? { employeeId } : {}),
        ...(filters.inputKind !== 'all' ? { inputKind: filters.inputKind } : {}),
        ...(filters.direction !== 'all' ? { direction: filters.direction } : {}),
        ...(filters.sourceKind !== 'all' ? { sourceKind: filters.sourceKind } : {}),
        ...(filters.affectsSalary === 'true' ? { affectsSalary: true } : {}),
        ...(filters.affectsSalary === 'false' ? { affectsSalary: false } : {}),
      });
      setItems(res.items);
      setTotal(res.pagination.total);
    } catch (err) {
      handleApiError(err, 'monthly-inputs.load');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [companyId, employeeId, filters, limit, page]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [filters, employeeId, limit]);

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
    total,
    page,
    setPage,
    limit,
    setLimit,
    loading,
    filters,
    patchFilters,
    periodOptions,
    selectedEmpIds,
    setSelectedEmpIds,
    activeFilterCount,
    clearFilters,
    reload: load,
  };
}
