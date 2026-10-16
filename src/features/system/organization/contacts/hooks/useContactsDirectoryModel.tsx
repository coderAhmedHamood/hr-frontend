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
import { RegisterExportMenu } from '@/components/pdf/register-export-menu';
import { useLatestCallback } from '@/shared/hooks/use-latest-callback';
import type { RegisterColumn } from '@/components/pdf/print/register-document';
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
  USER_TYPE_LABELS as USER_TYPE_LABEL_MAP,
  type UserDraftForm,
} from '@/features/system/organization/contacts/constants/users-directory';

export type UserRecord = UserResponseDto;

export {
  USER_TYPE_LABELS,
  USER_TYPE_OPTIONS,
  USER_STATUS_OPTIONS,
} from '@/features/system/organization/contacts/constants/users-directory';

function userBelongsToCompany(user: UserRecord, companyId: string): boolean {
  if (user.defaultCompanyId === companyId) return true;
  if (user.companies.some((c) => c.companyId === companyId)) return true;
  // Not yet assigned to any company (e.g. a freshly created/self-registered
  // account) — surface it under every company view so an admin can find it
  // and assign it, instead of it being invisible everywhere.
  return !user.defaultCompanyId && user.companies.length === 0;
}

const USER_EXPORT_COLUMNS: RegisterColumn[] = [
  { label: 'الاسم', kind: 'name' },
  { label: 'البريد', kind: 'code' },
  { label: 'النوع', kind: 'status' },
  { label: 'الشركة', kind: 'text' },
  { label: 'الحالة', kind: 'status' },
];

function userStatusLabel(user: UserRecord): string {
  if (!user.isActive) return 'غير نشط';
  if (!user.canSignIn) return 'لا يمكن الدخول';
  return 'نشط';
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

  const fetchScopedUsers = React.useCallback(async () => {
    const res = await fetchAllPaginatedItems((page, limit) =>
      usersApi.getAll({ page, limit, ...organizationListStatusQuery(archiveScope) }),
    );
    return defaultCompanyId
      ? res.items.filter((u) => userBelongsToCompany(u, defaultCompanyId))
      : res.items;
  }, [archiveScope, defaultCompanyId]);

  const loadBulk = React.useCallback(async () => {
    setListError(null);
    try {
      const scopedUsers = await fetchScopedUsers();
      setApiAccessDenied(false);
      return { items: scopedUsers, total: scopedUsers.length };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'users.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [fetchScopedUsers]);

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

  const openCreate = useLatestCallback(() => {
    if (!perms.canCreate) return;
    setEditId(null);
    setForm({
      ...EMPTY_USER_FORM,
      defaultCompanyId: defaultCompanyId ?? '',
    });
    setError(null);
    setDrawerOpen(true);
  });

  const openEdit = React.useCallback((row: UserRecord) => {
    if (!perms.canUpdate) return;
    setEditId(row.id);
    setForm(userToDraftForm(row));
    setError(null);
    setDrawerOpen(true);
  }, [perms.canUpdate]);

  const buildPayloadBase = React.useCallback(() => ({
    email: form.email.trim(),
    fullNameAr: form.fullNameAr.trim() || null,
    phone: form.phone.trim() || null,
    userType: form.userType || null,
    defaultCompanyId: defaultCompanyId ?? (form.defaultCompanyId || null),
    ...(editId
      ? {
          status: form.status || null,
          isActive: form.isActive,
        }
      : {}),
    isVerified: form.isVerified,
  }), [defaultCompanyId, editId, form]);

  const handleSave = React.useCallback(async () => {
    if (editId ? !perms.canUpdate : !perms.canCreate) return;
    if (!form.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    if (!editId && !form.password.trim()) { setError('كلمة المرور مطلوبة'); return; }
    if (!editId && form.password.trim().length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
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

  const getExportRows = useLatestCallback(async (): Promise<string[][]> => {
    const users = await fetchScopedUsers();
    return users.map((row) => {
      const link = row.companies.find((c) => c.isDefault) ?? row.companies[0];
      const company = link
        ? companyLinkLabel(link)
        : row.defaultCompanyId
          ? (companies.find((x) => x.id === row.defaultCompanyId)?.nameAr ?? row.defaultCompanyId.slice(0, 8))
          : '—';
      return [
        row.fullNameAr ?? row.email,
        row.email,
        USER_TYPE_LABEL_MAP[row.userType ?? ''] ?? row.userType ?? '—',
        company,
        userStatusLabel(row),
      ];
    });
  });

  const archiveScopeLabel =
    ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.find((o) => o.value === archiveScope)?.label ?? '';

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        <RegisterExportMenu
          title="سجل المستخدمين"
          fileName="users"
          columns={USER_EXPORT_COLUMNS}
          getRows={getExportRows}
          subtitleLines={[`العرض: ${archiveScopeLabel}`]}
        />
        <Can when={perms.canCreate}>
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> مستخدم جديد
          </Button>
        </Can>
      </div>
    ),
    [openCreate, perms.canCreate, getExportRows, archiveScopeLabel],
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
