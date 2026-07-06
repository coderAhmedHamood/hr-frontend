'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { ensurePaginatedResult } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import type { HRDisciplineCircularAudience, HRDisciplineCircularRecord } from '@/features/hr/discipline/lib/types';
import {
  disciplineCircularsApi,
  type CreateDisciplineCircularDto,
  type DisciplineCircularResponseDto,
} from '@/features/hr/discipline/lib/api/discipline-circulars';
import {
  mapDisciplineCircularResponse,
  toCircularAudienceType,
} from '@/features/hr/discipline/circulars/services/discipline-circulars.service';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';

const PAGE_LIMIT = 200;

export type DisciplineEmployeeDirectoryEntry = {
  id: string;
  nameAr: string;
};

export type CircularListFilters = {
  q: string;
  selectedEmpIds: string[];
  audienceFilter: 'all' | HRDisciplineCircularAudience;
  dateFrom: string;
  dateTo: string;
};

const DEFAULT_LIST_FILTERS: CircularListFilters = {
  q: '',
  selectedEmpIds: [],
  audienceFilter: 'all',
  dateFrom: '',
  dateTo: '',
};

export function useDisciplineCircularsDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<CircularListFilters>(DEFAULT_LIST_FILTERS);
  const [employees, setEmployees] = React.useState<DisciplineEmployeeDirectoryEntry[]>([]);
  const [branchOptions, setBranchOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);

  const companyIdRef = React.useRef<string | null>(null);
  const nameLookupRef = React.useRef<{ branchNameById: Record<string, string>; departmentNameById: Record<string, string> }>({
    branchNameById: {},
    departmentNameById: {},
  });
  const filterDirLoadedRef = React.useRef(false);
  const filterDirLoadingRef = React.useRef(false);
  const reloadRef = React.useRef<(() => Promise<void>) | null>(null);

  // Lazily loads branch/department names (for audienceSummaryAr) and the employee picker list.
  const loadFilterDirectory = React.useCallback(async () => {
    if (filterDirLoadedRef.current || filterDirLoadingRef.current) return;
    filterDirLoadingRef.current = true;
    try {
      const scope = await resolveOrganizationScope();
      const resolvedCompanyId = scope.companyId ?? null;
      companyIdRef.current = resolvedCompanyId;
      setCompanyId(resolvedCompanyId);

      const [branchesRes, departmentsRes, employeesRes] = await Promise.all([
        branchesApi.getAll({
          ...(resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT }),
          ...organizationActiveListStatusQuery(),
        }),
        departmentsApi.getAll({
          ...(resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT }),
          ...organizationActiveListStatusQuery(),
        }),
        employeesApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, limit: PAGE_LIMIT } : { limit: PAGE_LIMIT },
        ),
      ]);

      const branches = ensurePaginatedResult(branchesRes).items;
      const departments = ensurePaginatedResult(departmentsRes).items;
      setBranchOptions(branches.map((b) => ({ value: b.id, label: b.nameAr })));
      setDepartmentOptions(departments.map((d) => ({ value: d.id, label: d.nameAr })));
      nameLookupRef.current = {
        branchNameById: Object.fromEntries(branches.map((b) => [b.id, b.nameAr])),
        departmentNameById: Object.fromEntries(departments.map((d) => [d.id, d.nameAr])),
      };

      const employeeItems = ensurePaginatedResult(employeesRes).items;
      setEmployees(employeeItems.map((e) => ({ id: e.id, nameAr: e.nameAr })));
      const wasLoaded = filterDirLoadedRef.current;
      filterDirLoadedRef.current = true;

      // Re-fetch the current page so branch/dept names apply to audienceSummaryAr.
      if (!wasLoaded) await reloadRef.current?.();
    } catch {
      // filter data is optional — page still works without it
    } finally {
      filterDirLoadingRef.current = false;
    }
  }, []);

  const buildListQuery = React.useCallback((page: number, pageSize: number) => ({
    page,
    limit: pageSize,
    ...(companyIdRef.current ? { companyId: companyIdRef.current } : {}),
    ...(listFilters.q.trim() ? { q: listFilters.q.trim() } : {}),
    ...(listFilters.selectedEmpIds.length > 0 ? { employeeIds: listFilters.selectedEmpIds } : {}),
    ...(listFilters.audienceFilter !== 'all' ? { audience: toCircularAudienceType(listFilters.audienceFilter) } : {}),
    ...(listFilters.dateFrom ? { dateFrom: listFilters.dateFrom } : {}),
    ...(listFilters.dateTo ? { dateTo: listFilters.dateTo } : {}),
  }), [listFilters]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    setListError(null);
    try {
      if (!companyIdRef.current) {
        const scope = await resolveOrganizationScope();
        companyIdRef.current = scope.companyId ?? null;
        setCompanyId(companyIdRef.current);
      }
      const res = await disciplineCircularsApi.getAll(buildListQuery(page, pageSize));
      const items = res.items.map((c: DisciplineCircularResponseDto) =>
        mapDisciplineCircularResponse(c, nameLookupRef.current),
      );
      setApiAccessDenied(false);
      return { items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'discipline-circulars.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [buildListQuery]);

  const {
    items,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<HRDisciplineCircularRecord>(loadPage, {
    resetDeps: [
      listFilters.q,
      listFilters.selectedEmpIds.join(','),
      listFilters.audienceFilter,
      listFilters.dateFrom,
      listFilters.dateTo,
    ],
  });

  reloadRef.current = reload;

  // Server applies all list filters now; kept as aliases for existing consumers.
  const filteredItems = items;
  const dateFilteredItems = items;
  const searchFilteredItems = items;

  const add = React.useCallback(
    async (payload: CreateDisciplineCircularDto) => {
      await disciplineCircularsApi.create(payload);
      await reload();
    },
    [reload],
  );

  const remove = React.useCallback(
    async (id: string) => {
      await disciplineCircularsApi.remove(id);
      await reload();
    },
    [reload],
  );

  const markSent = React.useCallback(
    async (id: string) => {
      await disciplineCircularsApi.send(id);
      await reload();
    },
    [reload],
  );

  return {
    items,
    filteredItems,
    dateFilteredItems,
    searchFilteredItems,
    allCirculars: items,
    employees,
    branchOptions,
    departmentOptions,
    companyId,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    listFilters,
    setListFilters,
    loadFilterDirectory,
    add,
    remove,
    markSent,
    reload,
  };
}

type PaginatedDisciplineCirculars = {
  items: DisciplineCircularResponseDto[];
  pagination: { total: number };
};
