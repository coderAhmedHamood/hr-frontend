'use client';

import * as React from 'react';
import { Download } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';
import { cashReport, expenseReport, expensesCsv, filterExpenses, type Period, type ReportFilter, type Row } from '../domain/reports';
import { ORG } from '../domain/types';
import type { ExpensesData } from '../domain/types';
import { EmptyState, LoadingBlock, Money, PartyChecklist, Section } from './common';
import { todayIso, useCurrency, useDirectory, useExpensesData, useLedger } from './expenses-provider';

type Filters = { from: string; to: string; people: string[]; groups: string[]; categories: string[]; centers: string[]; pending: boolean };

const chip = (on: boolean) =>
  cn('min-h-9 rounded-full border px-3 text-xs font-medium', on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-muted');

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function presets(today: string) {
  return [
    { key: 'month', label: 'هذا الشهر', from: `${today.slice(0, 7)}-01`, to: today },
    { key: '30', label: 'آخر 30 يوماً', from: addDays(today, -29), to: today },
    { key: '90', label: 'آخر 90 يوماً', from: addDays(today, -89), to: today },
    { key: 'year', label: 'هذه السنة', from: `${today.slice(0, 4)}-01-01`, to: today },
  ];
}

function MultiChips({ options, value, onChange }: { options: Array<{ id: string; label: string }>; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.id} type="button" className={chip(value.includes(o.id))} onClick={() => onChange(value.includes(o.id) ? value.filter((v) => v !== o.id) : [...value, o.id])}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ReportFilters({ data, value, onChange }: { data: ExpensesData; value: Filters; onChange: (f: Filters) => void }) {
  const today = todayIso();
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-1.5">
        {presets(today).map((p) => <button key={p.key} type="button" className={chip(value.from === p.from && value.to === p.to)} onClick={() => onChange({ ...value, from: p.from, to: p.to })}>{p.label}</button>)}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <Input type="date" className="h-10" aria-label="من" value={value.from} onChange={(e) => set('from', e.target.value)} />
        <Input type="date" className="h-10" aria-label="إلى" value={value.to} onChange={(e) => set('to', e.target.value)} />
      </div>
      <div className="space-y-1"><p className="text-xs font-medium">الأشخاص</p><PartyChecklist value={value.people} onChange={(v) => set('people', v)} /></div>
      <div className="space-y-1"><p className="text-xs font-medium">الفئات</p><MultiChips options={data.categories.map((c) => ({ id: c.id, label: c.name }))} value={value.categories} onChange={(v) => set('categories', v)} /></div>
      {data.groups.length > 0 ? <div className="space-y-1"><p className="text-xs font-medium">المجموعات</p><MultiChips options={data.groups.map((g) => ({ id: g.id, label: g.name }))} value={value.groups} onChange={(v) => set('groups', v)} /></div> : null}
      {data.costCenters.length > 0 ? <div className="space-y-1"><p className="text-xs font-medium">مراكز التكلفة</p><MultiChips options={data.costCenters.map((c) => ({ id: c.id, label: `${c.code} ${c.name}` }))} value={value.centers} onChange={(v) => set('centers', v)} /></div> : null}
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={value.pending} onChange={(e) => set('pending', e.target.checked)} />تضمين المعلق (غير المعتمد)</label>
    </div>
  );
}

function Breakdown({ title, rows, label }: { title: string; rows: Row[]; label: (key: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  return (
    <Section title={title}>
      {rows.length === 0 ? <EmptyState text="لا بيانات" /> : (
        <ul className="space-y-2">
          {rows.slice(0, 8).map((r) => (
            <li key={r.key} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate">{label(r.key)} <span className="text-muted-foreground">({r.count})</span></span><Money value={r.amount} className="shrink-0 font-medium" /></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.amount / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function ReportsPage() {
  const data = useExpensesData();
  const ledger = useLedger();
  const currency = useCurrency();
  const directory = useDirectory();
  const today = todayIso();
  const [period, setPeriod] = React.useState<Period>('day');
  const [filters, setFilters] = React.useState<Filters>({ from: addDays(today, -29), to: today, people: [], groups: [], categories: [], centers: [], pending: false });
  const count = [filters.people.length, filters.groups.length, filters.categories.length, filters.centers.length, filters.pending ? 1 : 0].filter(Boolean).length;

  usePageHeaderActions(() => <FilterToggleButton activeFilterCount={count} />, [count]);
  useEntityFilterSlot(() => (data ? <ReportFilters data={data} value={filters} onChange={setFilters} /> : null), [filters, data?.categories, data?.groups, data?.costCenters]);

  if (!data || !ledger) return <LoadingBlock />;
  const f: ReportFilter = {
    currency: currency.code,
    from: filters.from || null,
    to: filters.to || null,
    participantIds: filters.people,
    groupIds: filters.groups,
    categoryIds: filters.categories,
    costCenterIds: filters.centers,
    includePending: filters.pending,
  };
  const report = expenseReport(data, f, period);
  const cash = cashReport(data, f);
  const maxSeries = Math.max(1, ...report.series.map((r) => r.amount));
  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? '—';
  const groupName = (id: string) => (id === '—' ? 'بلا مجموعة' : (data.groups.find((g) => g.id === id)?.name ?? id));
  const centerName = (id: string) => (id === '—' ? 'بلا مركز' : (() => { const c = data.costCenters.find((x) => x.id === id); return c ? `${c.code} ${c.name}` : id; })());
  const sourceName = (k: string) => (k === 'org' ? 'صندوق المنشأة' : k === 'custody' ? 'من العهد' : 'من مال الأشخاص');

  const exportCsv = () => {
    const csv = expensesCsv(filterExpenses(data, f), { category: catName, party: (id) => directory.nameOf(id), money: currency.format });
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${f.from ?? 'all'}-${f.to ?? 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <SetPageTitle titleAr="التقارير" descriptionAr="المصروفات حسب الفترة والأشخاص والمجموعات والفئات ومراكز التكلفة" iconName="BarChart3" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(['day', 'week', 'month'] as const).map((p) => <button key={p} type="button" className={chip(period === p)} onClick={() => setPeriod(p)}>{p === 'day' ? 'يومي' : p === 'week' ? 'أسبوعي' : 'شهري'}</button>)}
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="me-1.5 h-4 w-4" />تصدير CSV</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">إجمالي المصروفات</p><Money value={report.total} className="text-base font-bold sm:text-lg" /><p className="text-[11px] text-muted-foreground">{report.count} عملية</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">معلق (خارج الإجمالي)</p><Money value={report.pendingTotal} className="text-base font-bold text-warning sm:text-lg" /><p className="text-[11px] text-muted-foreground">{report.pendingCount} عملية</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">صافي خروج النقد</p><Money value={cash.netOutflow} className="text-base font-bold sm:text-lg" /><p className="text-[11px] text-muted-foreground">يشمل تمويل العهد</p></div>
        <div className="rounded-2xl border border-border bg-card p-3"><p className="text-[11px] text-muted-foreground">متوسط العملية</p><Money value={report.count ? Math.round(report.total / report.count) : 0} className="text-base font-bold sm:text-lg" /></div>
      </div>

      <Section title={period === 'day' ? 'حسب اليوم' : period === 'week' ? 'حسب الأسبوع (يبدأ السبت)' : 'حسب الشهر'}>
        {report.series.length === 0 ? <EmptyState text="لا مصروفات في الفترة" /> : (
          <div className="flex h-44 items-end gap-1 overflow-hidden" role="img" aria-label="مخطط المصروفات">
            {report.series.map((r) => (
              <div key={r.key} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${r.key}: ${currency.format(r.amount)}`}>
                <div className="w-full rounded-t bg-primary/80 group-hover:bg-primary" style={{ height: `${Math.max(3, (r.amount / maxSeries) * 140)}px` }} />
                <span className="hidden truncate text-[9px] text-muted-foreground sm:block">{period === 'month' ? r.key : r.key.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Breakdown title="حسب الفئة" rows={report.byCategory} label={catName} />
        <Breakdown title="حسب من يتحمل التكلفة" rows={report.byBearer} label={(k) => (k === ORG ? 'المنشأة' : directory.nameOf(k))} />
        <Breakdown title="حسب مصدر الدفع" rows={report.byPaymentSource} label={sourceName} />
        <Breakdown title="حسب المجموعة" rows={report.byGroup} label={groupName} />
        {data.settings.mode === 'advanced' ? <Breakdown title="حسب مركز التكلفة" rows={report.byCostCenter} label={centerName} /> : null}
        <Breakdown title="حسب من سجّل" rows={report.byCreator} label={(k) => directory.nameOf(k)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="تقرير العهد" description="التسليم والتغذية والإرجاع تحويلات — لا تُحسب مصروفات">
          {ledger.custodies.size === 0 ? <EmptyState text="لا عهد" /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-0 text-xs">
                <thead className="text-muted-foreground"><tr><th className="py-1.5 text-start font-medium">الحامل</th><th className="text-start font-medium">مسلّم</th><th className="text-start font-medium">مصروف</th><th className="text-start font-medium">مرتجع</th><th className="text-start font-medium">الرصيد</th></tr></thead>
                <tbody>
                  {[...ledger.custodies.values()].map((c) => (
                    <tr key={c.custody.id} className="border-t border-border/60">
                      <td className="py-1.5">{directory.nameOf(c.custody.holderId)}</td>
                      <td><Money value={c.issued + c.toppedUp} /></td>
                      <td><Money value={c.spent} /></td>
                      <td><Money value={c.returned} /></td>
                      <td className="font-semibold"><Money value={c.actual} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
        <Section title="حركة نقد المنشأة في الفترة" description="خروج: مصروفات مباشرة وتمويل عهد وسلف وتعويضات؛ دخول: مرتجعات وسداد">
          <ul className="space-y-1.5 text-sm">
            <li className="flex justify-between"><span>مصروفات مدفوعة مباشرة</span><Money value={cash.expensesPaidDirect} /></li>
            <li className="flex justify-between"><span>تسليم وتغذية العهد</span><Money value={cash.custodyFunding} /></li>
            <li className="flex justify-between"><span>مرتجعات العهد</span><Money value={-cash.custodyReturns} signed /></li>
            <li className="flex justify-between"><span>سلف مدفوعة</span><Money value={cash.advancesPaid} /></li>
            <li className="flex justify-between"><span>تعويضات وسداد للأشخاص</span><Money value={cash.settlementsPaid} /></li>
            <li className="flex justify-between"><span>سداد مستلم من الأشخاص</span><Money value={-cash.settlementsReceived} signed /></li>
            <li className="flex justify-between border-t border-border pt-1.5 font-semibold"><span>الصافي</span><Money value={cash.netOutflow} /></li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
