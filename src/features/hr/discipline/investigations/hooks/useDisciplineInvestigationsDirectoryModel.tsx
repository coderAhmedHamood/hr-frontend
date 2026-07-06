'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
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
  type InvestigationRecommendationDto,
} from '@/features/hr/discipline/lib/api/discipline-investigations';
import {
  createDisciplineInvestigationWithResults,
  mapDisciplineInvestigationResponse,
  openDisciplineInvestigation,
  submitDisciplineInvestigationResults,
} from '@/features/hr/discipline/investigations/services/discipline-investigations.service';
import type { SubmitDisciplineInvestigationResultsDto } from '@/features/hr/discipline/lib/api/discipline-investigations';

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

export function useDisciplineInvestigationsDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<InvestigationListFilters>(DEFAULT_LIST_FILTERS);
  const [employees, setEmployees] = React.useState<InvestigationEmployeeOption[]>([]);
  const [cases, setCases] = React.useState<InvestigationCaseOption[]>([]);
  const [company, setCompany] = React.useState<{ id: string; nameAr: string; nameEn: string | null } | null>(null);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);

  const companyIdRef = React.useRef<string | null>(null);
  const employeeNameByIdRef = React.useRef<Record<string, string>>({});

  const apiResult = listFilters.resultFilter !== 'all' ? listFilters.resultFilter : undefined;
  const apiRecommendation = listFilters.recommendationFilter !== 'all' ? listFilters.recommendationFilter : undefined;

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
      ...(listFilters.selectedEmpIds.length > 0 ? { subjectEmployeeIds: listFilters.selectedEmpIds } : {}),
      ...(apiResult ? { result: apiResult as InvestigationResultDto } : {}),
      ...(apiRecommendation ? { recommendation: apiRecommendation as InvestigationRecommendationDto } : {}),
      ...(listFilters.dateFrom ? { dateFrom: listFilters.dateFrom } : {}),
      ...(listFilters.dateTo ? { dateTo: listFilters.dateTo } : {}),
    }),
    [listFilters, apiResult, apiRecommendation],
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
      setApiAccessDenied(false);
      return { items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'discipline-investigations.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [buildInvestigationsQuery, mapItems]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<HRDisciplineInvestigationRecord>(loadPage, {
    resetDeps: [
      apiResult,
      apiRecommendation,
      listFilters.dateFrom,
      listFilters.dateTo,
      listFilters.selectedEmpIds.join(','),
    ],
  });

  // Server applies all list filters now; kept as aliases for existing consumers.
  const filteredItems = items;
  const dateFilteredItems = items;

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
    sourceInvestigations: items,
    employees,
    cases,
    company,
    companyId,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    listFilters,
    setListFilters,
    add,
    openInvestigation,
    submitResults,
    remove,
    reload,
  };
}
