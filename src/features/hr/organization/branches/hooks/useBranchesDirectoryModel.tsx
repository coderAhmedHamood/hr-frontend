'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { PermissionGate } from '@/components/shared/permission-gate';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { employeesApi, type EmployeeResponseDto } from '@/features/hr/organization/employees/lib/api/employees';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useDefaultCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import {
  createBranch,
  deleteBranch,
  updateBranch,
} from '@/features/hr/organization/branches/services/branches.service';
import { mapBranchResponse } from '@/features/hr/organization/branches/constants/branches-directory';
import { generateEntityCode } from '@/features/hr/requests/lib/types';
import {
  BRANCH_EMPTY_FORM,
  branchRowToDraftForm,
  draftFormToCreatePayload,
  draftFormToUpdatePayload,
  type BranchDraftForm,
  type BranchRow,
} from '@/features/hr/organization/branches/constants/branches-directory';

export function useBranchesDirectoryModel() {
  useSetPageTitle({ titleAr: 'الفروع', descriptionAr: 'إدارة فروع الشركة وتوزيع الموظفين.', iconName: 'Building2' });

  const defaultCompanyId = useDefaultCompanyId();
  const { data: defaultCompany } = useDefaultCompany();

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('grid');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<BranchDraftForm>(BRANCH_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [listError, setListError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewBranch, setViewBranch] = React.useState<BranchRow | null>(null);
  const [employees, setEmployees] = React.useState<EmployeeResponseDto[]>([]);
  const [employeesLoading, setEmployeesLoading] = React.useState(false);

  const companyLabel = React.useCallback(
    (companyId: string) =>
      defaultCompany?.nameAr
      ?? defaultCompany?.code
      ?? companyId.slice(0, 8),
    [defaultCompany],
  );

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!defaultCompanyId) return { items: [] as BranchRow[], total: 0 };
    try {
      const res = await branchesApi.getAll({ companyId: defaultCompanyId, page, limit: pageSize });
      setListError(null);
      return { items: res.items.map(mapBranchResponse), total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [defaultCompanyId]);

  const {
    items: branches,
    loading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<BranchRow>(loadPage, {
    enabled: !!defaultCompanyId,
    resetDeps: [defaultCompanyId, layoutView],
  });

  React.useEffect(() => {
    if (!drawerOpen || !defaultCompanyId) {
      setEmployees([]);
      return;
    }
    let cancelled = false;
    setEmployeesLoading(true);
    void employeesApi
      .getAll({ companyId: defaultCompanyId, limit: 500 })
      .then((res) => {
        if (!cancelled) setEmployees(res.items);
      })
      .catch(() => {
        if (!cancelled) setEmployees([]);
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [drawerOpen, defaultCompanyId]);

  const employeeOptions = React.useMemo(
    () => employees.map((e) => ({
      value: e.id,
      label: e.nameAr,
      sub: e.employeeCode ?? undefined,
    })),
    [employees],
  );

  const setManagerEmployee = React.useCallback((employeeId: string) => {
    if (!employeeId) {
      setForm((f) => ({ ...f, managerEmployeeId: '', managerName: '' }));
      return;
    }
    const employee = employees.find((e) => e.id === employeeId);
    setForm((f) => ({
      ...f,
      managerEmployeeId: employeeId,
      managerName: employee?.nameAr ?? '',
    }));
  }, [employees]);

  const filtered = branches;

  const patch = React.useCallback((p: Partial<BranchDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm({
      ...BRANCH_EMPTY_FORM,
      companyId: defaultCompanyId ?? '',
    });
    setError(null);
    setDrawerOpen(true);
  }, [defaultCompanyId]);

  const openEdit = React.useCallback((b: BranchRow) => {
    setEditId(b.id);
    setForm(branchRowToDraftForm(b, employees));
    setError(null);
    setDrawerOpen(true);
  }, [employees]);

  React.useEffect(() => {
    if (!drawerOpen || !editId) return;
    setForm((f) => {
      if (f.managerEmployeeId || !f.managerName) return f;
      const matched = employees.find((e) => e.nameAr.trim() === f.managerName.trim());
      return matched ? { ...f, managerEmployeeId: matched.id } : f;
    });
  }, [drawerOpen, editId, employees]);

  const handleSave = React.useCallback(async () => {
    const companyId = defaultCompanyId ?? form.companyId;
    if (!form.name.trim()) {
      setError('اسم الفرع مطلوب');
      return;
    }
    if (!form.city.trim()) {
      setError('المدينة مطلوبة');
      return;
    }
    if (!companyId) {
      setError('لم يتم تحديد الشركة الافتراضية. سجّل الدخول مرة أخرى.');
      return;
    }

    setError(null);
    try {
      if (editId) {
        await updateBranch(editId, draftFormToUpdatePayload(form));
      } else {
        await createBranch(draftFormToCreatePayload(form, companyId, generateEntityCode(form.name.trim(), 'branch')));
      }
      await reloadList();
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.save');
      setError(displayMessage);
    }
  }, [editId, form, reloadList]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId) return;
    setError(null);
    try {
      await deleteBranch(confirmId);
      await reloadList();
      setConfirmId(null);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'branches.delete');
      setError(displayMessage);
    }
  }, [confirmId, reloadList]);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton />
        <PermissionGate permission="hr.employees.create">
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> فرع جديد
          </Button>
        </PermissionGate>
      </div>
    ),
    [openCreate],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        dataView={{
          value: layoutView,
          onChange: (v) => setLayoutView(v as 'grid' | 'table'),
          options: [
            { value: 'table', label: 'جدول', icon: 'list' },
            { value: 'grid', label: 'شبكة', icon: 'layout-grid' },
          ],
        }}
      />
    ),
    [layoutView],
  );

  return {
    layoutView,
    branches,
    filtered,
    loading,
    pagination,
    listError,
    drawerOpen,
    setDrawerOpen,
    editId,
    form,
    patch,
    error,
    confirmId,
    setConfirmId,
    viewBranch,
    setViewBranch,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    companyLabel,
    employeeOptions,
    employeesLoading,
    setManagerEmployee,
  };
}

export type BranchesDirectoryModel = ReturnType<typeof useBranchesDirectoryModel>;
