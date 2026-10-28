'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { EmployeesRegisterPrintHtml } from '@/components/pdf/print/employees-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import {
  CONTRACT_TYPE_AR,
  EMP_CONTRACT_STATUS_LABELS,
  EMP_CONTRACT_STATUS_ORDER,
} from '@/features/hr/organization/employees/constants/employees-list';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { branchesApi, type BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import { departmentsApi, type DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { jobTitlesApi, type JobTitleResponseDto } from '@/features/hr/organization/lib/api/jobTitles';
import { ListSortMenu, listSortQuery, useListSort, type ListSortOption } from '@/components/ui/list-sort';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useLatestCallback } from '@/shared/hooks/use-latest-callback';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { usePagePermissions } from '@/features/auth/permissions';
import { useFilterPermission } from '@/features/auth/permissions/use-filter-permission';
import {
  EMPLOYEES_FILTER_PERMISSIONS,
  EMPLOYEES_PAGE_PERMISSIONS,
} from '@/features/hr/organization/employees/permissions';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  organizationActiveListArchiveQuery,
  organizationListArchiveQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import {
  hrFiltersKey,
  usePersistedEmpIdSet,
  usePersistedFilterState,
} from '@/features/hr/lib/use-persisted-filter-state';

function empStartYmd(e: EmployeeResponseDto): string {
  const s = e.startDate;
  if (!s) return '';
  if (s.length >= 10) return s.slice(0, 10);
  try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; }
}

/** Fields the employees list can be sorted by (server `sortBy` keys). */
export const EMPLOYEES_SORT_OPTIONS: readonly ListSortOption[] = [
  { key: 'name', label: 'الاسم' },
  { key: 'employeeCode', label: 'الرقم الوظيفي' },
  { key: 'position', label: 'المسمى' },
  { key: 'contractType', label: 'نوع العقد' },
  { key: 'contractStatus', label: 'حالة العقد' },
  { key: 'startDate', label: 'تاريخ الالتحاق' },
];

const EMPTY_STATUS_COUNTS = { all: 0, active: 0, suspended: 0, ended: 0 };

