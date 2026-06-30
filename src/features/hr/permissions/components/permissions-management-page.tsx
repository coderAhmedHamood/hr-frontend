'use client';

import * as React from 'react';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ListFilterBar,
  type ListFilterInlineSelect,
} from '@/components/ui/list-filter-bar';
import { useRoles } from '@/features/hr/permissions/hooks/useRoles';
import { usePermissions, filterPermissionIdsForApplication, resolveApplicationLabel } from '@/features/hr/permissions/hooks/usePermissions';
import { useApplicationId } from '@/features/hr/permissions/hooks/useApplicationId';
import { useRolePermissionsMap } from '@/features/hr/permissions/hooks/useRolePermissionsMap';
import { useRolesMutations } from '@/features/hr/permissions/hooks/useRolesMutations';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { loadRoleForEdit } from '@/features/hr/permissions/services/roles.service';
import { coercePermissionRoleColorToken } from '@/features/hr/permissions/constants/role-colors';
import { RoleCard } from '@/features/hr/permissions/components/role-card';
import { RoleFormPanel, type RoleFormValues } from '@/features/hr/permissions/components/role-form-panel';
import { DeleteRoleDialog } from '@/features/hr/permissions/dialogs/delete-role-dialog';
import type { RoleResponseDto } from '@/features/hr/permissions/lib/api/roles';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

type RoleKindFilter = 'all' | 'system' | 'custom';

