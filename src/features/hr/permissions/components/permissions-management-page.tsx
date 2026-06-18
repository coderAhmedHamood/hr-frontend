'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { Button } from '@/components/ui/button';
import { useRoles } from '@/features/hr/permissions/hooks/useRoles';
import { usePermissions } from '@/features/hr/permissions/hooks/usePermissions';
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

  const isCatalogReady = !permissionsLoading && !permissionsError;

  function openCreate() {
    void refetchPermissions();
    setEditingRole(null);
    setInitialValues(null);
    setPanelOpen(true);
  }

  async function openEdit(role: RoleResponseDto) {
    void refetchPermissions();
    setEditingRole(role);
    setInitialValues(null);
    setPanelOpen(true);
    setPanelLoading(true);
    try {
      const loaded = await loadRoleForEdit(role.id);
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
    try {
      if (editingRole) {
        await update.mutateAsync({
          roleId: editingRole.id,
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds,
        });
        toast.success('تم تحديث الدور والصلاحيات بنجاح');
      } else {
        await create.mutateAsync({
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds,
        });
        toast.success('تم إنشاء الدور وربط الصلاحيات بنجاح');
      }
      setPanelOpen(false);
    } catch {
      // Toast shown by mutation onError
    }
  }

  async function handleDelete(roleId: string) {
    await remove.mutateAsync(roleId);
    setDeleteTarget(null);
  }

  const isSaving = create.isPending || update.isPending;

  // For the role card progress bar: count granted vs total app permissions
  const appActionCount = appPermissions.filter((p) => p.nodeType === 'ACTION').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">الأدوار</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أنشئ الأدوار وحدد الصلاحيات على كل مورد — تعيين الأدوار على الموظفين يتم من ملف الموظف
          </p>
        </div>
        <Button variant="luxe" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> إضافة دور
        </Button>
      </div>

      {permissionsError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          تعذّر تحميل قائمة الصلاحيات من الخادم. تأكد من تسجيل الدخول وأن الـ API يعمل.
        </div>
      )}

      {rolesLoading ? (
        <RolesGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              grantedCount={grantedMap[role.id]?.length ?? 0}
              totalCount={appActionCount}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}

          <button
            type="button"
            onClick={openCreate}
            className="group flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/50 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-muted/30" />
      ))}
    </div>
  );
}
