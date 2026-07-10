import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlidePanel, SlidePanelContent } from '@/components/ui/slide-panel';
import { MinimalDropdown } from '@/components/ui/shared-dialogs';
import {
  PERMISSION_ROLE_COLOR_TOKENS,
  coercePermissionRoleColorToken,
  permissionRoleCssColor,
  type PermissionRoleColorToken,
} from '@/features/system/permissions/constants/role-colors';
import type { ApplicationResponseDto } from '@/features/system/permissions/lib/api/applications';
import { RolePermissionTreePicker } from '@/features/system/permissions/components/role-permission-tree-picker';
import {
  resolveDefaultApplicationId,
} from '@/features/system/permissions/hooks/useApplications';
import { usePermissionsByApplication } from '@/features/system/permissions/hooks/usePermissionsByApplication';

export type RoleFormValues = {
  name: string;
  description: string;
  applicationId: string;
  /** Permission IDs selected for this role */
  permissionIds: string[];
  color: PermissionRoleColorToken;
};

const BLANK: RoleFormValues = {
  name: '',
  description: '',
  applicationId: '',
  permissionIds: [],
  color: 'primary',
};

type Props = {
  open: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  editingTitle: string | null;
  initialValues: RoleFormValues | null;
  applications: ApplicationResponseDto[];
  onOpenChange: (open: boolean) => void;
  onSave: (values: RoleFormValues) => void;
};

export function RoleFormPanel({
  open, isLoading, isSaving, isEditing, editingTitle, initialValues,
  applications,
  onOpenChange, onSave,
}: Props) {
  const [form, setForm] = React.useState<RoleFormValues>(BLANK);

  React.useEffect(() => {
    if (!open) return;
    if (initialValues) {
      setForm(initialValues);
      return;
    }
    setForm({
      ...BLANK,
      applicationId: resolveDefaultApplicationId(applications),
    });
  }, [open, initialValues, applications]);

  const {
    items: availablePermissions,
    isLoading: permissionsLoading,
    isError: permissionsError,
  } = usePermissionsByApplication(form.applicationId || null, open, { catalogApplications: applications });
  const applicationOptions = React.useMemo(
    () => applications.map((app) => ({ value: app.id, label: app.nameAr })),
    [applications],
  );
  const selectedApplication = applications.find((app) => app.id === form.applicationId);

  function handleApplicationChange(applicationId: string) {
    setForm((prev) => ({
      ...prev,
      applicationId,
      permissionIds: [],
    }));
  }

  const panelBusy = isLoading || permissionsLoading || (!isEditing && applications.length === 0);

  return (
    <SlidePanel open={open} onOpenChange={onOpenChange}>
      <SlidePanelContent
        size="xl"
        title={editingTitle ? `تعديل: ${editingTitle}` : 'دور جديد'}
        description="اختر التطبيق ثم حدد اسم الدور والصلاحيات المناسبة"
        footer={
          <div className="flex gap-2">
            <Button
              variant="luxe"
              className="flex-1"
              disabled={
                !form.name.trim()
                || !form.applicationId
                || isSaving
                || panelBusy
              }
              onClick={() => onSave(form)}
            >
              {isSaving
                ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ…</>
                : <><Check className="h-4 w-4" /> حفظ التغييرات</>}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              إلغاء
            </Button>
          </div>
        }
      >
        {panelBusy ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label>التطبيق</Label>
              {isEditing ? (
                <Input
                  value={selectedApplication?.nameAr ?? form.applicationId}
                  disabled
                  className="bg-muted/40"
                />
              ) : (
                <MinimalDropdown
                  value={form.applicationId}
                  onChange={handleApplicationChange}
                  options={applicationOptions}
                  placeholder="اختر التطبيق (إلزامي)"
                  className="h-9 w-full text-sm"
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                {isEditing
                  ? 'لا يمكن تغيير التطبيق بعد إنشاء الدور.'
                  : 'يُعرض فقط صلاحيات التطبيق المختار.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>اسم الدور</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="مثال: مشرف الفرع"
              />
            </div>

            <div className="space-y-1.5">
              <Label>الوصف</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر لصلاحيات هذا الدور..."
              />
            </div>

            <div className="space-y-2">
              <Label>لون الدور</Label>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_ROLE_COLOR_TOKENS.map((token) => {
                  const c = permissionRoleCssColor(token);
                  const selected = form.color === token;
                  return (
                    <button
                      key={token}
                      type="button"
                      title={token}
                      onClick={() => setForm((p) => ({ ...p, color: coercePermissionRoleColorToken(token) }))}
                      className="h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                      style={{
                        background: c,
                        boxShadow: selected
                          ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${c}`
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label>شجرة الصلاحيات</Label>
              {permissionsError ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  تعذّر تحميل صلاحيات هذا التطبيق.
                </div>
              ) : (
                <RolePermissionTreePicker
                  permissions={availablePermissions}
                  selectedIds={form.permissionIds}
                  onChange={(permissionIds) => setForm((p) => ({ ...p, permissionIds }))}
                />
              )}
            </div>
          </div>
        )}
      </SlidePanelContent>
    </SlidePanel>
  );
}
