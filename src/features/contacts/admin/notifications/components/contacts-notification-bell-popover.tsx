'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Circle, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/shared/utils';
import { DisplayDate } from '@/components/ui/table-cells';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useCan } from '@/features/auth/hooks/use-can';
import { contactsAdminRoutes } from '@/features/contacts/admin/constants/routes';
import {
  CONTACTS_SOURCE_KIND_LABELS,
  CONTACTS_SEVERITY_DOT_CLASS,
} from '@/features/contacts/admin/notifications/constants/notification-labels';
import {
  useContactsNotificationsStore,
  selectContactsInbox,
  countUnreadContactsInbox,
} from '@/features/contacts/admin/notifications/lib/contacts-notifications-store';
import { resolveContactsNotificationLink } from '@/features/contacts/admin/notifications/lib/resolve-contacts-notification-link';
import { NOTIFICATION_SEVERITY_LABELS } from '@/features/hr/notifications/admin/constants/notification-labels';
import type { NotificationSeverity } from '@/features/hr/notifications/lib/api/notifications';

export function ContactsNotificationBellPopover() {
  const can = useCan();
  const canRead = can('cnt.notifications.read') || can('hr.notifications.read');
  const canUpdate = can('cnt.notifications.update') || can('hr.notifications.update');

  const userId = useAuthStore((s) => s.user?.id ?? s.accessProfile?.userId ?? '');
  const { items, markRead, markAllReadForUser } = useContactsNotificationsStore();
  const [open, setOpen] = React.useState(false);

  const fetch = useContactsNotificationsStore((s) => s.fetch);
  const unreadCountApi = useContactsNotificationsStore((s) => s.unreadTotal);
  const inbox = React.useMemo(() => selectContactsInbox(items, userId), [items, userId]);
  const unread = unreadCountApi > 0 ? unreadCountApi : countUnreadContactsInbox(items, userId);

  React.useEffect(() => {
    if (userId && canRead) void fetch(userId);
  }, [userId, canRead, fetch]);

  React.useEffect(() => {
    if (open && userId && canRead) void fetch(userId);
  }, [open, userId, canRead, fetch]);

  if (!canRead || !userId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative h-8 w-8 shrink-0 rounded-xl border-primary/25 bg-background/80 shadow-xs"
          aria-label="إشعارات جهات الاتصال"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,420px)] overflow-hidden p-0" dir="rtl">
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold text-foreground">إشعارات جهات الاتصال</p>
          {canUpdate ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              disabled={inbox.every((n) => n.readAt)}
              onClick={() => markAllReadForUser(userId)}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              قراءة الكل
            </Button>
          ) : null}
        </div>

        <div className="max-h-[min(60vh,380px)] overflow-y-auto">
          {inbox.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              لا توجد إشعارات جهات اتصال في صندوقك
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {inbox.map((n) => {
                const sourceLabel =
                  (n.sourceKind && CONTACTS_SOURCE_KIND_LABELS[n.sourceKind]) ?? 'جهات اتصال';
                const severityLabel =
                  NOTIFICATION_SEVERITY_LABELS[n.severity as NotificationSeverity] ?? n.severity;
                const href = resolveContactsNotificationLink(n);

                return (
                  <li key={n.id} className="flex gap-2 px-3 py-2.5 hover:bg-muted/40">
                    {canUpdate ? (
                      <button
                        type="button"
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors',
                          n.readAt
                            ? 'border-success/30 bg-success/10 text-success'
                            : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/40',
                        )}
                        title={n.readAt ? 'مقروء' : 'تحديد كمقروء'}
                        disabled={Boolean(n.readAt)}
                        onClick={() => markRead(n.id)}
                      >
                        {n.readAt ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </button>
                    ) : null}
                    <div className="min-w-0 flex-1 text-right">
                      <div className="flex min-w-0 items-start gap-2">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                            CONTACTS_SEVERITY_DOT_CLASS[n.severity] ?? 'bg-muted-foreground',
                          )}
                          aria-hidden
                        />
                        <p
                          className={cn(
                            'text-sm font-medium leading-snug',
                            !n.readAt && 'text-foreground',
                          )}
                        >
                          {n.titleAr}
                        </p>
                      </div>
                      {n.bodyAr ? (
                        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                          {n.bodyAr}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="rounded-md bg-muted/70 px-1.5 py-0.5">{sourceLabel}</span>
                        <span className="rounded-md bg-muted/70 px-1.5 py-0.5">{severityLabel}</span>
                      </div>
                      {href ? (
                        <Link
                          href={href}
                          className="mt-1 inline-block text-[11px] text-primary hover:underline"
                          onClick={() => {
                            if (!n.readAt) void markRead(n.id);
                            setOpen(false);
                          }}
                        >
                          {n.actionLabelAr?.trim() || 'عرض التفاصيل'}
                        </Link>
                      ) : null}
                      <DisplayDate value={n.createdAt} mode="datetime" className="mt-1 text-[10px]" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {can('cnt.settings.read') || can('hr.notifications.read') ? (
          <div className="border-t border-border px-3 py-2">
            <Link
              href={contactsAdminRoutes.settings}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              onClick={() => setOpen(false)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              إعدادات إشعارات جهات الاتصال
            </Link>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