function matchesRoleSearch(role: RoleResponseDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [role.nameAr, role.name, role.code, role.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function PermissionsManagementPage() {
  useSetPageTitle({ titleAr: 'الأدوار', descriptionAr: 'إنشاء الأدوار وربط الصلاحيات', iconName: 'Shield' });

  const { applicationId: appFromApi } = useApplicationId();
  const { data: rolesResult, isLoading: rolesLoading } = useRoles();
  const {
    data: permissionsResult,
    isLoading: permissionsLoading,
    isError: permissionsError,
    refetch: refetchPermissions,
  } = usePermissions(appFromApi);

  const applicationId = permissionsResult?.applicationId ?? appFromApi;
  const allPermissions: PermissionResponseDto[] = permissionsResult?.items ?? [];
  const roles = rolesResult?.items ?? [];
  const roleIds = React.useMemo(() => roles.map((r) => r.id), [roles]);
  const { grantedMap } = useRolePermissionsMap(roleIds);

  const appPermissions = allPermissions;

  const { create, update, remove } = useRolesMutations();

  const [panelOpen, setPanelOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<RoleResponseDto | null>(null);
  const [panelLoading, setPanelLoading] = React.useState(false);
  const [initialValues, setInitialValues] = React.useState<RoleFormValues | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<RoleResponseDto | null>(null);
  const [search, setSearch] = React.useState('');
  const [roleKind, setRoleKind] = React.useState<RoleKindFilter>('all');
  const [roleApplicationId, setRoleApplicationId] = React.useState('');

  const isCatalogReady = !permissionsLoading && !permissionsError;

  const effectiveRoleApplicationId =
    roleApplicationId || editingRole?.applicationId || applicationId;
  const roleApplicationLabel = React.useMemo(
    () => resolveApplicationLabel(allPermissions, effectiveRoleApplicationId),
    [allPermissions, effectiveRoleApplicationId],
  );

  const filteredRoles = React.useMemo(() => {
    return roles.filter((role) => {
      if (roleKind === 'system' && !role.isSystem) return false;
      if (roleKind === 'custom' && role.isSystem) return false;
      return matchesRoleSearch(role, search);
    });
  }, [roles, roleKind, search]);

  const openCreate = React.useCallback(() => {
    void refetchPermissions();
    setEditingRole(null);
    setRoleApplicationId(applicationId);
    setInitialValues(null);
    setPanelOpen(true);
  }, [refetchPermissions, applicationId]);

  usePageHeaderActions(
    () => (
      <Button
        variant="luxe"
        size="sm"
        className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
        onClick={openCreate}
      >
        <Plus className="h-3.5 w-3.5" />
        إضافة دور
      </Button>
    ),
    [openCreate],
  );

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => [
    {
      id: 'roleKind',
      value: roleKind,
      onChange: (v) => setRoleKind((v || 'all') as RoleKindFilter),
      placeholder: 'نوع الدور',
      className: 'w-[9rem]',
      options: [
        { value: 'all', label: 'كل الأدوار' },
        { value: 'custom', label: 'أدوار مخصصة' },
        { value: 'system', label: 'أدوار نظامية' },
      ],
    },
  ], [roleKind]);

  const searchFilter = (
    <div className="relative w-full min-w-[12rem] max-w-xs">
      <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث بالاسم أو الرمز…"
        className="h-8 ps-8 text-xs"
      />
    </div>
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        leadingFilters={searchFilter}
        inlineSelects={inlineSelects}
        onDateBoundsChange={() => {}}
      />
    ),
    [search, roleKind, inlineSelects],
  );

  async function openEdit(role: RoleResponseDto) {
    void refetchPermissions();
    setEditingRole(role);
    setRoleApplicationId(role.applicationId ?? applicationId);
    setInitialValues(null);
    setPanelOpen(true);
    setPanelLoading(true);
    try {
      const loaded = await loadRoleForEdit(role.id);
      const appId = loaded.applicationId || role.applicationId || applicationId;
      setRoleApplicationId(appId);
      setInitialValues({
        name: loaded.name,
        description: loaded.description,
        permissionIds: loaded.permissionIds,
        color: coercePermissionRoleColorToken('primary'),
      });
    } catch (err) {
      handleApiError(err, 'roles.loadForEdit');
      setPanelOpen(false);
    } finally {
      setPanelLoading(false);
    }
  }

  async function handleSave(values: RoleFormValues) {
    const { allowed: permissionIds, rejected } = filterPermissionIdsForApplication(
      values.permissionIds,
      allPermissions,
      effectiveRoleApplicationId,
    );

    if (rejected.length > 0) {
      toast.error(
        `لا يمكن حفظ ${rejected.length} صلاحية — هذا الدور يتبع تطبيق «${roleApplicationLabel || '…'}» فقط. لصلاحيات تطبيق آخر (مثل المستخدمون) عدّل دوراً من ذلك التطبيق.`,
      );
      return;
    }

    try {
      if (editingRole) {
        await update.mutateAsync({
          roleId: editingRole.id,
          name: values.name,
          description: values.description,
          permissionIds,
        });
        toast.success('تم تحديث الدور والصلاحيات بنجاح');
      } else {
        await create.mutateAsync({
          name: values.name,
          description: values.description,
          permissionIds,
        });
        toast.success('تم إنشاء الدور وربط الصلاحيات بنجاح');
      }
      setPanelOpen(false);
    } catch {
      // Toast shown by mutation onError
    }
  }

  async function handleDelete(roleId: string) {
    const target = roles.find((r) => r.id === roleId);
    if (target?.isSystem) {
      toast.error('لا يمكن حذف الأدوار النظامية');
      setDeleteTarget(null);
      return;
    }
    await remove.mutateAsync(roleId);
    setDeleteTarget(null);
    if (editingRole?.id === roleId) {
      setPanelOpen(false);
      setEditingRole(null);
    }
  }

  const isSaving = create.isPending || update.isPending;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 animate-fade-in">
      {permissionsError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          تعذّر تحميل قائمة الصلاحيات من الخادم. تأكد من تسجيل الدخول وأن الـ API يعمل.
        </div>
      ) : null}

      {rolesLoading ? (
        <RolesGridSkeleton />
      ) : filteredRoles.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground">
          {search.trim() || roleKind !== 'all'
            ? 'لا توجد أدوار مطابقة للفلاتر'
            : 'لا توجد أدوار — أنشئ دوراً جديداً'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              grantedCount={grantedMap[role.id]?.length ?? 0}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}

          <button
            type="button"
            onClick={openCreate}
            className="group flex min-h-[72px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-card/50 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
              <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">
              إضافة دور جديد
            </span>
          </button>
        </div>
      )}

      <RoleFormPanel
        open={panelOpen}
        isLoading={panelLoading || !isCatalogReady}
        isSaving={isSaving}
        editingTitle={editingRole ? (editingRole.nameAr ?? editingRole.name ?? null) : null}
        initialValues={initialValues}
        availablePermissions={appPermissions}
        applicationLabel={roleApplicationLabel}
        onOpenChange={setPanelOpen}
        onSave={handleSave}
      />

      <DeleteRoleDialog
        role={deleteTarget}
        isDeleting={remove.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function RolesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[72px] animate-pulse rounded-lg border border-border bg-muted/30" />
      ))}
    </div>
  );
}
