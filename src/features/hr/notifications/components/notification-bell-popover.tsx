'use client';

import * as React from 'react';
import { Bell, Check, CheckCheck, ListX, Circle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/utils';
import { DisplayDate } from '@/components/ui/table-cells';
import {
  useHRNotificationsStore,
  selectInboxForRecipient,
  countUnreadInbox,
} from '@/features/hr/notifications/lib/notifications-store';
import { useCurrentEmployee } from '@/features/hr/organization/employees/hooks/useCurrentEmployee';
import { EmployeePendingPayslipsSection } from '@/features/hr/payroll/components/employee-pending-payslips-section';

export function NotificationBellPopover() {
  const { items, markRead, markUnread, markAllReadForRecipient, dismissFromInbox, dismissAllVisibleForRecipient } =
    useHRNotificationsStore();
  const [open, setOpen] = React.useState(false);

  const { data: currentEmployee } = useCurrentEmployee();
  const uid = currentEmployee?.id ?? '';
  const fetch = useHRNotificationsStore((s) => s.fetch);
  const unreadCountApi = useHRNotificationsStore((s) => s.unreadTotal);
  const inbox = React.useMemo(() => selectInboxForRecipient(items, uid), [items, uid]);
  const unread = unreadCountApi > 0 ? unreadCountApi : countUnreadInbox(items, uid);

  React.useEffect(() => {
    if (uid) void fetch(uid);
  }, [uid, fetch]);

  React.useEffect(() => {
    if (open && uid) void fetch(uid);
  }, [open, uid, fetch]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-8 w-8 shrink-0 rounded-xl border-primary/25 bg-background/80 shadow-xs"
          aria-label="التنبيهات"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,380px)] p-0 overflow-hidden" dir="rtl">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">التنبيهات</p>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              disabled={inbox.every((n) => n.readAt)}
              onClick={() => markAllReadForRecipient(uid)}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              قراءة الكل
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-destructive"
              disabled={inbox.length === 0}
              onClick={() => dismissAllVisibleForRecipient(uid)}
            >
              <ListX className="h-3.5 w-3.5" />
              إزالة الكل
            </Button>
          </div>
        </div>
        <p className="px-3 py-1.5 text-[10px] text-muted-foreground border-b border-border/60">
          إزالة الكل تخفي التنبيهات من القائمة فقط ولا تحذفها من النظام.
        </p>

        <EmployeePendingPayslipsSection />

        <div className="max-h-[min(60vh,320px)] overflow-y-auto">
          {inbox.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">لا توجد تنبيهات في صندوقك</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {inbox.map((n) => (
                <li key={n.id} className="flex gap-2 px-3 py-2.5 hover:bg-muted/40">
                  <button
                    type="button"
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
                      n.readAt
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/40',
                    )}
                    title={n.readAt ? 'تعليم كغير مقروء' : 'تعليم كمقروء'}
                    onClick={() => (n.readAt ? markUnread(n.id) : markRead(n.id))}
                  >
                    {n.readAt ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1 text-right">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium leading-snug', !n.readAt && 'text-foreground')}>{n.titleAr}</p>
                      <button
                        type="button"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                        title="إزالة من القائمة"
                        onClick={() => dismissFromInbox(n.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {n.bodyAr ? <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{n.bodyAr}</p> : null}
                    <DisplayDate value={n.createdAt} mode="datetime" className="mt-1 text-[10px]" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
