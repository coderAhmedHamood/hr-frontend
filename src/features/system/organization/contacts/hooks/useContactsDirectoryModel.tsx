'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { Can } from '@/components/shared/can';
import { usePagePermissions } from '@/features/auth/permissions';
import { CONTACTS_PAGE_PERMISSIONS } from '@/features/system/organization/contacts/permissions';
import { branchesApi } from '@/features/hr/organization/lib/api/branches';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useDefaultCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import {
  usersApi,
  type UserResponseDto,
  type CreateUserDto,
  type UpdateUserDto,
} from '@/features/hr/organization/lib/api/users';
import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  organizationActiveListStatusQuery,
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import {
  EMPTY_USER_FORM,
  userToDraftForm,
  formatUserDate,
  companyLinkLabel,
  branchLinkLabel,
  type UserDraftForm,
} from '@/features/system/organization/contacts/constants/users-directory';

export type UserRecord = UserResponseDto;

export {
  USER_TYPE_LABELS,
  USER_TYPE_OPTIONS,
  USER_STATUS_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/features/system/organization/contacts/constants/users-directory';

function userBelongsToCompany(user: UserRecord, companyId: string): boolean {
  if (user.defaultCompanyId === companyId) return true;
  if (user.companies.some((c) => c.companyId === companyId)) return true;
  // Not yet assigned to any company (e.g. a freshly created/self-registered
  // account) — surface it under every company view so an admin can find it
  // and assign it, instead of it being invisible everywhere.
  return !user.defaultCompanyId && user.companies.length === 0;
}

export function useContactsDirectoryModel() {
  useSetPageTitle({
    titleAr: 'المستخدمين',
    descriptionAr: 'حسابات مستخدمي النظام — ربط الشركات والفروع والصلاحيات.',
    iconName: 'UserCircle',
  });

  const perms = usePagePermissions(CONTACTS_PAGE_PERMISSIONS);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);
  const accessDenied = !perms.canRead || apiAccessDenied;

  const defaultCompanyId = useDefaultCompanyId();
  const { data: defaultCompany } = useDefaultCompany();
  const companies = React.useMemo(
    () => (defaultCompany ? [defaultCompany] : []),
    [defaultCompany],
  );

  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<UserDraftForm>(EMPTY_USER_FORM);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<UserRecord | null>(null);

  React.useEffect(() => {
    if (!defaultCompanyId) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    void branchesApi
      .getAll({ companyId: defaultCompanyId, limit: 200, ...organizationActiveListStatusQuery() })
      .then((res) => {
        if (!cancelled) setBranches(res.items);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      });
    return () => {
      cancelled = true;
    };
  }, [defaultCompanyId]);

  const loadBulk = React.useCallback(async () => {
    setListError(null);
    try {
      const res = await fetchAllPaginatedItems((page, limit) =>
        usersApi.getAll({ page, limit, ...organizationListStatusQuery(archiveScope) }),
      );
      setApiAccessDenied(false);
      const scopedUsers = defaultCompanyId
        ? res.items.filter((u) => userBelongsToCompany(u, defaultCompanyId))
        : res.items;
      return { items: scopedUsers, total: scopedUsers.length };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'users.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [archiveScope, defaultCompanyId]);

  const {
    items: pagedUsers,
    loading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<UserRecord>(
    async () => ({ items: [], total: 0 }),
    { bulkMode: true, loadBulk, enabled: !!defaultCompanyId && perms.canRead, resetDeps: [defaultCompanyId, archiveScope] },
  );

  const patchUserInList = React.useCallback((updated: UserResponseDto) => {
    setViewRow((prev) => (prev?.id === updated.id ? updated : prev));
    void reloadList();
  }, [reloadList]);

  const patch = React.useCallback((p: Partial<UserDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    if (!perms.canCreate) return;
    setEditId(null);
    setForm({
      ...EMPTY_USER_FORM,
      defaultCompanyId: defaultCompanyId ?? '',
    });
    setError(null);
    setDrawerOpen(true);
  }, [defaultCompanyId, perms.canCreate]);

  const openEdit = React.useCallback((row: UserRecord) => {
    if (!perms.canUpdate) return;
    setEditId(row.id);
    setForm(userToDraftForm(row));
    setError(null);
    setDrawerOpen(true);
  }, [perms.canUpdate]);

  const branchesForDefault = React.useMemo(() => branches, [branches]);

  const buildPayloadBase = React.useCallback(() => ({
    email: form.email.trim(),
    fullNameAr: form.fullNameAr.trim() || null,
    phone: form.phone.trim() || null,
    userType: form.userType || null,
    defaultCompanyId: defaultCompanyId ?? (form.defaultCompanyId || null),
    defaultBranchId: form.defaultBranchId || null,
    employeeId: form.employeeId.trim() || null,
    languageCode: form.languageCode || null,
    timezone: form.timezone || null,
    status: form.status || null,
    isActive: form.isActive,
    isVerified: form.isVerified,
  }), [defaultCompanyId, form]);

  const handleSave = React.useCallback(async () => {
    if (editId ? !perms.canUpdate : !perms.canCreate) return;
    if (!form.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    if (!editId && !form.password.trim()) { setError('كلمة المرور مطلوبة'); return; }
    if (!defaultCompanyId && !editId) {
      setError('لم يتم تحديد الشركة الافتراضية. سجّل الدخول مرة أخرى.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editId) {
        const payload: UpdateUserDto = {
          ...buildPayloadBase(),
          ...(form.password.trim() ? { password: form.password } : {}),
        };
        await usersApi.update(editId, payload);
        toast.success('تم تحديث المستخدم');
      } else {
        const payload: CreateUserDto = {
          ...buildPayloadBase(),
          password: form.password,
        };
        await usersApi.create(payload);
        toast.success('تم إنشاء المستخدم');
      }
      await reloadList();
      setDrawerOpen(false);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'users.save');
      setError(displayMessage);
    } finally {
      setSaving(false);
    }
  }, [buildPayloadBase, defaultCompanyId, editId, form.password, perms.canCreate, perms.canUpdate, reloadList]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId || !perms.canDelete) return;
    try {
      await usersApi.remove(confirmId);
      await reloadList();
      setConfirmId(null);
      if (viewRow?.id === confirmId) setViewRow(null);
      toast.success('تم حذف المستخدم');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'users.delete');
      toast.error(displayMessage);
      setConfirmId(null);
    }
  }, [confirmId, perms.canDelete, reloadList, viewRow?.id]);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <Can when={perms.canCreate}>
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> مستخدم جديد
          </Button>
        </Can>
      </div>
    ),
    [openCreate, perms.canCreate],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          {
            id: 'archive',
            value: archiveScope,
            onChange: (v) => setArchiveScope(v as OrganizationArchiveScope),
            placeholder: 'العرض',
            options: ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
        ]}
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
    [archiveScope, layoutView],
  );

  return {
    perms,
    accessDenied,
    users: pagedUsers,
    companies,
    branches,
    branchesForDefault,
    loading,
    pagination,
    listError,
    layoutView,
    drawerOpen,
    setDrawerOpen,
    editId,
    form,
    patch,
    saving,
    error,
    confirmId,
    setConfirmId,
    viewRow,
    setViewRow,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    patchUserInList,
    companyLinkLabel,
    branchLinkLabel,
    formatDate: formatUserDate,
  };
}

export type ContactsDirectoryModel = ReturnType<typeof useContactsDirectoryModel>;
