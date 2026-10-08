'use client';

import * as React from 'react';
import Link from 'next/link';
import { FlaskConical, Inbox } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  dialogMobileFullScreenClass,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/shared/utils';
import { useExpensesStore } from '../data/store';
import { toMinor, type Minor } from '../domain/money';
import { STATUS_LABELS_AR } from '../domain/policy';
import { ORG } from '../domain/types';
import type { PartyId, TxnStatus } from '../domain/types';
import { useCurrency, useDirectory, useExpensesData } from './expenses-provider';

const STATUS_VARIANT: Record<TxnStatus, BadgeProps['variant']> = {
  draft: 'subtle',
  submitted: 'warning',
  approved: 'success',
  rejected: 'destructive',
  void: 'outline',
};

export function StatusBadge({ status }: { status: TxnStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn('shrink-0', status === 'void' && 'line-through')}>
      {STATUS_LABELS_AR[status]}
    </Badge>
  );
}

export function Money({ value, className, signed }: { value: Minor; className?: string; signed?: boolean }) {
  const { format } = useCurrency();
  return (
    <span className={cn('tabular-nums', className)} dir="ltr">
      {signed && value > 0 ? '+' : ''}
      {format(value)}
    </span>
  );
}

export function PartyName({ id, link = true }: { id: PartyId | null | undefined; link?: boolean }) {
  const directory = useDirectory();
  const name = directory.nameOf(id);
  if (!id || id === ORG || !link || !directory.get(id)) return <span>{name}</span>;
  return (
    <Link href={`/expenses/people/${encodeURIComponent(id)}`} className="text-primary hover:underline">
      {name}
    </Link>
  );
}

export function SourceBadge({ id }: { id: PartyId }) {
  const directory = useDirectory();
  const p = directory.get(id);
  if (!p) return null;
  if (p.source === 'demo') return <Badge variant="gold" className="text-[10px]">تجريبي</Badge>;
  if (p.kind === 'contact') return <Badge variant="subtle" className="text-[10px]">جهة اتصال بلا حساب</Badge>;
  return null;
}

/** One participant (optionally the organization). */
export function PartySelect({
  value,
  onChange,
  includeOrg,
  placeholder = 'اختر الشخص',
  exclude = [],
  id,
}: {
  value: PartyId | null;
  onChange: (id: PartyId) => void;
  includeOrg?: boolean;
  placeholder?: string;
  exclude?: PartyId[];
  id?: string;
}) {
  const directory = useDirectory();
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger id={id} className="h-10">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeOrg && !exclude.includes(ORG) ? <SelectItem value={ORG}>المنشأة</SelectItem> : null}
        {directory.choices
          .filter((p) => !exclude.includes(p.id))
          .map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
              {p.source === 'demo' ? ' · تجريبي' : p.kind === 'contact' ? ' · بلا حساب' : ''}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

/** Several participants (checkbox chips), optionally the organization. */
export function PartyChecklist({
  value,
  onChange,
  includeOrg,
  limitTo,
}: {
  value: PartyId[];
  onChange: (ids: PartyId[]) => void;
  includeOrg?: boolean;
  limitTo?: PartyId[] | null;
}) {
  const directory = useDirectory();
  const options: Array<{ id: PartyId; name: string }> = [
    ...(includeOrg ? [{ id: ORG as PartyId, name: 'المنشأة' }] : []),
    ...directory.choices.filter((p) => !limitTo || limitTo.includes(p.id)).map((p) => ({ id: p.id, name: p.name })),
  ];
  const toggle = (id: PartyId) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            aria-pressed={on}
            className={cn(
              'min-h-9 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted',
            )}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

/** Amount typed in major units; reports minor units of the app currency. */
export function AmountInput({
  value,
  onChange,
  id,
  placeholder = '0',
  autoFocus,
}: {
  value: string;
  onChange: (text: string, minor: Minor) => void;
  id?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const { decimals, code } = useCurrency();
  return (
    <div className="relative">
      <Input
        id={id}
        inputMode="decimal"
        dir="ltr"
        autoFocus={autoFocus}
        className="h-11 pe-14 text-start text-base tabular-nums"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const text = e.target.value.replace(/[^\d.,]/g, '');
          onChange(text, toMinor(text || '0', decimals));
        }}
      />
      <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground">{code}</span>
    </div>
  );
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor?: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5', className)}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-1.5">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <Inbox className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}

/** Dialog that fills the phone screen, with a scrollable body and a footer. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, dialogMobileFullScreenClass, wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}>
        <DialogHeader className={dialogShellHeaderClass}>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
        </DialogHeader>
        <div className={cn(dialogShellBodyClass, 'space-y-4 px-4 py-4 sm:px-6')}>{children}</div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border px-4 py-3 sm:px-6">{footer}</div>
      </DialogContent>
    </Dialog>
  );
}

/** Asks for a reason (void / reject). */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState('');
  React.useEffect(() => {
    if (open) setReason('');
  }, [open]);
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            تراجع
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} disabled={!reason.trim()} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <Field label="السبب" htmlFor="reason">
        <Input id="reason" className="h-10" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field>
    </FormDialog>
  );
}

