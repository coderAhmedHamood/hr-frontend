'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Download, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { hasDateRangeFilter } from '@/features/hr/discipline/lib/discipline-date-filter';
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
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  organizationActiveListArchiveQuery,
  organizationListArchiveQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';

function empStartYmd(e: EmployeeResponseDto): string {
  const s = e.startDate;
  if (!s) return '';
  if (s.length >= 10) return s.slice(0, 10);
  try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; }
}

export function useEmployeesListModel() {
  useSetPageTitle({ titleAr: 'الموظفين', descriptionAr: 'سجل وإدارة بيانات الموظفين', iconName: 'Users' });
  const router = useRouter();
  const companyId = useDefaultCompanyId();
  // company details are optional (used only for PDF header); 403 is silently ignored
  const { data: activeCompany } = useActiveCompany();

  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);

  const [branchFilter, setBranchFilter] = React.useState('all');
  const [deptFilter, setDeptFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [view, setView] = React.useState<'table' | 'grid'>('table');
  const [newEmpOpen, setNewEmpOpen] = React.useState(false);
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [toolbarStatus, setToolbarStatus] = React.useState<string>('all');
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
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
    ]).then(([branchesRes, deptsRes]) => {
      if (branchesRes.status === 'fulfilled') setBranches(branchesRes.value.items);
      if (deptsRes.status === 'fulfilled') setDepartments(deptsRes.value.items);
    });
  }, [companyId]);

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);
  const bulkMode = selectedEmpIds.size > 1;

  const buildListQuery = React.useCallback((page: number, pageSize: number): Parameters<typeof employeesApi.getAll>[0] => ({
    page,
    limit: pageSize,
    companyId: companyId!,
    ...(branchFilter !== 'all' ? { branchId: branchFilter } : {}),
    ...(deptFilter !== 'all' ? { departmentId: deptFilter } : {}),
    ...(toolbarStatus !== 'all' ? { contractStatus: toolbarStatus } : {}),
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
    ...(dateBounds.from ? { startDateFrom: dateBounds.from } : {}),
    ...(dateBounds.to ? { startDateTo: dateBounds.to } : {}),
    ...organizationListArchiveQuery(archiveScope),
  }), [companyId, branchFilter, deptFilter, toolbarStatus, debouncedSearch, dateBounds.from, dateBounds.to, archiveScope]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as EmployeeResponseDto[], total: 0 };
    setListError(null);
    try {
      const res = await employeesApi.getAll(buildListQuery(page, pageSize));
      setEmployees(res.items);
      setTotalCount(res.pagination.total);
      return { items: res.items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildListQuery, companyId]);

  const loadBulk = React.useCallback(async () => {
    if (!companyId) return { items: [] as EmployeeResponseDto[], total: 0 };
    setListError(null);
    try {
      const res = await fetchAllPaginatedItems((page, limit) => employeesApi.getAll(buildListQuery(page, limit)));
      const scoped = selectedEmpIds.size > 0
        ? res.items.filter((e) => selectedEmpIds.has(e.id))
        : res.items;
      setEmployees(res.items);
      setTotalCount(res.total);
      return { items: scoped, total: scoped.length };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'employees.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [buildListQuery, companyId, selectedEmpIds]);

  const {
    items: pagedEmployees,
    loading,
    pagination,
    reload: reloadEmployees,
  } = useServerDirectoryPagination<EmployeeResponseDto>(loadPage, {
    enabled: !!companyId,
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [companyId, branchFilter, deptFilter, toolbarStatus, archiveScope, debouncedSearch, dateBounds.from, dateBounds.to, selectedEmpKey, view],
  });

  const getBranch = React.useCallback(
    (id: string | null | undefined) => branches.find((b) => b.id === id),
    [branches],
  );
  const getDepartment = React.useCallback(
    (id: string | null | undefined) => departments.find((d) => d.id === id),
    [departments],
  );

  const empPickerList = React.useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.nameAr })),
    [employees],
  );

  // Server handles filters; bulkMode applies multi-employee picker client-side
  const filtered = React.useMemo(
    () => (bulkMode ? pagedEmployees : (
      selectedEmpIds.size === 1
        ? pagedEmployees.filter((e) => selectedEmpIds.has(e.id))
        : pagedEmployees
    )),
    [bulkMode, pagedEmployees, selectedEmpIds],
  );

  const contractStatusCounts = React.useMemo(
    () => ({
      all: totalCount,
      active: employees.filter((e) => e.contractStatus === 'active').length,
      suspended: employees.filter((e) => e.contractStatus === 'suspended').length,
      ended: employees.filter((e) => e.contractStatus === 'ended').length,
    }),
    [employees, totalCount],
  );

  const employeesPdfRows = React.useMemo(
    () =>
      filtered.map((emp) => ({
        name: emp.nameAr,
        employeeCode: emp.employeeCode,
        position: emp.position ?? '—',
        department: emp.departmentNameAr ?? '—',
        branchCity: emp.branchNameAr ?? '—',
        contractType: CONTRACT_TYPE_AR[emp.contractType ?? ''] ?? emp.contractType ?? '—',
        startDate: empStartYmd(emp),
        statusAr: EMP_CONTRACT_STATUS_LABELS[emp.contractStatus ?? ''] ?? emp.contractStatus ?? '—',
      })),
    [filtered],
  );

  const employeesFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    if (branchFilter !== 'all') parts.push(`فرع: ${branches.find((b) => b.id === branchFilter)?.nameAr ?? branchFilter}`);
    if (deptFilter !== 'all') parts.push(`قسم: ${departments.find((d) => d.id === deptFilter)?.nameAr ?? deptFilter}`);
    if (search.trim()) parts.push(`بحث: ${search.trim()}`);
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل (ضمن الفلاتر)' : `الموظفون: ${selectedEmpIds.size} محدد من القائمة`);
    if (hasDateRangeFilter(dateBounds.from, dateBounds.to)) {
      parts.push(`تاريخ الالتحاق: ${dateBounds.from} — ${dateBounds.to}`);
    }
    parts.push(`حالة العقد: ${toolbarStatus === 'all' ? 'الكل' : (EMP_CONTRACT_STATUS_LABELS[toolbarStatus] ?? toolbarStatus)}`);
    return parts.join(' · ');
  }, [branchFilter, deptFilter, search, selectedEmpIds.size, dateBounds.from, dateBounds.to, toolbarStatus, branches, departments]);

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

  const handleExportExcel = React.useCallback(async () => {
    if (filtered.length === 0) {
      toast.error('لا يوجد موظفون للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const rows: XlsxCell[][] = [[
      'الموظف', 'رقم الموظف', 'المسمى', 'القسم', 'الفرع',
      'نوع العقد', 'تاريخ الالتحاق', 'حالة العقد',
    ]];
    for (const emp of filtered) {
      rows.push([
        emp.nameAr,
        emp.employeeCode,
        emp.position ?? '—',
        emp.departmentNameAr ?? '—',
        emp.branchNameAr ?? '—',
        CONTRACT_TYPE_AR[emp.contractType ?? ''] ?? emp.contractType ?? '—',
        empStartYmd(emp),
        EMP_CONTRACT_STATUS_LABELS[emp.contractStatus ?? ''] ?? emp.contractStatus ?? '—',
      ]);
    }
    await downloadXlsxFromAoA('employees-register.xlsx', 'الموظفون', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [filtered]);

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

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={() => setNewEmpOpen(true)}>
          <Plus className="h-4 w-4" />
          موظف جديد
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0"
              aria-label="تصدير سجل الموظفين"
            >
              <Download className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onSelect={() => {
                if (employeesPdfRows.length === 0) {
                  toast.error('لا يوجد موظفون للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-4 w-4" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleExportExcel()}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    [employeesPdfRows.length, handleExportExcel],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
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
            onChange: setBranchFilter,
            placeholder: 'الفرع',
            options: branchSelectOptions,
          },
          {
            id: 'dept',
            value: deptFilter,
            onChange: setDeptFilter,
            placeholder: 'القسم',
            options: deptSelectOptions,
          },
        ]}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={toolbarStatus}
        onStatusFilterChange={setToolbarStatus}
        statusOrder={EMP_CONTRACT_STATUS_ORDER}
        statusLabels={EMP_CONTRACT_STATUS_LABELS}
        statusCounts={contractStatusCounts}
        onDateBoundsChange={setDateBounds}
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
      archiveScope,
      branchFilter, deptFilter, view, toolbarStatus, selectedEmpKey,
      dateBounds.from, dateBounds.to,
      contractStatusCounts.all, contractStatusCounts.active,
      contractStatusCounts.suspended, contractStatusCounts.ended,
      empPickerList, branchSelectOptions, deptSelectOptions,
    ],
  );

  return {
    router,
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
    deleteId,
    setDeleteId,
    handleDelete,
  };
}

export type EmployeesListModel = ReturnType<typeof useEmployeesListModel>;
