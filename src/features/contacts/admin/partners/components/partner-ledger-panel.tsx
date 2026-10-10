'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Ban, ChevronLeft, ChevronRight, Plus, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { useCan } from '@/features/auth/hooks/use-can';
import { useCompanyCurrency } from '@/features/auth/lib/company-currency';
import { PARTNER_LEDGER_PERMISSIONS } from '@/features/contacts/admin/permissions';
import {
  usePartnerLedger,
  usePartnerLedgerMutations,
} from '@/features/contacts/admin/partners/hooks/use-partner-ledger';
import {
  PARTNER_LEDGER_KIND_LABELS,
  PARTNER_LEDGER_KINDS,
  PARTNER_LEDGER_SOURCE_LABELS,
  type PartnerLedgerDirection,
  type PartnerLedgerKind,
  type PartnerLedgerLine,
  type PartnerLedgerTotals,
} from '@/features/contacts/admin/partners/lib/api/partner-ledger';
import { CURRENCIES, currencyDefinition, currencySymbolAr } from '@/shared/currencies';
import { cn, formatDisplayDate, formatMoneyDigits } from '@/shared/utils';

const PAGE_SIZE = 50;
const todayIso = () => new Date().toISOString().slice(0, 10);

function money(value: string | number, currency: string): string {
  const decimals = currencyDefinition(currency)?.decimals ?? 2;
  return `${formatMoneyDigits(Math.abs(Number(value)), decimals)} ${currencySymbolAr(currency) || currency}`;
}

/** "عليه 300" / "له 300" / "متوازن" for a debit − credit balance. */
function balanceText(balance: string | number, currency: string): string {
  const n = Number(balance);
  if (n === 0) return 'متوازن';
  return `${n > 0 ? 'عليه' : 'له'} ${money(n, currency)}`;
}

