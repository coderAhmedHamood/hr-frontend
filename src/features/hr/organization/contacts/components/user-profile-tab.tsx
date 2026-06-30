'use client';

import * as React from 'react';
import {
  CalendarClock,
  Clock,
  Globe,
  KeyRound,
  LogIn,
  Phone,
  StickyNote,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  USER_TYPE_LABELS,
} from '@/features/hr/organization/contacts/constants/users-directory';
import type { UserResponseDto } from '@/features/hr/organization/lib/api/users';
import { cn, formatDisplayDateTime } from '@/shared/utils';

type Props = {
  user: UserResponseDto;
};

function StatCard({
  label,
  value,
  dir,
  tone = 'default',
}: {
  label: string;
  value: string;
  dir?: 'ltr' | 'rtl';
  tone?: 'default' | 'success' | 'warning';
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-soft">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-sm font-semibold tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
  dir,
  className,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  dir?: 'ltr' | 'rtl';
  className?: string;
}) {
  if (value === null || value === undefined || value === '') return null;

  return (
    <div className={cn('flex items-start gap-3 rounded-xl border border-border/60 bg-muted/15 p-3.5', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium break-words" dir={dir}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="text-right">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function UserProfileTab({ user }: Props) {
  const statusLabel = user.status ?? '—';
  const canSignInLabel = user.canSignIn ? 'مسموح' : 'غير مسموح';

  return (
    <div className="space-y-6">
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="آخر دخول"
          value={user.lastLoginAt ? formatDisplayDateTime(user.lastLoginAt) : 'لم يسجّل بعد'}
          dir="ltr"
        />
        <StatCard
          label="حالة الحساب"
          value={statusLabel}
          tone={user.isActive ? 'success' : 'warning'}
        />
        <StatCard label="يمكنه الدخول" value={canSignInLabel} tone={user.canSignIn ? 'success' : 'warning'} />
        <StatCard
          label="نوع المستخدم"
          value={USER_TYPE_LABELS[user.userType ?? ''] ?? user.userType ?? '—'}
        />
      </div>

      <Section title="بيانات التواصل" description="معلومات الاتصال الأساسية">
        <InfoItem icon={Phone} label="الجوال" value={user.phone} dir="ltr" />
        <InfoItem icon={Globe} label="المنطقة الزمنية" value={user.timezone} dir="ltr" />
      </Section>

      <Section title="الأمان والصلاحيات">
        <InfoItem
          icon={LogIn}
          label="صلاحية الدخول"
          value={
            user.canSignIn ? (
              <Badge variant="outline" className="border-success/40 bg-success/5 text-success">نعم</Badge>
            ) : (
              <Badge variant="outline" className="text-destructive">لا</Badge>
            )
          }
        />
        <InfoItem
          icon={KeyRound}
          label="تغيير كلمة المرور"
          value={formatDisplayDateTime(user.passwordChangedAt)}
          dir="ltr"
        />
        <InfoItem icon={StickyNote} label="ملاحظات" value={user.notes} className="sm:col-span-2" />
      </Section>

      <Section title="سجل النشاط" description="تواريخ الإنشاء والتحديث">
        <InfoItem icon={CalendarClock} label="تاريخ الإنشاء" value={formatDisplayDateTime(user.createdAt)} dir="ltr" />
        <InfoItem icon={Clock} label="آخر تحديث" value={formatDisplayDateTime(user.updatedAt)} dir="ltr" />
      </Section>
    </div>
  );
}
