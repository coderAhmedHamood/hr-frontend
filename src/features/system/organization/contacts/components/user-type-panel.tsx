'use client';

import * as React from 'react';
import { Loader2, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { usersApi, type UserResponseDto } from '@/features/hr/organization/lib/api/users';
import { usePagePermissions } from '@/features/auth/permissions';
import {
  isPartnerPortalUserType,
  userTypeFormOptions,
  userTypeLabelAr,
  type UserType,
} from '@/features/system/users/constants/user-type';
import { CONTACTS_PAGE_PERMISSIONS } from '@/features/system/organization/contacts/permissions';

type Props = {
  user: UserResponseDto;
  onUpdated?: (user: UserResponseDto) => void;
};

export function UserTypePanel({ user, onUpdated }: Props) {
  const { canUpdate } = usePagePermissions(CONTACTS_PAGE_PERMISSIONS);
  const locked = user.userType === 'platform_admin';
  const [draftType, setDraftType] = React.useState<UserType>(
    (user.userType as UserType) ?? 'internal_employee',
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setDraftType((user.userType as UserType) ?? 'internal_employee');
  }, [user.id, user.userType]);

  const typeOptions = React.useMemo(
    () => userTypeFormOptions(user.userType),
    [user.userType],
  );

  const dirty = draftType !== ((user.userType as UserType) ?? 'internal_employee');
  const wasPortal = isPartnerPortalUserType(user.userType);
  const willPortal = isPartnerPortalUserType(draftType);
  const convertingToStaff = wasPortal && !willPortal && draftType === 'internal_employee';

  const save = async () => {
    if (!dirty || locked) return;
    setSaving(true);
    try {
      const updated = await usersApi.update(user.id, { userType: draftType });
      toast.success('تم تحديث نوع المستخدم');
      onUpdated?.(updated);
    } catch (err) {
      handleApiError(err, 'users.user-type');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="text-right">
        <h3 className="text-sm font-semibold">نوع المستخدم</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          يحدد بوابة الدخول: موظف داخلي → لوحة ERP (`/login`)، عميل/شريك → المتجر.
        </p>
      </div>
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              {canUpdate && !locked ? (
                <Select
                  value={draftType}
                  onValueChange={(v) => setDraftType(v as UserType)}
                  disabled={saving || typeOptions.length <= 1}
                >
                  <SelectTrigger className="h-10 max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm font-medium">{userTypeLabelAr(user.userType)}</p>
              )}
              {locked ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  نوع مالك المنصة لا يُغيّر من هذه الشاشة.
                </p>
              ) : null}
              {convertingToStaff && dirty ? (
                <p className="text-xs text-muted-foreground">
                  بعد الحفظ يمكن للمستخدم الدخول من{' '}
                  <span dir="ltr" className="font-mono text-[11px]">
                    /login
                  </span>{' '}
                  — تأكد من إسناد الشركة والصلاحيات في تبويبي الشركات والصلاحيات.
                </p>
              ) : null}
              {dirty && willPortal && !wasPortal ? (
                <p className="text-xs text-muted-foreground">
                  بعد الحفظ سيُستخدم حساب المتجر (`/store/login`) ولن يقبل `/login` الإداري.
                </p>
              ) : null}
            </div>
          </div>
          {canUpdate && !locked && dirty ? (
            <Button type="button" size="sm" className="h-9 shrink-0" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ النوع'}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
