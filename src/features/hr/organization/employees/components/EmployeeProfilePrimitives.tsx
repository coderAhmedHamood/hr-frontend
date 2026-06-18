'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

const ACCENT_VALUE_STYLES = {
  primary: 'text-primary bg-primary/5 border-primary/15',
  gold: 'text-gold bg-gold/5 border-gold/20',
  success: 'text-success bg-success/5 border-success/20',
  warning: 'text-warning bg-warning/5 border-warning/20',
  destructive: 'text-destructive bg-destructive/5 border-destructive/20',
} as const;

const ACCENT_TEXT_STYLES = {
  primary: 'text-primary',
  gold: 'text-gold',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
} as const;

type ProfileAccent = keyof typeof ACCENT_VALUE_STYLES;

export function Prop({ icon: Icon, label, children, mono, accent }: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  accent?: ProfileAccent;
}) {
  if (children === null || children === undefined || children === '' || children === false) return null;

  return (
    <div className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-soft transition-all hover:border-primary/20 hover:shadow-elevated">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-[11px] font-medium text-muted-foreground truncate">{label}</div>
      </div>
      <div
        className={cn(
          'rounded-lg border px-3 py-2 text-sm font-medium min-w-0 break-words',
          mono && 'font-mono text-xs tracking-wide',
          accent ? ACCENT_VALUE_STYLES[accent] : 'text-foreground bg-muted/50 border-border/70',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function SectionH({ action }: {
  icon?: React.ElementType;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  if (!action) return null;
  return (
    <div className="flex items-center justify-end gap-2 mb-4">
      {action}
    </div>
  );
}

export function FieldGroup({ title, hint, children }: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center justify-between gap-3 mb-3.5 px-0.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="h-4 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {hint ? (
          <span className="shrink-0 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="rounded-2xl border border-border/80 bg-card/80 p-3 sm:p-4 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ItemRow({ children, href }: {
  children: React.ReactNode;
  href?: string;
}) {
  const cls = cn(
    'group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3',
    'transition-all hover:border-primary/20 hover:bg-card hover:shadow-xs',
  );
  if (href) return <Link href={href} className={cn(cls, 'cursor-pointer')}>{children}</Link>;
  return <div className={cls}>{children}</div>;
}

export function Stat({ value, label, sub, accent, icon: Icon }: {
  value: React.ReactNode;
  label: string;
  sub?: string;
  accent?: ProfileAccent;
  icon?: React.ElementType;
}) {
  const valueColor = accent ? ACCENT_TEXT_STYLES[accent] : 'text-foreground';
  const cardStyle = accent ? ACCENT_VALUE_STYLES[accent] : 'border-border/70 bg-card text-foreground';

  return (
    <div className={cn('relative flex flex-col gap-2 rounded-xl border p-4 shadow-soft transition-all hover:shadow-elevated', cardStyle)}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        {Icon ? <Icon className={cn('h-3.5 w-3.5 opacity-70', valueColor)} /> : null}
      </div>
      <div className={cn('font-arabic-display text-2xl font-semibold tabular-nums leading-none', valueColor)}>
        {value}
      </div>
      {sub ? <div className="text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function Empty({ icon: Icon, text, action }: {
  icon: React.ElementType;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/25 px-6 py-10 text-center text-muted-foreground">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-soft">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm">{text}</p>
      {action}
    </div>
  );
}

export function fmtLeaveBalance(n: number): string {
  if (!Number.isFinite(n)) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

type LeaveCardAccent = 'success' | 'primary';

export function LeaveBalanceCard({
  title,
  year,
  entitlementLabel,
  entitled,
  used,
  available,
  yearEndExpected,
  onRequestLeave,
  accent = 'success',
}: {
  title: string;
  year: number;
  entitlementLabel: string;
  entitled: number;
  used: number;
  available: number;
  yearEndExpected: number;
  onRequestLeave: () => void;
  accent?: LeaveCardAccent;
}) {
  const pctUsed = entitled > 0 ? Math.min(100, (used / entitled) * 100) : 0;
  const barCls = accent === 'primary' ? 'bg-primary' : 'bg-success';
  const availTextCls = accent === 'primary' ? 'text-primary' : 'text-success';
  const availDotCls = accent === 'primary' ? 'bg-primary' : 'bg-success';

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3" dir="rtl">
        <h3 className="min-w-0 text-right text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <span className="shrink-0 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold tabular-nums text-muted-foreground">
          {year}
        </span>
      </div>

      <div className="py-4" dir="rtl">
        <div className="flex h-2.5 w-full justify-end overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-[width] duration-300', barCls)}
            style={{ width: `${pctUsed}%` }}
          />
        </div>
      </div>

      <div className="space-y-0 border-t border-border" dir="rtl">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm">
          <span className="font-arabic-display text-base font-semibold tabular-nums text-foreground">{fmtLeaveBalance(entitled)}</span>
          <span className="text-right text-muted-foreground">{entitlementLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm">
          <span className={cn('font-arabic-display text-base font-semibold tabular-nums', availTextCls)}>
            {fmtLeaveBalance(available)}
          </span>
          <span className="flex items-center gap-2 text-right text-foreground">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', availDotCls)} aria-hidden />
            المتاح للاستخدام
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 text-sm">
          <span className="font-arabic-display text-base font-semibold tabular-nums text-foreground">{fmtLeaveBalance(used)}</span>
          <span className="flex items-center gap-2 text-right text-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/60" aria-hidden />
            الإجازات المستخدمة
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 py-3 text-sm">
          <span className="font-arabic-display text-base font-semibold tabular-nums text-foreground">
            {fmtLeaveBalance(yearEndExpected)}
          </span>
          <span className="flex items-center gap-2 text-right text-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-border" aria-hidden />
            الرصيد المتوقع بنهاية السنة
          </span>
        </div>
      </div>

      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-xl text-sm font-medium"
          onClick={onRequestLeave}
        >
          طلب إجازة
        </Button>
      </div>
    </div>
  );
}