/**
 * "Act as" — the prototype's simulation of who is working (to try approvals
 * between people). Clearly marked; real ERP permissions still gate screens.
 */
export function SimulationBar() {
  const actorId = useExpensesStore((s) => s.actorId);
  const setActor = useExpensesStore((s) => s.setActor);
  const sources = useExpensesStore((s) => s.sources);
  const data = useExpensesData();
  const directory = useDirectory();
  if (!data) return null;
  const approver = actorId ? data.settings.approverIds.includes(actorId) : false;
  const sourceText =
    sources.users === 'loading' || sources.contacts === 'loading'
      ? 'جارٍ قراءة المشاركين…'
      : sources.users === 'live' || sources.contacts === 'live'
        ? `المشاركون: ${sources.users === 'live' ? 'مستخدمو الشركة' : ''}${sources.users === 'live' && sources.contacts === 'live' ? ' + ' : ''}${sources.contacts === 'live' ? 'جهات الاتصال الداخلية' : ''} + بيانات تجريبية`
        : 'المشاركون: بيانات تجريبية فقط (تعذر قراءة المستخدمين وجهات الاتصال)';
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-1.5 font-medium text-foreground">
        <FlaskConical className="h-4 w-4 shrink-0 text-gold" />
        نموذج تجريبي — البيانات محفوظة في هذا المتصفح فقط لهذه الشركة وهذا المستخدم.
        <span className="hidden text-muted-foreground md:inline">{sourceText}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-muted-foreground">تصرّف كـ (محاكاة):</span>
        <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
          <Select value={actorId ?? undefined} onValueChange={setActor}>
            <SelectTrigger className="h-8 bg-card text-xs">
              <SelectValue placeholder="اختر" />
            </SelectTrigger>
            <SelectContent>
              {directory.choices.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {data.settings.approverIds.includes(p.id) ? ' · معتمِد' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {approver ? <Badge variant="success" className="shrink-0 text-[10px]">معتمِد</Badge> : null}
      </div>
    </div>
  );
}

/** Responsive list: cards on phones, a table from md up. */
export function ResponsiveTable<T>({
  rows,
  rowKey,
  columns,
  card,
  onRowClick,
}: {
  rows: readonly T[];
  rowKey: (row: T) => string;
  columns: Array<{ header: string; cell: (row: T) => React.ReactNode; className?: string }>;
  card: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
}) {
  return (
    <>
      <div className="space-y-2 md:hidden">
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            role={onRowClick ? 'button' : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={onRowClick ? (e) => (e.key === 'Enter' ? onRowClick(row) : undefined) : undefined}
            className={cn('rounded-xl border border-border bg-card p-3', onRowClick && 'cursor-pointer active:bg-muted/50')}
          >
            {card(row)}
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              {columns.map((c) => (
                <th key={c.header} className={cn('px-3 py-2.5 text-start font-medium', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('border-t border-border/70', onRowClick && 'cursor-pointer hover:bg-muted/30')}
              >
                {columns.map((c) => (
                  <td key={c.header} className={cn('px-3 py-2.5 align-middle', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function KeyValue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-end">{children}</span>
    </div>
  );
}

export function LoadingBlock() {
  return <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />;
}
