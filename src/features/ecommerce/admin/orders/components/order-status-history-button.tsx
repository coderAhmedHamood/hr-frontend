'use client';

import * as React from 'react';
import { useQueries } from '@tanstack/react-query';
import { History, Store, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useOrderDetail } from '@/features/ecommerce/admin/orders/hooks/use-orders';
import { ORDER_STATUS_LABELS_AR } from '@/features/ecommerce/domain/constants/order-status';
import type { OrderStatusHistoryEntry } from '@/features/ecommerce/domain/types/order';
import { usersApi } from '@/features/hr/organization/lib/api/users';
import { cn, formatDisplayDateTime } from '@/shared/utils';

type Props = {
  companyId: string;
  orderId: string;
  orderNumber?: string;
  /** When already loaded (order detail), skip an extra fetch. */
  history?: OrderStatusHistoryEntry[];
  className?: string;
  size?: 'sm' | 'icon';
};

function formatDateTime(iso: string) {
  return formatDisplayDateTime(iso);
}

function useChangedByNames(userIds: string[]) {
  const unique = React.useMemo(
    () => [...new Set(userIds.filter(Boolean))],
    [userIds],
  );

  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: ['users', 'display-name', id] as const,
      queryFn: () => usersApi.getById(id),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  });

  return React.useMemo(() => {
    const map = new Map<string, string>();
    unique.forEach((id, index) => {
      const user = results[index]?.data;
      if (!user) return;
      const label =
        user.fullNameAr?.trim() ||
        user.fullNameEn?.trim() ||
        user.email?.trim() ||
        id;
      map.set(id, label);
    });
    return map;
  }, [unique, results]);
}

function StatusHistoryTimeline({
  entries,
  loading,
}: {
  entries: OrderStatusHistoryEntry[];
  loading?: boolean;
}) {
  const nameById = useChangedByNames(
    entries.map((entry) => entry.changedBy).filter((id): id is string => Boolean(id)),
  );

  if (loading) {
    return <p className="py-6 text-center text-sm text-muted-foreground">جاري تحميل السجل…</p>;
  }

  if (!entries.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        لا توجد حركات مسجّلة على هذا الطلب بعد.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0 border-s border-border/80 ms-3">
      {entries.map((entry, index) => {
        const actorLabel = entry.changedBy
          ? nameById.get(entry.changedBy) ?? 'معالج…'
          : 'المتجر / العميل';
        const ActorIcon = entry.changedBy ? UserRound : Store;

        return (
          <li key={entry.id ?? `${entry.createdAt}-${entry.toStatus}-${index}`} className="relative pb-5 ps-5 last:pb-0">
            <span className="absolute -start-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {entry.fromStatus ? (
                  <>
                    <Badge variant="outline">{ORDER_STATUS_LABELS_AR[entry.fromStatus]}</Badge>
                    <span className="text-xs text-muted-foreground">→</span>
                  </>
                ) : null}
                <Badge variant="secondary">{ORDER_STATUS_LABELS_AR[entry.toStatus]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
              <p className="inline-flex items-center gap-1.5 text-sm text-foreground">
                <ActorIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {actorLabel}
              </p>
              {entry.note?.trim() ? (
                <p className="rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                  {entry.note.trim()}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * History icon — opens status change log for an order.
 * Works from orders list/kanban, partner profile, and order detail dialog.
 */
export function OrderStatusHistoryButton({
  companyId,
  orderId,
  orderNumber,
  history: preloadedHistory,
  className,
  size = 'icon',
}: Props) {
  const [open, setOpen] = React.useState(false);
  const needsFetch = open && preloadedHistory === undefined;
  const detailQuery = useOrderDetail(companyId, needsFetch ? orderId : null);
  const entries = preloadedHistory ?? detailQuery.data?.statusHistory ?? [];
  const loading = needsFetch && (detailQuery.isLoading || detailQuery.isFetching);
  const titleNumber = orderNumber ?? detailQuery.data?.orderNumber;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={size === 'icon' ? 'icon' : 'sm'}
        className={cn(size === 'sm' && 'gap-1.5', className)}
        aria-label="سجل حركات الطلب"
        title="سجل حركات الطلب"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <History className="h-4 w-4" />
        {size === 'sm' ? <span>السجل</span> : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-md sm:max-w-md')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle>سجل حركات الطلب</DialogTitle>
            <DialogDescription>
              {titleNumber ? (
                <span dir="ltr">{titleNumber}</span>
              ) : (
                'تتبّع تغييرات الحالة والمعالجين'
              )}
            </DialogDescription>
          </div>
          <div className={dialogShellBodyClass}>
            <StatusHistoryTimeline entries={entries} loading={loading} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