export function useEmployeesListModel() {
  useSetPageTitle({ titleAr: 'الموظفين', descriptionAr: 'سجل وإدارة بيانات الموظفين', iconName: 'Users' });
  const router = useRouter();
  const companyId = useDefaultCompanyId();
  const perms = usePagePermissions(EMPLOYEES_PAGE_PERMISSIONS);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);
  const accessDenied = !perms.canRead || apiAccessDenied;
  const branchFilterAccess = useFilterPermission(EMPLOYEES_FILTER_PERMISSIONS.branch);
  const deptFilterAccess = useFilterPermission(EMPLOYEES_FILTER_PERMISSIONS.department);
  // company details are optional (used only for PDF header); 403 is silently ignored
  const { data: activeCompany } = useActiveCompany();

  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [jobTitles, setJobTitles] = React.useState<JobTitleResponseDto[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [statusCounts, setStatusCounts] = React.useState(EMPTY_STATUS_COUNTS);

  const [branchFilter, setBranchFilter] = usePersistedFilterState(
    hrFiltersKey('organization', 'employees', companyId, 'branchFilter'),
    'all',
  );
  const [deptFilter, setDeptFilter] = usePersistedFilterState(
    hrFiltersKey('organization', 'employees', companyId, 'deptFilter'),
    'all',
  );
  const [contractTypeFilter, setContractTypeFilter] = usePersistedFilterState(
    hrFiltersKey('organization', 'employees', companyId, 'contractType'),
    'all',
  );
  const [jobTitleFilter, setJobTitleFilter] = usePersistedFilterState(
    hrFiltersKey('organization', 'employees', companyId, 'jobTitle'),
    'all',
  );
  const [startDateBounds, setStartDateBounds] = usePersistedFilterState(
    hrFiltersKey('organization', 'employees', companyId, 'startDateBounds'),
    { from: '', to: '' },
  );
  const sort = useListSort(
    companyId ? `hr-sort:organization:employees:${companyId}` : null,
    EMPLOYEES_SORT_OPTIONS,
  );
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [view, setView] = usePersistedFilterState<'table' | 'grid'>(
    hrFiltersKey('organization', 'employees', companyId, 'view'),
    'table',
  );
  const [newEmpOpen, setNewEmpOpen] = React.useState(false);
  // Active employees by default; another status on demand. A new key: the
  // old one stored "all" for everyone, so the new default would never show.
  const [toolbarStatus, setToolbarStatus] = usePersistedFilterState(
    hrFiltersKey('organization', 'employees', companyId, 'contractStatus'),
    'active',
  );
  const [archiveScope, setArchiveScope] = usePersistedFilterState<OrganizationArchiveScope>(
    hrFiltersKey('organization', 'employees', companyId, 'archiveScope'),
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [selectedEmpIds, setSelectedEmpIds] = usePersistedEmpIdSet(
    hrFiltersKey('organization', 'employees', companyId, 'selectedEmpIds'),
  );
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Debounce search input to avoid firing a request on every keystroke
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Load branches and departments eagerly so filter dropdowns are ready on open
  React.useEffect(() => {
    if (!companyId) return;
    void Promise.allSettled([
      branchesApi.getAll({ limit: 200, companyId, ...organizationActiveListArchiveQuery() }),
      departmentsApi.getAll({ limit: 200, companyId, ...organizationActiveListArchiveQuery() }),
      jobTitlesApi.getAll({ limit: 200, companyId, ...organizationActiveListArchiveQuery() }),
    ]).then(([branchesRes, deptsRes, jobTitlesRes]) => {
      if (branchesRes.status === 'fulfilled') setBranches(branchesRes.value.items);
      if (deptsRes.status === 'fulfilled') setDepartments(deptsRes.value.items);
      if (jobTitlesRes.status === 'fulfilled') setJobTitles(jobTitlesRes.value.items);
    });
  }, [companyId]);

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);

  // Every filter except the status — the status counts are taken under these.
  const baseQuery = React.useMemo(() => ({
    companyId: companyId!,
    ...(branchFilter !== 'all' ? { branchId: branchFilter } : {}),
    ...(deptFilter !== 'all' ? { departmentId: deptFilter } : {}),
    ...(contractTypeFilter !== 'all' ? { contractType: contractTypeFilter } : {}),
    ...(jobTitleFilter !== 'all' ? { jobTitleId: jobTitleFilter } : {}),
    ...(startDateBounds.from ? { startDateFrom: startDateBounds.from } : {}),
    ...(startDateBounds.to ? { startDateTo: startDateBounds.to } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(selectedEmpIds.size > 0 ? { employeeIds: [...selectedEmpIds] } : {}),
    ...organizationListArchiveQuery(archiveScope),
  }), [
    companyId, branchFilter, deptFilter, contractTypeFilter, jobTitleFilter,
    startDateBounds.from, startDateBounds.to, debouncedSearch, archiveScope, selectedEmpIds,
  ]);

  const buildListQuery = React.useCallback((page: number, pageSize: number): Parameters<typeof employeesApi.getAll>[0] => ({
    page,
    limit: pageSize,
    ...baseQuery,
    ...(toolbarStatus !== 'all' ? { contractStatus: toolbarStatus } : {}),
    ...listSortQuery(sort.sort),
  }), [baseQuery, toolbarStatus, sort.sort]);

  // Counts for the status tabs come from the server, over every page — not
  // from the page on screen.
  React.useEffect(() => {
    if (!companyId || !perms.canRead) return;
    let cancelled = false;
    employeesApi.getStatusCounts(baseQuery)
      .then((counts) => {
        if (!cancelled) setStatusCounts(counts);
      })
      .catch(() => {
        if (!cancelled) setStatusCounts(EMPTY_STATUS_COUNTS);
      });
    return () => {
      cancelled = true;
    };
  }, [baseQuery, companyId, perms.canRead]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as EmployeeResponseDto[], total: 0 };
    setListError(null);
    try {
      const res = await employeesApi.getAll(buildListQuery(page, pageSize));
      setEmployees(res.items);
      setApiAccessDenied(false);
      return { items: res.items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'employees.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [buildListQuery, companyId]);

  const {
    items: pagedEmployees,
    loading,
    pagination,
    reload: reloadEmployees,
  } = useServerDirectoryPagination<EmployeeResponseDto>(loadPage, {
    enabled: !!companyId && perms.canRead,
    resetDeps: [
      companyId, branchFilter, deptFilter, toolbarStatus, archiveScope, debouncedSearch, selectedEmpKey, view,
      contractTypeFilter, jobTitleFilter, startDateBounds.from, startDateBounds.to, sort.sortKey,
    ],
  });

  const getBranch = React.useCallback(
    (id: string | null | undefined) => branches.find((b) => b.id === id),
    [branches],
  );
  const getDepartment = React.useCallback(
    (id: string | null | undefined) => departments.find((d) => d.id === id),
    [departments],
  );

  // Server applies all filters, including the multi-employee picker (employeeIds)
  const filtered = pagedEmployees;

  const contractStatusCounts = statusCounts;

  // Exports cover every record matching the current filters, not just the visible page.
  const [exportEmployees, setExportEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [exporting, setExporting] = React.useState(false);

  const fetchAllForExport = React.useCallback(async (): Promise<EmployeeResponseDto[] | null> => {
    if (!companyId) return null;
    setExporting(true);
    try {
      const { items } = await fetchAllPaginatedItems((page, limit) =>
        employeesApi.getAll(buildListQuery(page, limit)),
      );
      return items;
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.export');
      toast.error(displayMessage || 'تعذّر تحميل الموظفين للتصدير.');
      return null;
    } finally {
      setExporting(false);
    }
  }, [buildListQuery, companyId]);

  const employeesPdfRows = React.useMemo(
    () =>
      exportEmployees.map((emp) => ({
        name: emp.nameAr,
        employeeCode: emp.employeeCode,
        position: emp.position ?? '—',
        contractType: CONTRACT_TYPE_AR[emp.contractType ?? ''] ?? emp.contractType ?? '—',
        startDate: empStartYmd(emp),
        statusAr: EMP_CONTRACT_STATUS_LABELS[emp.contractStatus ?? ''] ?? emp.contractStatus ?? '—',
      })),
    [exportEmployees],
  );

  const handleExportPdf = useLatestCallback(async () => {
    if (exporting) return;
    const all = await fetchAllForExport();
    if (!all) return;
    if (all.length === 0) {
      toast.error('لا يوجد موظفون للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    setExportEmployees(all);
    setPdfOpen(true);
  });

  const employeesFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (branchFilter !== 'all') parts.push(`فرع: ${branches.find((b) => b.id === branchFilter)?.nameAr ?? branchFilter}`);
    if (deptFilter !== 'all') parts.push(`قسم: ${departments.find((d) => d.id === deptFilter)?.nameAr ?? deptFilter}`);
    if (jobTitleFilter !== 'all') parts.push(`المسمى: ${jobTitles.find((j) => j.id === jobTitleFilter)?.nameAr ?? jobTitleFilter}`);
    if (contractTypeFilter !== 'all') parts.push(`نوع العقد: ${CONTRACT_TYPE_AR[contractTypeFilter] ?? contractTypeFilter}`);
    if (startDateBounds.from || startDateBounds.to) {
      parts.push(`الالتحاق: ${startDateBounds.from || '…'} — ${startDateBounds.to || '…'}`);
    }
    if (search.trim()) parts.push(`بحث: ${search.trim()}`);
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل (ضمن الفلاتر)' : `الموظفون: ${selectedEmpIds.size} محدد من القائمة`);
    parts.push(`حالة العقد: ${toolbarStatus === 'all' ? 'الكل' : (EMP_CONTRACT_STATUS_LABELS[toolbarStatus] ?? toolbarStatus)}`);
    if (sort.label) parts.push(sort.label);
    return parts.join(' · ');
  }, [
    branchFilter, deptFilter, search, selectedEmpIds.size, toolbarStatus, branches, departments,
    jobTitleFilter, jobTitles, contractTypeFilter, startDateBounds.from, startDateBounds.to, sort.label,
  ]);

  const handleDelete = React.useCallback(async () => {
    if (!deleteId) return;
    try {
      await employeesApi.remove(deleteId);
      setDeleteId(null);
      await reloadEmployees();
      toast.success('تم حذف الموظف');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.delete');
      toast.error(displayMessage);
    }
  }, [deleteId, reloadEmployees]);

  const handleExportExcel = useLatestCallback(async () => {
    if (exporting) return;
    const all = await fetchAllForExport();
    if (!all) return;
    if (all.length === 0) {
      toast.error('لا يوجد موظفون للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const rows: XlsxCell[][] = [[
      'الموظف', 'رقم الموظف', 'المسمى',
      'نوع العقد', 'تاريخ الالتحاق', 'حالة العقد',
    ]];
    for (const emp of all) {
      rows.push([
        emp.nameAr,
        emp.employeeCode,
        emp.position ?? '—',
        CONTRACT_TYPE_AR[emp.contractType ?? ''] ?? emp.contractType ?? '—',
        empStartYmd(emp),
        EMP_CONTRACT_STATUS_LABELS[emp.contractStatus ?? ''] ?? emp.contractStatus ?? '—',
      ]);
    }
    await downloadXlsxFromAoA('employees-register.xlsx', 'الموظفون', rows);
    toast.success('تم تنزيل ملف Excel.');
  });

  const employeesPrintable = React.useMemo(
    () =>
      employeesPdfRows.length === 0 ? null : (
        <EmployeesRegisterPrintHtml
          companyNameAr={activeCompany?.nameAr ?? 'الشركة'}
          companyNameEn={activeCompany?.nameEn ?? ''}
          titleAr="سجل الموظفين"
          filterSummary={employeesFilterSummary}
          rows={employeesPdfRows}
        />
      ),
    [employeesPdfRows, employeesFilterSummary, activeCompany],
  );

  const branchSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'كل الفروع' }, ...branches.map((b) => ({ value: b.id, label: b.nameAr }))],
    [branches],
  );
  const deptSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'كل الأقسام' }, ...departments.map((d) => ({ value: d.id, label: d.nameAr }))],
    [departments],
  );
  const jobTitleSelectOptions = React.useMemo(
    () => [{ value: 'all', label: 'كل المسميات' }, ...jobTitles.map((j) => ({ value: j.id, label: j.nameAr }))],
    [jobTitles],
  );
  const contractTypeSelectOptions = React.useMemo(
    () => [
      { value: 'all', label: 'كل أنواع العقود' },
      ...Object.entries(CONTRACT_TYPE_AR).map(([value, label]) => ({ value, label })),
    ],
    [],
  );
  // The status has its own tabs; everything else in the panel is counted.
  const activeFilterCount =
    (branchFilter !== 'all' ? 1 : 0)
    + (deptFilter !== 'all' ? 1 : 0)
    + (selectedEmpIds.size > 0 ? 1 : 0)
    + (contractTypeFilter !== 'all' ? 1 : 0)
    + (jobTitleFilter !== 'all' ? 1 : 0)
    + (startDateBounds.from || startDateBounds.to ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <ListSortMenu model={sort} />
        <PageHeaderPrimaryButton icon={Plus} label="موظف جديد" onClick={() => setNewEmpOpen(true)}>
          موظف جديد
        </PageHeaderPrimaryButton>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0"
              aria-label="تصدير سجل الموظفين"
              disabled={exporting}
              aria-busy={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled={exporting} onSelect={() => void handleExportPdf()}>
              <FileDown className="h-4 w-4" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem disabled={exporting} onSelect={() => void handleExportExcel()}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    [exporting, handleExportPdf, handleExportExcel, sort.sortKey, activeFilterCount],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        optionalDateRange
        periodValue={startDateBounds}
        onPeriodChange={setStartDateBounds}
        onDateBoundsChange={setStartDateBounds}
        leadingFilters={(
          <EntityFilterSearchField
            value={search}
            onChange={setSearch}
            placeholder="بحث بالاسم، الرقم الوظيفي، الهوية / الإقامة…"
          />
        )}
        inlineSelects={[
          {
            id: 'archive',
            value: archiveScope,
            onChange: (v) => setArchiveScope(v as OrganizationArchiveScope),
            placeholder: 'العرض',
            options: ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
          {
            id: 'branch',
            value: branchFilter,
            onChange: branchFilterAccess.guardOnChange(setBranchFilter),
            onOpen: branchFilterAccess.guardOnOpen(),
            placeholder: 'الفرع',
            options: branchSelectOptions,
          },
          {
            id: 'dept',
            value: deptFilter,
            onChange: deptFilterAccess.guardOnChange(setDeptFilter),
            onOpen: deptFilterAccess.guardOnOpen(),
            placeholder: 'القسم',
            options: deptSelectOptions,
          },
          ...(jobTitles.length > 0 ? [{
            id: 'jobTitle',
            value: jobTitleFilter,
            onChange: setJobTitleFilter,
            placeholder: 'المسمى الوظيفي',
            options: jobTitleSelectOptions,
          }] : []),
          {
            id: 'contractType',
            value: contractTypeFilter,
            onChange: setContractTypeFilter,
            placeholder: 'نوع العقد',
            options: contractTypeSelectOptions,
          },
        ]}
        companyId={companyId}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={toolbarStatus}
        onStatusFilterChange={setToolbarStatus}
        statusOrder={EMP_CONTRACT_STATUS_ORDER}
        statusLabels={EMP_CONTRACT_STATUS_LABELS}
        statusCounts={contractStatusCounts}
        dataView={{
          value: view,
          onChange: (v) => setView(v as 'table' | 'grid'),
          options: [
            { value: 'table', label: 'جدول', icon: 'list' },
            { value: 'grid', label: 'شبكة', icon: 'layout-grid' },
          ],
        }}
      />
    ),
    [
      archiveScope, search,
      branchFilter, deptFilter, view, toolbarStatus, selectedEmpKey,
      contractStatusCounts.all, contractStatusCounts.active,
      contractStatusCounts.suspended, contractStatusCounts.ended,
      companyId, branchSelectOptions, deptSelectOptions,
      jobTitles.length, jobTitleFilter, jobTitleSelectOptions, contractTypeFilter, contractTypeSelectOptions,
      startDateBounds.from, startDateBounds.to,
      branchFilterAccess.allowed, deptFilterAccess.allowed,
    ],
  );

  return {
    router,
    accessDenied,
    perms,
    employees,
    filtered,
    loading,
    pagination,
    listError,
    view,
    newEmpOpen,
    setNewEmpOpen,
    pdfOpen,
    setPdfOpen,
    employeesPrintable,
    getBranch,
    getDepartment,
    reloadEmployees,
    sort,
    deleteId,
    setDeleteId,
    handleDelete,
  };
}

export type EmployeesListModel = ReturnType<typeof useEmployeesListModel>;
