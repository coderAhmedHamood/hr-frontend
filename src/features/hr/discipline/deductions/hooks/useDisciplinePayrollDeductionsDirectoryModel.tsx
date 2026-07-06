'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import type { HRDisciplinePayrollDeductionRecord } from '@/features/hr/discipline/lib/types';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  disciplinePayrollDeductionsApi,
  type CreateDisciplinePayrollDeductionDto,
  type UpdateDisciplinePayrollDeductionDto,
  type PayrollDeductionStatusDto,
  type PayrollDeductionTypeDto,
} from '@/features/hr/discipline/lib/api/discipline-payroll-deductions';
import {
  mapDisciplinePayrollDeductionResponse,
} from '@/features/hr/discipline/deductions/services/discipline-payroll-deductions.service';
import type { HRDeductionStatus, HRViolationDeductionKind } from '@/features/hr/discipline/lib/types';

const PAGE_LIMIT = 200;

export type DeductionFetchParams = {
  employeeId?: string;
  status?: PayrollDeductionStatusDto;
  deductionType?: PayrollDeductionTypeDto;
};

export type DeductionListFilters = {
  selectedEmpIds: string[];
  statusFilter: 'all' | HRDeductionStatus;
  kindFilter: 'all' | Exclude<HRViolationDeductionKind, 'none'>;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: DeductionListFilters = {
  selectedEmpIds: [],
  statusFilter: 'all',
  kindFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

export type DeductionEmployeeOption = {
  id: string;
  nameAr: string;
};

export type DeductionCaseOption = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
};

export function useDisciplinePayrollDeductionsDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<DeductionListFilters>(DEFAULT_LIST_FILTERS);
  const [employees, setEmployees] = React.useState<DeductionEmployeeOption[]>([]);
  const [cases, setCases] = React.useState<DeductionCaseOption[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);

  const companyIdRef = React.useRef<string | null>(null);
  const employeeNameByIdRef = React.useRef<Record<string, string>>({});

  const apiParams = React.useMemo((): DeductionFetchParams => {
    const params: DeductionFetchParams = {};
    if (listFilters.statusFilter !== 'all') {
      params.status = listFilters.statusFilter as PayrollDeductionStatusDto;
    }
    if (listFilters.kindFilter !== 'all') {
      params.deductionType = listFilters.kindFilter as PayrollDeductionTypeDto;
    }
    return params;
  }, [listFilters]);

  const loadReferenceData = React.useCallback(async () => {
    const scope = await resolveOrganizationScope();
    const resolvedCompanyId = scope.companyId ?? null;
    setCompanyId(resolvedCompanyId);
    companyIdRef.current = resolvedCompanyId;

    const baseQuery = resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT };
    const [employeesRes, casesRes] = await Promise.all([
      employeesApi.getAll(baseQuery),
      violationRecordsApi.getAll(baseQuery),
    ]);

    const employeesItems = ensurePaginatedResult(employeesRes).items;
    const employeeNameById = Object.fromEntries(employeesItems.map((emp) => [emp.id, emp.nameAr]));
    employeeNameByIdRef.current = employeeNameById;
    setEmployees(employeesItems.map((emp) => ({ id: emp.id, nameAr: emp.nameAr })));

    const caseItems = ensurePaginatedResult(casesRes).items;
    setCases(caseItems.map((c) => ({
      id: c.id,
      caseNumber: c.recordNumber,
      employeeId: c.employeeId,
      employeeNameAr: employeeNameById[c.employeeId] ?? c.employeeId,
    })));
  }, []);

  React.useEffect(() => {
    void loadReferenceData().catch(() => undefined);
  }, [loadReferenceData]);

  const buildDeductionsQuery = React.useCallback(
    (page: number, limit: number) => {
      const baseQuery = companyIdRef.current
        ? { companyId: companyIdRef.current, page, limit }
        : { page, limit };
      return {
        ...baseQuery,
        ...(listFilters.selectedEmpIds.length > 0 ? { employeeIds: listFilters.selectedEmpIds } : {}),
        ...(apiParams.status ? { status: apiParams.status } : {}),
        ...(apiParams.deductionType ? { deductionType: apiParams.deductionType } : {}),
        ...(listFilters.dateFrom ? { createdFrom: listFilters.dateFrom } : {}),
        ...(listFilters.dateTo ? { createdTo: listFilters.dateTo } : {}),
      };
    },
    [apiParams, listFilters],
  );

  const mapItems = React.useCallback(
    (raw: Awaited<ReturnType<typeof disciplinePayrollDeductionsApi.getAll>>['items']) =>
      raw.map((d) => mapDisciplinePayrollDeductionResponse(d, employeeNameByIdRef.current)),
    [],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      const res = await disciplinePayrollDeductionsApi.getAll(buildDeductionsQuery(page, pageSize));
      const items = mapItems(res.items);
      setApiAccessDenied(false);
      return { items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'discipline-payroll-deductions.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [buildDeductionsQuery, mapItems]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<HRDisciplinePayrollDeductionRecord>(loadPage, {
    resetDeps: [
      apiParams.status,
      apiParams.deductionType,
      listFilters.dateFrom,
      listFilters.dateTo,
      listFilters.selectedEmpIds.join(','),
    ],
  });

  // Server applies all list filters now; kept as aliases for existing consumers.
  const filteredItems = items;
  const dateFilteredItems = items;

  const add = React.useCallback(
    async (payload: CreateDisciplinePayrollDeductionDto) => {
      await disciplinePayrollDeductionsApi.create(payload);
      await reload();
    },
    [reload],
  );

  const update = React.useCallback(
    async (id: string, payload: UpdateDisciplinePayrollDeductionDto) => {
      await disciplinePayrollDeductionsApi.update(id, payload);
      await reload();
    },
    [reload],
  );

  const sendToPayroll = React.useCallback(
    async (id: string) => {
      await disciplinePayrollDeductionsApi.sendToPayroll(id);
      await reload();
    },
    [reload],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await disciplinePayrollDeductionsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    items,
    filteredItems,
    dateFilteredItems,
    sourceDeductions: items,
    employees,
    cases,
    companyId,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    listFilters,
    setListFilters,
    reload,
    add,
    update,
    sendToPayroll,
    remove,
  };
}
