'use client';

import * as React from 'react';
import Link from 'next/link';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { systemOwnerRoutes } from '@/features/system-owner/constants/routes';
import {
  useSystemOwnerActivationRequests,
  useSystemOwnerMutations,
} from '@/features/system-owner/hooks/use-system-owner';

export function SystemOwnerRequestsPage() {
  const [status, setStatus] = React.useState<'pending' | 'all'>('pending');
  const { data, isLoading, isError } = useSystemOwnerActivationRequests(
    status === 'pending' ? 'pending' : undefined,
  );
  const { approveRequest, rejectRequest } = useSystemOwnerMutations();
  const [note, setNote] = React.useState('');

  return (
    <div className="flex flex-col gap-4">
      <SetPageTitle
        titleAr="طلبات التفعيل"
        descriptionAr="موافقة أو رفض طلبات تفعيل تطبيقات الشركات"
        iconName="Inbox"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={status === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatus('pending')}
        >
          الواردة
        </Button>
        <Button
          size="sm"
          variant={status === 'all' ? 'default' : 'outline'}
          onClick={() => setStatus('all')}
        >
          الكل
        </Button>
      </div>
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="ملاحظة القرار (اختياري)"
        className="max-w-md"
      />
      {isLoading ? <p className="text-sm text-muted-foreground">جاري التحميل…</p> : null}
      {isError ? <p className="text-sm text-destructive">تعذر تحميل الطلبات.</p> : null}
      {(data ?? []).map((row) => (
        <article key={row.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium">{row.applicationNameAr || row.applicationCode || 'تطبيق'}</p>
              <p className="text-sm text-muted-foreground">
                {row.companyNameAr ? (
                  <Link
                    className="hover:text-primary"
                    href={systemOwnerRoutes.companyDetail(row.companyId)}
                  >
                    {row.companyNameAr}
                  </Link>
                ) : (
                  row.companyId.slice(0, 8)
                )}
              </p>
              {row.message ? <p className="mt-1 text-sm">{row.message}</p> : null}
            </div>
            <Badge
              variant={
                row.status === 'approved'
                  ? 'success'
                  : row.status === 'rejected'
                    ? 'destructive'
                    : row.status === 'cancelled'
                      ? 'subtle'
                      : 'warning'
              }
            >
              {row.status === 'approved'
                ? 'موافق'
                : row.status === 'rejected'
                  ? 'مرفوض'
                  : row.status === 'cancelled'
                    ? 'ملغى'
                    : 'قيد الانتظار'}
            </Badge>
          </div>
          {row.status === 'pending' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={approveRequest.isPending || rejectRequest.isPending}
                onClick={() =>
                  void approveRequest.mutateAsync({ id: row.id, decisionNote: note.trim() || undefined })
                }
              >
                موافقة
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={approveRequest.isPending || rejectRequest.isPending}
                onClick={() =>
                  void rejectRequest.mutateAsync({ id: row.id, decisionNote: note.trim() || undefined })
                }
              >
                رفض
              </Button>
            </div>
          ) : row.decisionNote ? (
            <p className="mt-2 text-xs text-muted-foreground">{row.decisionNote}</p>
          ) : null}
        </article>
      ))}
      {!isLoading && (data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد طلبات.</p>
      ) : null}
    </div>
  );
}
