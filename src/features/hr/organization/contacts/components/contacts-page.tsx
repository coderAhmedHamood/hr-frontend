'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  HRSettingsFormDrawer,
  FormField,
  ConfirmationModal,
} from '@/components/ui/shared-dialogs';
import {
  useContactsDirectoryModel,
  USER_TYPE_OPTIONS,
  USER_STATUS_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
} from '@/features/hr/organization/contacts/hooks/useContactsDirectoryModel';
import { ContactsListViews } from '@/features/hr/organization/contacts/components/contacts-list-views';
import { UserDetailDialog } from '@/features/hr/organization/contacts/dialogs/user-detail-dialog';
import { ForbiddenState } from '@/components/shared/forbidden-state';

export default function ContactsPage() {
  const model = useContactsDirectoryModel();

  if (model.accessDenied) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <ContactsListViews model={model} />

      <HRSettingsFormDrawer
        open={model.drawerOpen}
        onOpenChange={model.setDrawerOpen}
        title={model.editId ? 'تعديل مستخدم' : 'مستخدم جديد'}
        onSave={model.handleSave}
        saveDisabled={model.saving}
        error={model.error}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="البريد الإلكتروني" required span2>
            <Input
              dir="ltr"
              type="email"
              value={model.form.email}
              onChange={(e) => model.patch({ email: e.target.value })}
              placeholder="user@example.com"
            />
          </FormField>

          <FormField label={model.editId ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'} required={!model.editId} span2>
            <Input
              dir="ltr"
              type="password"
              value={model.form.password}
              onChange={(e) => model.patch({ password: e.target.value })}
              placeholder="••••••••"
            />
          </FormField>

          <FormField label="الاسم">
            <Input
              value={model.form.fullNameAr}
              onChange={(e) => model.patch({ fullNameAr: e.target.value })}
            />
          </FormField>

          <FormField label="رقم الجوال">
            <Input
              dir="ltr"
              value={model.form.phone}
              onChange={(e) => model.patch({ phone: e.target.value })}
              placeholder="+966 …"
            />
          </FormField>

          <FormField label="نوع المستخدم">
            <Select value={model.form.userType} onValueChange={(v) => model.patch({ userType: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {USER_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="الفرع الافتراضي">
            <Select
              value={model.form.defaultBranchId || '_none'}
              onValueChange={(v) => model.patch({ defaultBranchId: v === '_none' ? '' : v })}
            >
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— بدون —</SelectItem>
                {model.branchesForDefault.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {model.editId && (
            <FormField label="الحالة">
              <Select value={model.form.status} onValueChange={(v) => model.patch({ status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {USER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {model.editId && (
            <>

              <FormField label="المنطقة الزمنية" span2>
                <Select value={model.form.timezone} onValueChange={(v) => model.patch({ timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {model.editId && (
            <div className="flex items-center justify-between rounded-xl border border-border p-4">
              <span className="text-sm">نشط</span>
              <Switch checked={model.form.isActive} onCheckedChange={(v) => model.patch({ isActive: v })} />
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <span className="text-sm">موثّق</span>
            <Switch checked={model.form.isVerified} onCheckedChange={(v) => model.patch({ isVerified: v })} />
          </div>
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!model.confirmId}
        onOpenChange={(v) => { if (!v) model.setConfirmId(null); }}
        title="حذف المستخدم"
        description="هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="حذف"
        variant="destructive"
        onConfirm={model.handleDelete}
      />

      <UserDetailDialog
        user={model.viewRow}
        companies={model.companies}
        branches={model.branches}
        onOpenChange={(open) => { if (!open) model.setViewRow(null); }}
        onEdit={model.openEdit}
        onUserUpdated={model.patchUserInList}
      />
    </div>
  );
}