function SummaryTiles({ totals }: { totals: PartnerLedgerTotals[] }) {
  if (totals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        لا قيود بعد: الرصيد صفر.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {totals.map((t) => {
        const n = Number(t.balance);
        return (
          <div key={t.currencyCode} className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card p-3">
              <p className="text-xs text-muted-foreground">إجمالي ما عليه (مدين)</p>
              <p className="mt-1 text-lg font-semibold text-destructive" dir="ltr">{money(t.debit, t.currencyCode)}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-3">
              <p className="text-xs text-muted-foreground">إجمالي ما له (دائن)</p>
              <p className="mt-1 text-lg font-semibold text-success" dir="ltr">{money(t.credit, t.currencyCode)}</p>
            </div>
            <div
              className={cn(
                'rounded-2xl border p-3',
                n > 0 ? 'border-destructive/40 bg-destructive/5' : n < 0 ? 'border-success/40 bg-success/5' : 'border-border/70 bg-card',
              )}
            >
              <p className="text-xs text-muted-foreground">الرصيد الصافي · {t.entries} قيد</p>
              <p className={cn('mt-1 text-lg font-bold', n > 0 ? 'text-destructive' : n < 0 ? 'text-success' : 'text-foreground')}>
                {balanceText(t.balance, t.currencyCode)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LineDialog({
  open,
  onOpenChange,
  initialKind,
  companyId,
  partnerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKind: PartnerLedgerKind;
  companyId: string;
  partnerId: string;
}) {
  const companyCurrency = useCompanyCurrency();
  const { create } = usePartnerLedgerMutations(companyId, partnerId);
  const [kind, setKind] = React.useState<PartnerLedgerKind>(initialKind);
  const [direction, setDirection] = React.useState<PartnerLedgerDirection>('debit');
  const [amount, setAmount] = React.useState('');
  const [currency, setCurrency] = React.useState(companyCurrency);
  const [entryDate, setEntryDate] = React.useState(todayIso());
  const [description, setDescription] = React.useState('');
  const [reference, setReference] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setDirection('debit');
    setAmount('');
    setCurrency(companyCurrency);
    setEntryDate(todayIso());
    setDescription('');
    setReference('');
  }, [open, initialKind, companyCurrency]);

  const def = PARTNER_LEDGER_KINDS.find((k) => k.value === kind)!;
  const side = def.direction ?? direction;
  const valid = /^\d{1,14}(\.\d{1,4})?$/.test(amount.trim()) && Number(amount) > 0 && description.trim().length > 0;

  const save = async () => {
    try {
      await create.mutateAsync({
        kind,
        direction: def.direction ? undefined : direction,
        amount: amount.trim(),
        currencyCode: currency,
        entryDate,
        description: description.trim(),
        reference: reference.trim() || undefined,
      });
      toast.success('سُجّل القيد');
      onOpenChange(false);
    } catch {
      // The API client already showed the server's reason.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-lg sm:max-w-lg')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="text-base font-semibold">قيد جديد على جهة الاتصال</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            المدين (عليه) يزيد ما تطلبه منه، والدائن (له) يزيد ما يطلبه منك.
          </p>
        </div>
        <div className={cn(dialogShellBodyClass, 'space-y-4')}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">نوع القيد</label>
            <Select value={kind} onValueChange={(v) => setKind(v as PartnerLedgerKind)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PARTNER_LEDGER_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                    {k.direction ? (k.direction === 'debit' ? ' · عليه' : ' · له') : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{def.hint}</p>
          </div>

          {def.direction ? (
            <p className={cn('rounded-xl px-3 py-2 text-xs font-medium', side === 'debit' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
              {side === 'debit' ? 'يُسجَّل عليه (مدين)' : 'يُسجَّل له (دائن)'}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(['debit', 'credit'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={cn(
                    'min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors',
                    direction === d
                      ? d === 'debit'
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-success bg-success/10 text-success'
                      : 'border-border hover:bg-muted',
                  )}
                >
                  {d === 'debit' ? 'عليه (مدين)' : 'له (دائن)'}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="ledger-amount">المبلغ</label>
              <Input id="ledger-amount" inputMode="decimal" dir="ltr" className="h-10 text-lg font-semibold" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">العملة</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="ledger-date">التاريخ</label>
              <Input id="ledger-date" type="date" className="h-10" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="ledger-ref">المرجع (اختياري)</label>
              <Input id="ledger-ref" className="h-10" placeholder="رقم الفاتورة أو الإيصال" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium" htmlFor="ledger-desc">البيان</label>
            <Textarea id="ledger-desc" rows={2} placeholder="مثال: فاتورة توريد شهر أكتوبر" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="ctc-dialog-footer gap-2 border-t border-border px-4 py-4 sm:px-6">
          <Button type="button" disabled={!valid || create.isPending} onClick={() => void save()}>
            {create.isPending ? 'جاري الحفظ…' : 'تسجيل'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VoidDialog({
  line,
  onClose,
  companyId,
  partnerId,
}: {
  line: PartnerLedgerLine | null;
  onClose: () => void;
  companyId: string;
  partnerId: string;
}) {
  const { voidLine } = usePartnerLedgerMutations(companyId, partnerId);
  const [reason, setReason] = React.useState('');
  React.useEffect(() => setReason(''), [line?.id]);
  if (!line) return null;
  const confirm = async () => {
    try {
      await voidLine.mutateAsync({ id: line.id, reason: reason.trim() });
      toast.success('أُلغي القيد');
      onClose();
    } catch {
      // Shown by the API client.
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-md sm:max-w-md')}>
        <div className={dialogShellHeaderClass}>
          <DialogTitle className="text-base font-semibold">إلغاء القيد</DialogTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            يبقى القيد في السجل ويخرج من الرصيد: {line.description} ({money(line.amount, line.currencyCode)})
          </p>
        </div>
        <div className={dialogShellBodyClass}>
          <label className="text-xs font-medium" htmlFor="ledger-void-reason">السبب</label>
          <Input id="ledger-void-reason" className="mt-1.5 h-10" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
        </div>
        <DialogFooter className="ctc-dialog-footer gap-2 border-t border-border px-4 py-4 sm:px-6">
          <Button type="button" variant="destructive" disabled={!reason.trim() || voidLine.isPending} onClick={() => void confirm()}>
            إلغاء القيد
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>رجوع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SourceBadge({ line }: { line: PartnerLedgerLine }) {
  const label = PARTNER_LEDGER_SOURCE_LABELS[line.sourceApp] ?? line.sourceApp;
  return <Badge variant="outline" className="text-[10px] font-normal">{label}</Badge>;
}

/**
 * Partner account (كشف الحساب): what the contact owes (عليه) and is owed
 * (له), every line with its running balance, totals per currency. Lines are
 * entered here or posted by other apps (point of sale, sales, purchases,
 * accounting…), which void their own lines.
 */
export function PartnerLedgerPanel({ companyId, partnerId }: { companyId: string; partnerId: string }) {
  const can = useCan();
  const mayCreate = can(PARTNER_LEDGER_PERMISSIONS.create);
  const mayRead = can(PARTNER_LEDGER_PERMISSIONS.read);
  const mayVoid = can(PARTNER_LEDGER_PERMISSIONS.delete);
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');
  const [kind, setKind] = React.useState<PartnerLedgerKind | 'all'>('all');
  const [includeVoid, setIncludeVoid] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [dialogKind, setDialogKind] = React.useState<PartnerLedgerKind | null>(null);
  const [voiding, setVoiding] = React.useState<PartnerLedgerLine | null>(null);

  React.useEffect(() => setPage(1), [from, to, kind, includeVoid]);

  const { data, isLoading, isError, isFetching } = usePartnerLedger({
    companyId,
    partnerId,
    from: from || undefined,
    to: to || undefined,
    kind: kind === 'all' ? undefined : kind,
    includeVoid,
    page,
    limit: PAGE_SIZE,
  }, mayRead);

  if (!mayRead) {
    return (
      <p className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        عرض الحساب يحتاج صلاحية cnt.partner-ledger.read.
      </p>
    );
  }

  const lines = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-card p-4 sm:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-primary" />الحساب (له وعليه)</h2>
          <p className="text-xs text-muted-foreground">كل المبالغ على جهة الاتصال ولها، من هنا ومن التطبيقات المرتبطة، مع الرصيد بعد كل قيد.</p>
        </div>
        {mayCreate ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setDialogKind('invoice')}>+ عليه</Button>
            <Button size="sm" variant="outline" onClick={() => setDialogKind('payment_received')}>+ دفعة منه</Button>
            <Button size="sm" onClick={() => setDialogKind('bill')}><Plus className="h-4 w-4" />قيد جديد</Button>
          </div>
        ) : null}
      </header>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />
      ) : isError ? (
        <p className="text-sm text-destructive">تعذر تحميل الحساب.</p>
      ) : (
        <SummaryTiles totals={data?.totals ?? []} />
      )}

      <div className="grid gap-2 rounded-2xl bg-muted/40 p-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end">
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground" htmlFor="ledger-from">من تاريخ</label>
          <Input id="ledger-from" type="date" className="h-9 bg-card" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground" htmlFor="ledger-to">إلى تاريخ</label>
          <Input id="ledger-to" type="date" className="h-9 bg-card" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] text-muted-foreground">النوع</label>
          <Select value={kind} onValueChange={(v) => setKind(v as PartnerLedgerKind | 'all')}>
            <SelectTrigger className="h-9 bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {PARTNER_LEDGER_KINDS.map((k) => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <label className="flex h-9 items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={includeVoid} onCheckedChange={setIncludeVoid} />
          إظهار الملغى
        </label>
      </div>

      {!isLoading && lines.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">لا قيود في هذه الفترة.</p>
      ) : (
        <>
          {/* Phones: cards */}
          <ul className="space-y-2 md:hidden">
            {lines.map((l) => (
              <li key={l.id} className={cn('rounded-2xl border border-border p-3', l.status === 'void' && 'opacity-60')}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className={cn('text-sm font-medium', l.status === 'void' && 'line-through')}>{l.description}</p>
                    <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                      <span>{formatDisplayDate(l.entryDate)}</span>
                      <span>· {PARTNER_LEDGER_KIND_LABELS[l.kind]}</span>
                      {l.reference ? <span dir="ltr">· {l.reference}</span> : null}
                      <SourceBadge line={l} />
                    </div>
                  </div>
                  <p className={cn('shrink-0 text-sm font-semibold', l.direction === 'debit' ? 'text-destructive' : 'text-success')}>
                    {l.direction === 'debit' ? 'عليه' : 'له'} {money(l.amount, l.currencyCode)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  {l.status === 'void' ? (
                    <span className="text-muted-foreground">ملغى: {l.voidReason}</span>
                  ) : (
                    <span className="text-muted-foreground">الرصيد: {balanceText(l.balanceAfter ?? 0, l.currencyCode)}</span>
                  )}
                  {mayVoid && l.status === 'posted' && l.sourceApp === 'contacts' ? (
                    <Button size="sm" variant="ghost" className="h-7 text-destructive" onClick={() => setVoiding(l)}><Ban className="h-3.5 w-3.5" />إلغاء</Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {/* Tablets and up: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">التاريخ</th>
                  <th className="px-3 py-2 text-start font-medium">البيان</th>
                  <th className="px-3 py-2 text-start font-medium">النوع / المصدر</th>
                  <th className="px-3 py-2 text-end font-medium">عليه (مدين)</th>
                  <th className="px-3 py-2 text-end font-medium">له (دائن)</th>
                  <th className="px-3 py-2 text-end font-medium">الرصيد</th>
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} className={cn('border-t border-border/70', l.status === 'void' && 'text-muted-foreground')}>
                    <td className="whitespace-nowrap px-3 py-2">{formatDisplayDate(l.entryDate)}</td>
                    <td className="px-3 py-2">
                      <p className={cn('font-medium', l.status === 'void' && 'line-through')}>{l.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {l.reference ? <span dir="ltr">{l.reference} · </span> : null}
                        {l.createdByName ?? ''}
                        {l.status === 'void' ? ` · ملغى: ${l.voidReason ?? ''}` : ''}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs">{PARTNER_LEDGER_KIND_LABELS[l.kind]}</span>
                        <SourceBadge line={l} />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-end font-medium text-destructive">
                      {l.direction === 'debit' ? money(l.amount, l.currencyCode) : ''}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-end font-medium text-success">
                      {l.direction === 'credit' ? money(l.amount, l.currencyCode) : ''}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-end text-xs">
                      {l.status === 'void' ? '—' : balanceText(l.balanceAfter ?? 0, l.currencyCode)}
                    </td>
                    <td className="px-2 py-2">
                      {mayVoid && l.status === 'posted' && l.sourceApp === 'contacts' ? (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="إلغاء القيد" onClick={() => setVoiding(l)}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{pagination.total} قيد · صفحة {pagination.page} من {pagination.totalPages}{isFetching ? ' …' : ''}</span>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" aria-label="السابق" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronRight className="h-4 w-4" /></Button>
                <Button size="icon" variant="outline" className="h-8 w-8" aria-label="التالي" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronLeft className="h-4 w-4" /></Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {dialogKind ? (
        <LineDialog
          key={dialogKind}
          open
          onOpenChange={(o) => !o && setDialogKind(null)}
          initialKind={dialogKind}
          companyId={companyId}
          partnerId={partnerId}
        />
      ) : null}
      <VoidDialog line={voiding} onClose={() => setVoiding(null)} companyId={companyId} partnerId={partnerId} />
    </section>
  );
}
