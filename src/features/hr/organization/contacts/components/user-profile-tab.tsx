'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DetailField } from '@/components/shared/detail-field';
import {
  USER_TYPE_LABELS,
} from '@/features/hr/organization/contacts/constants/users-directory';
import type { UserResponseDto } from '@/features/hr/organization/lib/api/users';
import { getInitials, formatDisplayDateTime } from '@/shared/utils';

type Props = {
  user: UserResponseDto;
};

export function UserProfileTab({ user }: Props) {
  const displayName = user.fullNameAr ?? user.email;

  return (
    <div className="space-y-5">
      {/* ── Identity card ── */}
      <div className="flex items-center justify-end gap-4 rounded-xl border border-border bg-gradient-to-l from-primary/5 to-transparent p-4">
        <div className="min-w-0 flex-1 text-right">
          <p className="truncate text-base font-semibold">{displayName}</p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground" dir="ltr">{user.email}</p>
          <div className="mt-2 flex flex-wrap justify-end gap-1">
            <Badge variant="outline" className="text-[10px]">
              {USER_TYPE_LABELS[user.userType ?? ''] ?? user.userType ?? '—'}
            </Badge>
            {user.isVerified && (
              <Badge variant="secondary" className="text-[10px]">موثّق</Badge>
            )}
            {user.isActive ? (
              <Badge variant="outline" className="border-success/40 bg-success/5 text-success">
                نشط
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-destructive">غير نشط</Badge>
            )}
          </div>
        </div>
        <Avatar className="h-14 w-14 shrink-0 ring-2 ring-primary/20">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="text-lg font-semibold">{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </div>

      {/* ── Account info ── */}
      <section>
        <h3 className="mb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          معلومات الحساب
        </h3>
        <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <DetailField label="الحالة" value={user.status} />
          <DetailField label="يمكنه الدخول" value={user.canSignIn ? 'نعم' : 'لا'} />
          <DetailField label="اللغة" value={user.languageCode} dir="ltr" />
          <DetailField label="المنطقة الزمنية" value={user.timezone} dir="ltr" />
          {user.employeeId && (
            <DetailField label="معرّف الموظف" value={user.employeeId} dir="ltr" />
          )}
        </div>
      </section>

      {/* ── Contact info ── */}
      <section>
        <h3 className="mb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          بيانات التواصل
        </h3>
        <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <DetailField label="الجوال" value={user.phone} dir="ltr" />
          {user.avatarUrl && (
            <DetailField label="رابط الصورة" value={user.avatarUrl} dir="ltr" className="sm:col-span-2" />
          )}
          {user.notes && (
            <DetailField label="ملاحظات" value={user.notes} className="sm:col-span-2" />
          )}
        </div>
      </section>

      {/* ── Timestamps ── */}
      <section>
        <h3 className="mb-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          سجل النشاط
        </h3>
        <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <DetailField label="آخر دخول" value={formatDisplayDateTime(user.lastLoginAt)} dir="ltr" />
          <DetailField label="تغيير كلمة المرور" value={formatDisplayDateTime(user.passwordChangedAt)} dir="ltr" />
          <DetailField label="تاريخ الإنشاء" value={formatDisplayDateTime(user.createdAt)} dir="ltr" />
          <DetailField label="آخر تحديث" value={formatDisplayDateTime(user.updatedAt)} dir="ltr" />
        </div>
      </section>
    </div>
  );
}
