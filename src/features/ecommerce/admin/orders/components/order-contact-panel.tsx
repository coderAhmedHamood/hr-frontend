'use client';

import * as React from 'react';
import { Eye, Lock, UserRound } from 'lucide-react';
import {
  OrderAddressSection,
  OrderInternalTrail,
} from '@/features/ecommerce/admin/orders/components/order-delivery-panel';
import { OrderStaffNotePanel } from '@/features/ecommerce/admin/orders/components/order-staff-note-panel';
import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import type { Order } from '@/features/ecommerce/domain/types/order';
import { cn } from '@/shared/utils';

type Props = {
  order: Order;
  companyId: string;
  stages: OrderStagesContext | null | undefined;
};

function Section({
  tone,
  icon,
  title,
  badge,
  children,
}: {
  tone: 'customer' | 'internal';
  icon: React.ReactNode;
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'space-y-3 rounded-2xl border p-4',
        tone === 'customer' && 'border-sky-300/70 bg-sky-50/60 dark:border-sky-800/60 dark:bg-sky-950/20',
        tone === 'internal' && 'border-amber-300/70 bg-amber-50/60 dark:border-amber-800/60 dark:bg-amber-950/20',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </h3>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium',
            tone === 'customer' && 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
            tone === 'internal' && 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
          )}
        >
          {badge}
        </span>
      </div>
      {children}
    </section>
  );
}

/**
 * One tab for where the order goes and who said what about it: the address,
 * what is exchanged with the customer, and what stays inside the team.
 */
export function OrderContactPanel({ order, companyId, stages }: Props) {
  const customerNote = order.customerNote?.trim() || null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4">
        <OrderAddressSection order={order} companyId={companyId} stages={stages} />
      </section>

      <Section
        tone="customer"
        icon={<Eye className="h-4 w-4 text-sky-700 dark:text-sky-300" />}
        title="التواصل مع العميل"
        badge="يراه العميل"
      >
        {customerNote ? (
          <div className="rounded-xl border border-border/70 bg-background p-3">
            <p className="mb-1.5 inline-flex items-center gap-1 text-xs font-semibold text-foreground">
              <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
              ملاحظة العميل على الطلب
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground" dir="auto">
              {customerNote}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">لم يكتب العميل ملاحظة على الطلب.</p>
        )}
        <OrderStaffNotePanel order={order} companyId={companyId} audience="customer" />
      </Section>

      <Section
        tone="internal"
        icon={<Lock className="h-4 w-4 text-amber-700 dark:text-amber-300" />}
        title="التواصل الداخلي"
        badge="لا يراه العميل"
      >
        <OrderStaffNotePanel order={order} companyId={companyId} audience="internal" />
        <OrderInternalTrail order={order} companyId={companyId} stages={stages} />
      </Section>
    </div>
  );
}
