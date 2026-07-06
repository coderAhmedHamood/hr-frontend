import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SlidePanel, SlidePanelContent } from '@/components/ui/slide-panel';
import {
  PERMISSION_ROLE_COLOR_TOKENS,
  coercePermissionRoleColorToken,
  permissionRoleCssColor,
  type PermissionRoleColorToken,
} from '@/features/system/permissions/constants/role-colors';
import type { PermissionResponseDto } from '@/features/system/permissions/lib/api/permissions';
import { RolePermissionTreePicker } from '@/features/system/permissions/components/role-permission-tree-picker';

export type RoleFormValues = {
  name: string;
  description: string;
  /** Permission IDs selected for this role */
  permissionIds: string[];
  color: PermissionRoleColorToken;
};

const BLANK: RoleFormValues = { name: '', description: '', permissionIds: [], color: 'primary' };

type Props = {
  open: boolean;
  isLoading: boolean;
  isSaving: boolean;
  editingTitle: string | null;
  initialValues: RoleFormValues | null;
  /** Full permission catalog (all applications) */
  availablePermissions: PermissionResponseDto[];
  onOpenChange: (open: boolean) => void;
  onSave: (values: RoleFormValues) => void;
};

export function RoleFormPanel({
  open, isLoading, isSaving, editingTitle, initialValues,
  availablePermissions,
  onOpenChange, onSave,
}: Props) {
  const [form, setForm] = React.useState<RoleFormValues>(BLANK);

  React.useEffect(() => {
    if (open) setForm(initialValues ?? BLANK);
  }, [open, initialValues]);

  return (
    <SlidePanel open={open} onOpenChange={onOpenChange}>
      <SlidePanelContent
        size="xl"
        title={editingTitle ? `تعديل: ${editingTitle}` : 'دور جديد'}
        description="حدد اسم الدور واختر الصلاحيات من شجرة النظام"
        footer={
          <div className="flex gap-2">
            <Button
              variant="luxe"
              className="flex-1"
              disabled={!form.name.trim() || isSaving || isLoading}
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
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
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
              <RolePermissionTreePicker
                permissions={availablePermissions}
                selectedIds={form.permissionIds}
                onChange={(permissionIds) => setForm((p) => ({ ...p, permissionIds }))}
              />
            </div>
          </div>
        )}
      </SlidePanelContent>
    </SlidePanel>
  );
}
