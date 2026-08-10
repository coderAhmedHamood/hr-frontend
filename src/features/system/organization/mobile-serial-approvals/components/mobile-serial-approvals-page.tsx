'use client';

import * as React from 'react';
import { Check, MonitorSmartphone, X } from 'lucide-react';
import { Can } from '@/components/shared/can';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCan } from '@/features/auth/hooks/use-can';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { CONTACTS_PAGE_PERMISSIONS } from '@/features/system/organization/contacts/permissions';
import {
  useApproveMobileSerial,
  useMobileSerialApprovals,
  useRejectMobileSerial,
} from '@/features/system/organization/mobile-serial-approvals/hooks/use-mobile-serial-approvals';
import {
  LOGIN_CHANNEL_LABELS_AR,
  normalizeLoginChannel,
  resolvePendingSerial,
  resolvePreviousSerial,
  type DeviceLoginChannel,
  type MobileSerialApproval,
  type MobileSerialApprovalStatus,
} from '@/features/system/organization/mobile-serial-approvals/lib/api/mobile-serial-approvals-api';

const STATUS_LABELS: Record<MobileSerialApprovalStatus, string> = {
  pending: 'بانتظار الموافقة',
  approved: 'موافَق',
  rejected: 'مرفوض',
};

function displayName(row: MobileSerialApproval): string {
  return (
    row.userFullNameAr?.trim() ||
    row.userFullNameEn?.trim() ||
    row.userEmail?.trim() ||
    row.userPhone?.trim() ||
    row.userId.slice(0, 8)
  );
}

export default function MobileSerialApprovalsPage() {
  const can = useCan();
  const companyId = useDefaultCompanyId();
  const canRead = can(CONTACTS_PAGE_PERMISSIONS.read);
  const canUpdate = can(CONTACTS_PAGE_PERMISSIONS.update);

  const [status, setStatus] = React.useState<MobileSerialApprovalStatus | 'all'>('pending');
  const [loginChannel, setLoginChannel] = React.useState<DeviceLoginChannel | 'all'>('all');

  const listQuery = {
    companyId: companyId || undefined,
    status,
    loginChannel,
    page: 1,
    limit: 100,
  };

  const list = useMobileSerialApprovals(listQuery, Boolean(companyId) && canRead);
  const approve = useApproveMobileSerial();
  const reject = useRejectMobileSerial();
  const busyId = approve.isPending
    ? (approve.variables as string | undefined)
    : reject.isPending
      ? (reject.variables as string | undefined)
      : null;

  if (!canRead) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle
        titleAr="موافقة الأجهزة"
        descriptionAr="طلبات ربط جهاز تطبيق أو موقع بعد تفعيل إعدادات الموافقة في الموارد البشرية."
        iconName="Smartphone"
      />

      {!companyId ? (
        <p className="text-sm text-muted-foreground">اختر شركة أولاً لعرض الطلبات.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">الحالة</p>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as MobileSerialApprovalStatus | 'all')}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">بانتظار الموافقة</SelectItem>
                  <SelectItem value="approved">موافَق</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                  <SelectItem value="all">الكل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">القناة</p>
              <Select
                value={loginChannel}
                onValueChange={(v) => setLoginChannel(v as DeviceLoginChannel | 'all')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="app">تطبيق</SelectItem>
                  <SelectItem value="web">موقع</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {list.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : list.isError ? (
            <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive">
              تعذر تحميل طلبات الموافقة.
              <button
                type="button"
                className="ms-2 underline"
                onClick={() => void list.refetch()}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (list.data?.items ?? []).length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
              <MonitorSmartphone className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">لا توجد طلبات ضمن هذا الفلتر.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {(list.data?.items ?? []).map((row) => {
                const channel = normalizeLoginChannel(row.loginChannel);
                return (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{displayName(row)}</p>
                        <Badge variant="subtle">{STATUS_LABELS[row.status] ?? row.status}</Badge>
                        {channel ? (
                          <Badge variant="subtle" className="text-muted-foreground">
                            {LOGIN_CHANNEL_LABELS_AR[channel]}
                          </Badge>
                        ) : null}
                      </div>
                      {(row.userEmail || row.userPhone) ? (
                        <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                          {[row.userEmail, row.userPhone].filter(Boolean).join(' · ')}
                        </p>
                      ) : null}
                      {row.userFullNameEn &&
                      row.userFullNameEn.trim() !== (row.userFullNameAr?.trim() || '') ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground" dir="ltr">
                          {row.userFullNameEn}
                        </p>
                      ) : null}
                      <div className="mt-1.5 space-y-0.5 text-[11px]" dir="ltr">
                        <p className="text-muted-foreground">
                          <span className="text-foreground/70">القديم:</span>{' '}
                          <span className="font-mono">
                            {resolvePreviousSerial(row) || '—'}
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          <span className="text-foreground/70">الجديد:</span>{' '}
                          <span className="font-mono font-medium text-foreground">
                            {resolvePendingSerial(row) || '—'}
                          </span>
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString('ar')
                          : null}
                      </p>
                    </div>
                    {row.status === 'pending' ? (
                      <Can permission={CONTACTS_PAGE_PERMISSIONS.update}>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1"
                            disabled={busyId === row.id}
                            onClick={() => {
                              if (
                                window.confirm(
                                  'الموافقة على هذا الجهاز؟ سيُرسل إيميل التفعيل للمستخدم.',
                                )
                              ) {
                                approve.mutate(row.id);
                              }
                            }}
                          >
                            <Check className="h-4 w-4" />
                            موافقة
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive hover:text-destructive"
                            disabled={busyId === row.id}
                            onClick={() => {
                              if (window.confirm('رفض طلب ربط هذا الجهاز؟')) {
                                reject.mutate(row.id);
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                            رفض
                          </Button>
                        </div>
                      </Can>
                    ) : null}
                    {row.status === 'pending' && !canUpdate ? (
                      <p className="text-[11px] text-muted-foreground">
                        تحتاج صلاحية تعديل المستخدمين
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
