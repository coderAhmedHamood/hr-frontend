'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { involves } from '../domain/reports';
import { STATUS_LABELS_AR } from '../domain/policy';
import type { Expense, ExpensesData, TxnStatus } from '../domain/types';
import { expensesRoutes } from '../constants/routes';
import { EmptyState, LoadingBlock, Money, PartyName, ResponsiveTable, StatusBadge } from './common';
import { ExpenseFormDialog } from './expense-form-dialog';
import { useCurrency, useDirectory, useExpensesData, useExpensesPermissions } from './expenses-provider';

export type ListFilters = {
  q: string;
  status: TxnStatus | 'all';
  categoryId: string;
  groupId: string;
  personId: string;
  from: string;
  to: string;
};

export const EMPTY_FILTERS: ListFilters = { q: '', status: 'all', categoryId: 'all', groupId: 'all', personId: 'all', from: '', to: '' };

export function activeFilterCount(f: ListFilters): number {
  return (Object.keys(EMPTY_FILTERS) as Array<keyof ListFilters>).filter((k) => f[k] !== EMPTY_FILTERS[k]).length;
}

function applyFilters(rows: Expense[], f: ListFilters): Expense[] {
  const q = f.q.trim();
  return rows.filter(
    (e) =>
      (f.status === 'all' || e.status === f.status) &&
      (f.categoryId === 'all' || e.categoryId === f.categoryId) &&
      (f.groupId === 'all' || e.groupId === f.groupId || e.allocation.some((a) => a.groupId === f.groupId)) &&
      (f.personId === 'all' || involves(e, f.personId)) &&
      (!f.from || e.date >= f.from) &&
      (!f.to || e.date <= f.to) &&
      (!q || e.description.includes(q) || (e.note ?? '').includes(q)),
  );
}

export function FiltersPanel({ data, value, onChange, hideStatus }: { data: ExpensesData; value: ListFilters; onChange: (f: ListFilters) => void; hideStatus?: boolean }) {
  const directory = useDirectory();
  const set = <K extends keyof ListFilters>(k: K, v: ListFilters[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
        <Input className="h-10 ps-9" placeholder="بحث في الوصف والملاحظات" value={value.q} onChange={(e) => set('q', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:col-span-2">
        <Input type="date" className="h-10" aria-label="من تاريخ" value={value.from} onChange={(e) => set('from', e.target.value)} />
        <Input type="date" className="h-10" aria-label="إلى تاريخ" value={value.to} onChange={(e) => set('to', e.target.value)} />
      </div>
      {hideStatus ? null : (
        <Select value={value.status} onValueChange={(v) => set('status', v as ListFilters['status'])}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            {(Object.keys(STATUS_LABELS_AR) as TxnStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS_AR[s]}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={value.categoryId} onValueChange={(v) => set('categoryId', v)}>
        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الفئات</SelectItem>
          {data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.groupId} onValueChange={(v) => set('groupId', v)}>
        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل المجموعات</SelectItem>
          {data.groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={value.personId} onValueChange={(v) => set('personId', v)}>
        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">كل الأشخاص</SelectItem>
          {directory.choices.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {activeFilterCount(value) > 0 ? (
        <Button variant="ghost" className="h-10" onClick={() => onChange(EMPTY_FILTERS)}>مسح الفلاتر</Button>
      ) : null}
    </div>
  );
}

export function ExpensesListPage() {
  const data = useExpensesData();
  const currency = useCurrency();
  const directory = useDirectory();
  const perms = useExpensesPermissions();
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [filters, setFilters] = React.useState<ListFilters>(EMPTY_FILTERS);
  const count = activeFilterCount(filters);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-1.5">
        <FilterToggleButton activeFilterCount={count} />
        <PageHeaderPrimaryButton icon={Plus} label="مصروف جديد" disabled={!perms.create} onClick={() => setAdding(true)}>
          مصروف جديد
        </PageHeaderPrimaryButton>
      </div>
    ),
    [count, perms.create],
  );
  useEntityFilterSlot(() => (data ? <FiltersPanel data={data} value={filters} onChange={setFilters} /> : null), [filters, data?.categories, data?.groups, directory.choices]);

  if (!data) return <LoadingBlock />;
  const rows = applyFilters(data.expenses.filter((e) => e.currency === currency.code), filters).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const total = rows.filter((e) => e.status === 'approved').reduce((t, e) => t + e.amount, 0);
  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? '—';
  const payLabel = (e: Expense) => e.payments.map((p) => (p.source === 'org' ? 'المنشأة' : p.source === 'custody' ? 'عهدة' : 'شخصي')).join(' + ');

  return (
    <div className="space-y-3">
      <SetPageTitle titleAr="المصروفات" descriptionAr="كل المصروفات وحالاتها" iconName="Receipt" />
      <p className="text-xs text-muted-foreground">
        {rows.length} مصروف · المعتمد منها <Money value={total} className="font-semibold text-foreground" />
      </p>
      {rows.length === 0 ? (
        <EmptyState text={count > 0 ? 'لا نتائج لهذه الفلاتر' : 'لا مصروفات بعد'} action={perms.create ? <Button size="sm" onClick={() => setAdding(true)}>مصروف جديد</Button> : undefined} />
      ) : (
        <ResponsiveTable
          rows={rows}
          rowKey={(e) => e.id}
          onRowClick={(e) => router.push(expensesRoutes.expenseDetail(e.id))}
          card={(e) => (
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm font-medium">{e.description}</p>
                <Money value={e.amount} className="shrink-0 text-sm font-semibold" />
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>{e.date}</span><span>·</span><span>{catName(e.categoryId)}</span><span>·</span><span>{payLabel(e)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">{directory.nameOf(e.createdBy)}</span>
                <StatusBadge status={e.status} />
              </div>
            </div>
          )}
          columns={[
            { header: 'التاريخ', cell: (e) => <span className="tabular-nums text-muted-foreground">{e.date}</span> },
            { header: 'الوصف', cell: (e) => <span className="font-medium">{e.description}</span> },
            { header: 'الفئة', cell: (e) => catName(e.categoryId) },
            { header: 'الدفع', cell: (e) => payLabel(e) },
            { header: 'التحميل', cell: (e) => (e.bearing.method === 'org' ? 'المنشأة' : `${e.bearing.shares.length} أطراف`) },
            { header: 'سجّله', cell: (e) => <PartyName id={e.createdBy} link={false} /> },
            { header: 'المبلغ', cell: (e) => <Money value={e.amount} className="font-semibold" /> },
            { header: 'الحالة', cell: (e) => <StatusBadge status={e.status} /> },
          ]}
        />
      )}
      <ExpenseFormDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
