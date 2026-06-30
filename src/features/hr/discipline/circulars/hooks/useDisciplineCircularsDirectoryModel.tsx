'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { ensurePaginatedResult, fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import type { HRDisciplineCircularAudience, HRDisciplineCircularRecord } from '@/features/hr/discipline/lib/types';
import {
  disciplineCircularsApi,
  type CreateDisciplineCircularDto,
  type DisciplineCircularResponseDto,
} from '@/features/hr/discipline/lib/api/discipline-circulars';
import {
  mapDisciplineCircularResponse,
} from '@/features/hr/discipline/circulars/services/discipline-circulars.service';
import { resolveOrganizationScope } from '@/features/hr/organization/lib/api/organization-context';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { organizationActiveListStatusQuery } from '@/features/hr/organization/lib/archive-scope';
import { departmentsApi } from '@/features/hr/organization/lib/api/departments';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { employeeAssignmentsApi } from '@/features/hr/organization/employees/lib/api/employee-assignments';
import { matchesDateRange } from '@/features/hr/discipline/lib/discipline-date-filter';

const PAGE_LIMIT = 200;

export type DisciplineEmployeeDirectoryEntry = {
  id: string;
  nameAr: string;
  branchId: string | null;
  departmentId: string | null;
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

function circularAppliesToEmployee(
  c: HRDisciplineCircularRecord,
  empId: string,
  branchId: string | null,
  departmentId: string | null,
): boolean {
  switch (c.audience) {
    case 'all':
      return true;
    case 'employees':
      return c.targetEmployeeIds.includes(empId);
    case 'branch':
      if (!branchId) return false;
      return c.branchIds.length > 0 && c.branchIds.includes(branchId);
    case 'department':
      if (!departmentId) return false;
      return c.departmentIds.length > 0 && c.departmentIds.includes(departmentId);
    default:
      return false;
  }
}

function circularMatchesEmpToolbarFilter(
  c: HRDisciplineCircularRecord,
  selectedEmpIds: Set<string>,
  employeeById: Map<string, { branchId: string | null; departmentId: string | null }>,
): boolean {
  if (selectedEmpIds.size === 0) return true;
  for (const empId of selectedEmpIds) {
    const emp = employeeById.get(empId);
    if (!emp) continue;
    if (circularAppliesToEmployee(c, empId, emp.branchId, emp.departmentId)) return true;
  }
  return false;
}

function filterCirculars(
  circulars: HRDisciplineCircularRecord[],
  filters: CircularListFilters,
  employeeById: Map<string, { branchId: string | null; departmentId: string | null }>,
  includeAudience = true,
): HRDisciplineCircularRecord[] {
  const selectedEmpIds = new Set(filters.selectedEmpIds);
  const searchFiltered = circulars.filter((c) => {
    const hay = `${c.titleAr} ${c.bodyAr} ${c.audienceSummaryAr}`;
    const matchQ = !filters.q || hay.includes(filters.q);
    return matchQ && circularMatchesEmpToolbarFilter(c, selectedEmpIds, employeeById);
  });
  const dateFiltered = searchFiltered.filter((c) =>
    matchesDateRange(c.date, filters.dateFrom, filters.dateTo),
  );
  if (!includeAudience || filters.audienceFilter === 'all') return dateFiltered;
  return dateFiltered.filter((c) => c.audience === filters.audienceFilter);
}

export function useDisciplineCircularsDirectoryModel() {
  const [listFilters, setListFilters] = React.useState<CircularListFilters>(DEFAULT_LIST_FILTERS);
  const [allCirculars, setAllCirculars] = React.useState<HRDisciplineCircularRecord[]>([]);
  const [employees, setEmployees] = React.useState<DisciplineEmployeeDirectoryEntry[]>([]);
  const [branchOptions, setBranchOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = React.useState<{ value: string; label: string }[]>([]);
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);

  const allCircularsRef = React.useRef<HRDisciplineCircularRecord[]>([]);
  const employeesRef = React.useRef<DisciplineEmployeeDirectoryEntry[]>([]);
  const originalDtosRef = React.useRef<DisciplineCircularResponseDto[]>([]);
  const cacheInvalidRef = React.useRef(true);
  const fetchingRef = React.useRef(false);
  const companyIdRef = React.useRef<string | null>(null);
  const filterDirLoadedRef = React.useRef(false);
  const filterDirLoadingRef = React.useRef(false);

  const employeeById = React.useMemo(
    () => new Map(employees.map((e) => [e.id, e])),
    [employees],
  );

  // Phase 1 — only fetch circulars. Branch/dept names are deferred to loadFilterDirectory.
  // Circulars that target a specific branch/dept will show raw IDs until filter data loads.
  const fetchCircularsData = React.useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setListError(null);
    try {
      const scope = await resolveOrganizationScope();
      const resolvedCompanyId = scope.companyId ?? null;
      companyIdRef.current = resolvedCompanyId;
      setCompanyId(resolvedCompanyId);

      const res = await fetchAllPaginatedItems((page, limit) =>
        disciplineCircularsApi.getAll(
          resolvedCompanyId ? { companyId: resolvedCompanyId, page, limit } : { page, limit },
        ),
      );

      // Store raw DTOs so loadFilterDirectory can re-map with names later
      originalDtosRef.current = res.items;
      const mapped = res.items.map((c) => mapDisciplineCircularResponse(c));
      setAllCirculars(mapped);
      allCircularsRef.current = mapped;
      cacheInvalidRef.current = false;
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-circulars.load');
      setListError(displayMessage);
      setAllCirculars([]);
      allCircularsRef.current = [];
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Phase 2 — load filter reference data lazily (only when filter panel opens or drawer opens).
  // Also re-maps circulars with proper branch/dept names.
  const loadFilterDirectory = React.useCallback(async () => {
    if (filterDirLoadedRef.current || filterDirLoadingRef.current) return;
    filterDirLoadingRef.current = true;
    try {
      const resolvedCompanyId = companyIdRef.current;

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

      const branchNameById = Object.fromEntries(branches.map((b) => [b.id, b.nameAr]));
      const departmentNameById = Object.fromEntries(departments.map((d) => [d.id, d.nameAr]));

      // Re-map circulars now that we have branch/dept names
      if (originalDtosRef.current.length > 0) {
        const remapped = originalDtosRef.current.map((c) =>
          mapDisciplineCircularResponse(c, { branchNameById, departmentNameById }),
        );
        setAllCirculars(remapped);
        allCircularsRef.current = remapped;
      }

      const employeeItems = ensurePaginatedResult(employeesRes).items;
      const activeEmployees = employeeItems.filter(
        (e) => !e.contractStatus || e.contractStatus === 'active',
      );
      const assignmentResults = await Promise.all(
        activeEmployees.map((emp) => employeeAssignmentsApi.getAll(emp.id).catch(() => [])),
      );
      const employeesWithAssignments = activeEmployees.map((emp, idx) => {
        const assignments = assignmentResults[idx];
        const scopedAssignments = resolvedCompanyId
          ? assignments.filter((a) => a.companyId === resolvedCompanyId)
          : assignments;
        const primary = scopedAssignments.find((a) => a.isPrimary) ?? scopedAssignments[0];
        return {
          id: emp.id,
          nameAr: emp.nameAr,
          branchId: primary?.branchId ?? null,
          departmentId: primary?.departmentId ?? null,
        };
      });
      setEmployees(employeesWithAssignments);
      employeesRef.current = employeesWithAssignments;
      filterDirLoadedRef.current = true;
    } catch {
      // filter data is optional — page still works without it
    } finally {
      filterDirLoadingRef.current = false;
    }
  }, []);

  const loadBulk = React.useCallback(async () => {
    if (cacheInvalidRef.current || allCircularsRef.current.length === 0) {
      await fetchCircularsData();
    }
    const employeeMap = new Map(employeesRef.current.map((e) => [e.id, e]));
    const filtered = filterCirculars(allCircularsRef.current, listFilters, employeeMap);
    return { items: filtered, total: filtered.length };
  }, [fetchCircularsData, listFilters]);

  const {
    items,
    loading,
    pagination,
    reload: reloadPaged,
  } = useServerDirectoryPagination<HRDisciplineCircularRecord>(
    async () => ({ items: [], total: 0 }),
    {
      bulkMode: true,
      loadBulk,
      resetDeps: [
        listFilters.q,
        listFilters.selectedEmpIds.join(','),
        listFilters.audienceFilter,
        listFilters.dateFrom,
        listFilters.dateTo,
      ],
    },
  );

  const filteredItems = React.useMemo(
    () => filterCirculars(allCirculars, listFilters, employeeById),
    [allCirculars, employeeById, listFilters],
  );

  const dateFilteredItems = React.useMemo(
    () => filterCirculars(allCirculars, listFilters, employeeById, false),
    [allCirculars, employeeById, listFilters],
  );

  const searchFilteredItems = React.useMemo(
    () => filterCirculars(
      allCirculars,
      { ...listFilters, dateFrom: '', dateTo: '' },
      employeeById,
      false,
    ),
    [allCirculars, employeeById, listFilters],
  );

  const reload = React.useCallback(async () => {
    cacheInvalidRef.current = true;
    filterDirLoadedRef.current = false;
    originalDtosRef.current = [];
    await reloadPaged();
  }, [reloadPaged]);

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
    allCirculars,
    employees,
    branchOptions,
    departmentOptions,
    companyId,
    loading,
    pagination,
    listError,
    listFilters,
    setListFilters,
    loadFilterDirectory,
    add,
    remove,
    markSent,
    reload,
  };
}
