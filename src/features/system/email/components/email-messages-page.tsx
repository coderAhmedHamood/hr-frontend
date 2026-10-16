'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mail, RefreshCw, RotateCw, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MinimalDropdown, PageHeader, EmptyState, Pagination } from '@/components/ui/shared-dialogs';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { useCan } from '@/features/auth/hooks/use-can';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  emailMessagesApi,
  type EmailMessageResponseDto,
  type EmailMessageStatus,
} from '@/features/system/email/lib/api/email-messages';
import {
  EMAIL_STATUS_FILTER_OPTIONS,
  EMAIL_STATUS_LABELS,
  EMAIL_STATUS_TONE,
  emailSkipReasonLabel,
} from '@/features/system/email/constants/status-labels';
import { SendEmailDrawer } from '@/features/system/email/components/send-email-drawer';
import { cn } from '@/shared/utils';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function StatusCell({ row }: { row: EmailMessageResponseDto }) {
  const detail =
    row.status === 'failed'
      ? row.errorMessage
      : row.status === 'skipped'
        ? emailSkipReasonLabel(row.skipReason)
        : null;
  return (
    <div className="min-w-0 space-y-0.5">
      <Badge variant={EMAIL_STATUS_TONE[row.status]}>{EMAIL_STATUS_LABELS[row.status]}</Badge>
      {detail ? <p className="truncate text-[11px] text-muted-foreground" title={detail}>{detail}</p> : null}
    </div>
  );
}

export function EmailMessagesPage() {
  const companyId = useDefaultCompanyId();
  const can = useCan();
  const canRead = can('system.email-messages.read');
  const canSend = can('system.email-messages.create');

  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(20);
  const [status, setStatus] = React.useState<EmailMessageStatus | ''>('');
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [composeOpen, setComposeOpen] = React.useState(false);
  const debouncedSearch = useDebounced(search, 350);

  React.useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch, dateFrom, dateTo]);

  const queryClient = useQueryClient();
  const queryKey = [
    'system-email',
    'messages',
    companyId,
    page,
    perPage,
    status,
    debouncedSearch,
    dateFrom,
    dateTo,
  ] as const;

  const listQuery = useQuery({
    queryKey,
    queryFn: () =>
      emailMessagesApi.list({
        companyId: companyId!,
        page,
        limit: perPage,
        status: status || undefined,
        q: debouncedSearch || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: !!companyId && canRead,
    placeholderData: (prev) => prev,
  });

  const resend = useMutation({
    mutationFn: (id: string) => emailMessagesApi.resend(id),
    onSuccess: (row) => {
      void queryClient.invalidateQueries({ queryKey: ['system-email', 'messages'] });
      if (row.status === 'sent') toast.success('أُعيد إرسال الرسالة بنجاح');
      else toast.error(`لم تُرسل: ${row.errorMessage ?? 'سبب غير معروف'}`);
    },
    onError: (err) => {
      // apiRequest already toasted this failure — just route it through the shared handler.
      handleApiError(err, 'system-email.resend');
    },
  });

  if (!canRead) {
    return <ForbiddenState title="لا تملك صلاحية الوصول إلى رسائل البريد" />;
  }

  const items = listQuery.data?.items ?? [];
  const pagination = listQuery.data?.pagination;
  const hasFilters = !!status || !!debouncedSearch || !!dateFrom || !!dateTo;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader title="رسائل البريد" description="سجل كل بريد خرج من هذه الشركة — إلى من، متى، وهل وصل.">
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs"
            onClick={() => void listQuery.refetch()}
            disabled={listQuery.isFetching}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', listQuery.isFetching && 'animate-spin')} />
            تحديث
          </Button>
          {canSend ? (
            <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setComposeOpen(true)}>
              <Send className="h-3.5 w-3.5" />
              إرسال رسالة جديدة
            </Button>
          ) : null}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-border/70 bg-card p-3 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالبريد المستلم أو الموضوع…"
            className="pe-9"
          />
        </div>
        <MinimalDropdown
          value={status}
          onChange={(v) => setStatus(v as EmailMessageStatus | '')}
          options={EMAIL_STATUS_FILTER_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {listQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
          جاري التحميل…
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={hasFilters ? 'لا نتائج مطابقة لعوامل البحث' : 'لا توجد رسائل بعد'}
          description={hasFilters ? 'جرّب تغيير الفلاتر.' : 'ستظهر هنا كل رسالة تُرسل من هذه الشركة.'}
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border/70 bg-card shadow-soft">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="sticky top-0 z-10 bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2.5 text-start font-medium">التاريخ</th>
                <th className="px-3 py-2.5 text-start font-medium">المستلم</th>
                <th className="px-3 py-2.5 text-start font-medium">الموضوع</th>
                <th className="px-3 py-2.5 text-start font-medium">الحالة</th>
                <th className="px-3 py-2.5 text-start font-medium">المرسل</th>
                <th className="px-3 py-2.5 text-start font-medium">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-t border-border/50 hover:bg-muted/20">
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-muted-foreground" dir="ltr">
                    {formatDateTime(row.createdAt)}
                  </td>
                  <td className="px-3 py-2.5" dir="ltr">
                    {row.toEmail}
                  </td>
                  <td className="max-w-[18rem] truncate px-3 py-2.5" title={row.subject}>
                    {row.subject}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusCell row={row} />
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {row.triggeredByName ?? (row.sourceKind === 'manual_broadcast' ? '—' : 'النظام')}
                  </td>
                  <td className="px-3 py-2.5">
                    {canSend && (row.status === 'failed' || row.status === 'pending') ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => resend.mutate(row.id)}
                        disabled={resend.isPending}
                      >
                        <RotateCw className="h-3 w-3" />
                        إعادة إرسال
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.total > 0 ? (
        <Pagination
          page={page}
          perPage={perPage}
          total={pagination.total}
          onPage={setPage}
          onPerPage={setPerPage}
        />
      ) : null}

      <SendEmailDrawer
        open={composeOpen}
        onOpenChange={setComposeOpen}
        companyId={companyId}
        onSent={() => void listQuery.refetch()}
      />
    </div>
  );
}
