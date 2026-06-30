'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult, fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import type { HRDisciplineInvestigationRecord, HRInvestigationRecommendation, HRInvestigationResult } from '@/features/hr/discipline/lib/types';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { companiesApi } from '@/features/hr/organization/lib/api/companies';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { violationRecordsApi } from '@/features/hr/discipline/lib/api/violation-records';
import {
  disciplineInvestigationsApi,
  type CreateDisciplineInvestigationWithResultsDto,
  type InvestigationResultDto,
} from '@/features/hr/discipline/lib/api/discipline-investigations';
import {
  createDisciplineInvestigationWithResults,
  mapDisciplineInvestigationResponse,
  openDisciplineInvestigation,
  submitDisciplineInvestigationResults,
} from '@/features/hr/discipline/investigations/services/discipline-investigations.service';
import type { SubmitDisciplineInvestigationResultsDto } from '@/features/hr/discipline/lib/api/discipline-investigations';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';

const PAGE_LIMIT = 200;

export type InvestigationEmployeeOption = {
  id: string;
  nameAr: string;
};

export type InvestigationCaseOption = {
  id: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
};

export type InvestigationListFilters = {
  selectedEmpIds: string[];
  resultFilter: 'all' | HRInvestigationResult;
  recommendationFilter: 'all' | HRInvestigationRecommendation;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: InvestigationListFilters = {
  selectedEmpIds: [],
  resultFilter: 'all',
  recommendationFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

function applyInvestigationClientFilters(
  investigations: HRDisciplineInvestigationRecord[],
  filters: InvestigationListFilters,
): HRDisciplineInvestigationRecord[] {
  const selected = new Set(filters.selectedEmpIds);
  return investigations.filter((inv) => {
    if (selected.size > 0 && !selected.has(inv.employeeId)) return false;
    if (!matchesDateRange(inv.date, filters.dateFrom, filters.dateTo)) return false;
    if (filters.recommendationFilter !== 'all' && inv.recommendationType !== filters.recommendationFilter) {
      return false;
    }
    return true;
  });
}

export function useDisciplineInvestigationsDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<InvestigationListFilters>(DEFAULT_LIST_FILTERS);
  const [sourceInvestigations, setSourceInvestigations] = React.useState<HRDisciplineInvestigationRecord[]>([]);
  const [employees, setEmployees] = React.useState<InvestigationEmployeeOption[]>([]);
  const [cases, setCases] = React.useState<InvestigationCaseOption[]>([]);
  const [company, setCompany] = React.useState<{ id: string; nameAr: string; nameEn: string | null } | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);

  const companyIdRef = React.useRef<string | null>(null);
  const employeeNameByIdRef = React.useRef<Record<string, string>>({});

  const bulkMode = Boolean(
    listFilters.dateFrom
    || listFilters.dateTo
    || listFilters.recommendationFilter !== 'all'
    || listFilters.selectedEmpIds.length > 1,
  );

  const apiEmployeeId = listFilters.selectedEmpIds.length === 1
    ? listFilters.selectedEmpIds[0]
    : undefined;
  const apiResult = listFilters.resultFilter !== 'all' ? listFilters.resultFilter : undefined;

  const loadReferenceData = React.useCallback(async () => {
    const scope = await resolveOrganizationScope();
    const resolvedCompanyId = scope.companyId ?? null;
    setCompanyId(resolvedCompanyId);
    companyIdRef.current = resolvedCompanyId;

    const [companiesRes, employeesRes, casesRes] = await Promise.all([
      companiesApi.getAll({ limit: 50 }),
      employeesApi.getAll(
        resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
      ),
      violationRecordsApi.getAll(
        resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
      ),
    ]);

    const companies = ensurePaginatedResult(companiesRes).items;
    const selectedCompany =
      (resolvedCompanyId ? companies.find((c) => c.id === resolvedCompanyId) : companies[0]) ?? null;
    setCompany(
      selectedCompany
        ? { id: selectedCompany.id, nameAr: selectedCompany.nameAr, nameEn: selectedCompany.nameEn }
        : null,
    );

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

  const buildInvestigationsQuery = React.useCallback(
    (page: number, limit: number) => ({
      companyId: companyIdRef.current!,
      page,
      limit,
      ...(apiEmployeeId ? { subjectEmployeeId: apiEmployeeId } : {}),
      ...(apiResult ? { result: apiResult as InvestigationResultDto } : {}),
    }),
    [apiEmployeeId, apiResult],
  );

  const mapItems = React.useCallback(
    (raw: Awaited<ReturnType<typeof disciplineInvestigationsApi.getAll>>['items']) =>
      raw.map((inv) => mapDisciplineInvestigationResponse(inv, employeeNameByIdRef.current)),
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
      if (!companyIdRef.current) return { items: [], total: 0 };

      const res = await disciplineInvestigationsApi.getAll(buildInvestigationsQuery(page, pageSize));
      const items = mapItems(res.items);
      setSourceInvestigations(items);
      const filtered = applyInvestigationClientFilters(items, listFilters);
      return { items: bulkMode ? filtered : items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-investigations.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildInvestigationsQuery, bulkMode, listFilters, mapItems]);

  const loadBulk = React.useCallback(async () => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      if (!companyIdRef.current) return { items: [], total: 0 };

      const res = await fetchAllPaginatedItems((page, limit) =>
        disciplineInvestigationsApi.getAll(buildInvestigationsQuery(page, limit)),
      );
      const items = mapItems(res.items);
      setSourceInvestigations(items);
      const filtered = applyInvestigationClientFilters(items, listFilters);
      return { items: filtered, total: filtered.length };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-investigations.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildInvestigationsQuery, listFilters, mapItems]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<HRDisciplineInvestigationRecord>(loadPage, {
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [
      apiEmployeeId,
      apiResult,
      listFilters.dateFrom,
      listFilters.dateTo,
      listFilters.recommendationFilter,
      listFilters.selectedEmpIds.join(','),
    ],
  });

  const filteredItems = React.useMemo(
    () => applyInvestigationClientFilters(sourceInvestigations, listFilters),
    [listFilters, sourceInvestigations],
  );

  const dateFilteredItems = React.useMemo(
    () => sourceInvestigations.filter((inv) =>
      matchesDateRange(inv.date, listFilters.dateFrom, listFilters.dateTo),
    ),
    [listFilters.dateFrom, listFilters.dateTo, sourceInvestigations],
  );

  const openInvestigation = React.useCallback(
    async (payload: Parameters<typeof openDisciplineInvestigation>[0]) => {
      await openDisciplineInvestigation(payload);
      await reload();
    },
    [reload],
  );

  const submitResults = React.useCallback(
    async (id: string, payload: SubmitDisciplineInvestigationResultsDto) => {
      await submitDisciplineInvestigationResults(id, payload);
      await reload();
    },
    [reload],
  );

  const add = React.useCallback(
    async (payload: CreateDisciplineInvestigationWithResultsDto) => {
      await createDisciplineInvestigationWithResults(payload);
      await reload();
    },
    [reload],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await disciplineInvestigationsApi.remove(id);
      await reload();
    },
    [reload],
  );

  return {
    items,
    filteredItems,
    dateFilteredItems,
    sourceInvestigations,
    employees,
    cases,
    company,
    companyId,
    loading,
    pagination,
    listError,
    listFilters,
    setListFilters,
    add,
    openInvestigation,
    submitResults,
    remove,
    reload,
  };
}
