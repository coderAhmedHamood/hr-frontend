/**
 * Reports. An expense is counted once, by its own amount (or the part of its
 * allocation that matches a cost center / group filter). Handing over,
 * refilling or returning a custody is a transfer of the organization's money,
 * not an expense: it appears in the custody and cash reports only, so paying
 * from a custody is never counted twice.
 */
import { effectsOf } from './ledger';
import type { Minor } from './money';
import { ORG } from './types';
import type { Expense, ExpensesData, PartyId } from './types';

export type Period = 'day' | 'week' | 'month';

export type ReportFilter = {
  currency: string;
  from?: string | null;
  to?: string | null;
  participantIds?: string[];
  groupIds?: string[];
  categoryIds?: string[];
  costCenterIds?: string[];
  /** Also count submitted (not yet approved) expenses. */
  includePending?: boolean;
};

const DAY_MS = 86_400_000;

/** Week starts on Saturday (as in Yemen and the Gulf). */
export function weekStart(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const back = (d.getUTCDay() + 1) % 7; // Sat → 0, Sun → 1, … Fri → 6
  return new Date(d.getTime() - back * DAY_MS).toISOString().slice(0, 10);
}

export function bucketOf(date: string, period: Period): string {
  if (period === 'day') return date;
  if (period === 'week') return weekStart(date);
  return date.slice(0, 7);
}

/** A participant takes part in an expense as creator, payer or bearer. */
export function involves(expense: Expense, participantId: string): boolean {
  return (
    expense.createdBy === participantId ||
    expense.payments.some((p) => p.payerId === participantId) ||
    expense.bearing.shares.some((s) => s.partyId === participantId)
  );
}

function lineMatches(expense: Expense, line: Expense['allocation'][number], filter: ReportFilter): boolean {
  const cc = filter.costCenterIds?.length ? filter.costCenterIds : null;
  const gr = filter.groupIds?.length ? filter.groupIds : null;
  const group = line.groupId ?? expense.groupId ?? null;
  const center = line.costCenterId ?? expense.costCenterId ?? null;
  return (!cc || (center !== null && cc.includes(center))) && (!gr || (group !== null && gr.includes(group)));
}

/** The part of the expense the filter covers (all of it without cost center / group filters). */
export function countedAmount(expense: Expense, filter: ReportFilter): Minor {
  if (!filter.costCenterIds?.length && !filter.groupIds?.length) return expense.amount;
  return expense.allocation
    .filter((line) => lineMatches(expense, line, filter))
    .reduce((t, line) => t + line.amount, 0);
}

export function filterExpenses(data: ExpensesData, filter: ReportFilter): Expense[] {
  const statuses = new Set(filter.includePending ? ['approved', 'submitted'] : ['approved']);
  const people = filter.participantIds?.length ? filter.participantIds : null;
  const categories = filter.categoryIds?.length ? new Set(filter.categoryIds) : null;
  return data.expenses.filter(
    (e) =>
      e.currency === filter.currency &&
      statuses.has(e.status) &&
      (!filter.from || e.date >= filter.from) &&
      (!filter.to || e.date <= filter.to) &&
      (!categories || categories.has(e.categoryId)) &&
      (!people || people.some((p) => involves(e, p))) &&
      countedAmount(e, filter) > 0,
  );
}

export type Row = { key: string; amount: Minor; count: number };

function addTo(map: Map<string, Row>, key: string, amount: Minor) {
  const row = map.get(key) ?? { key, amount: 0, count: 0 };
  row.amount += amount;
  row.count += 1;
  map.set(key, row);
}

const sorted = (map: Map<string, Row>) => [...map.values()].sort((a, b) => b.amount - a.amount);

export type ExpenseReport = {
  total: Minor;
  count: number;
  series: Row[];
  byCategory: Row[];
  byGroup: Row[];
  byCostCenter: Row[];
  /** Who bears the cost (ORG or a participant). */
  byBearer: Row[];
  /** org / custody / personal. */
  byPaymentSource: Row[];
  /** Who recorded it. */
  byCreator: Row[];
  /** Submitted, not approved — reported apart (not in `total` unless includePending). */
  pendingTotal: Minor;
  pendingCount: number;
};

export function expenseReport(data: ExpensesData, filter: ReportFilter, period: Period): ExpenseReport {
  const rows = filterExpenses(data, filter);
  const series = new Map<string, Row>();
  const byCategory = new Map<string, Row>();
  const byGroup = new Map<string, Row>();
  const byCostCenter = new Map<string, Row>();
  const byBearer = new Map<string, Row>();
  const byPaymentSource = new Map<string, Row>();
  const byCreator = new Map<string, Row>();
  let total = 0;
  for (const e of rows) {
    const amount = countedAmount(e, filter);
    const ratio = amount / e.amount;
    total += amount;
    addTo(series, bucketOf(e.date, period), amount);
    addTo(byCategory, e.categoryId, amount);
    addTo(byCreator, e.createdBy, amount);
    for (const line of e.allocation) {
      if (!lineMatches(e, line, filter)) continue;
      addTo(byGroup, line.groupId ?? e.groupId ?? '—', line.amount);
      addTo(byCostCenter, line.costCenterId ?? e.costCenterId ?? '—', line.amount);
    }
    for (const share of e.bearing.shares) addTo(byBearer, share.partyId, Math.round(share.amount * ratio));
    for (const part of e.payments) addTo(byPaymentSource, part.source, Math.round(part.amount * ratio));
  }
  const pending = filter.includePending
    ? []
    : filterExpenses(data, { ...filter, includePending: true }).filter((e) => e.status === 'submitted');
  return {
    total,
    count: rows.length,
    series: [...series.values()].sort((a, b) => a.key.localeCompare(b.key)),
    byCategory: sorted(byCategory),
    byGroup: sorted(byGroup),
    byCostCenter: sorted(byCostCenter),
    byBearer: sorted(byBearer),
    byPaymentSource: sorted(byPaymentSource),
    byCreator: sorted(byCreator),
    pendingTotal: pending.reduce((t, e) => t + countedAmount(e, filter), 0),
    pendingCount: pending.length,
  };
}

export type CashReport = {
  /** Expenses paid from the organization's cash (not from custodies). */
  expensesPaidDirect: Minor;
  /** Custodies handed over and refilled. */
  custodyFunding: Minor;
  custodyReturns: Minor;
  advancesPaid: Minor;
  settlementsPaid: Minor;
  settlementsReceived: Minor;
  /** Cash out − cash in. */
  netOutflow: Minor;
};

/** The organization's cash movements in the period (approved records). */
export function cashReport(data: ExpensesData, filter: Pick<ReportFilter, 'currency' | 'from' | 'to'>): CashReport {
  const r: CashReport = {
    expensesPaidDirect: 0,
    custodyFunding: 0,
    custodyReturns: 0,
    advancesPaid: 0,
    settlementsPaid: 0,
    settlementsReceived: 0,
    netOutflow: 0,
  };
  const all = [...data.expenses, ...data.custodyMoves, ...data.advances, ...data.settlements];
  for (const t of all) {
    if (t.status !== 'approved' || t.currency !== filter.currency) continue;
    if ((filter.from && t.date < filter.from) || (filter.to && t.date > filter.to)) continue;
    for (const effect of effectsOf(t)) {
      if (effect.type !== 'orgCash') continue;
      r.netOutflow -= effect.amount;
      if (t.kind === 'expense') r.expensesPaidDirect += -effect.amount;
      else if (t.kind === 'custody_move') {
        if (effect.amount < 0) r.custodyFunding += -effect.amount;
        else r.custodyReturns += effect.amount;
      } else if (t.kind === 'advance') r.advancesPaid += -effect.amount;
      else if (effect.amount < 0) r.settlementsPaid += -effect.amount;
      else r.settlementsReceived += effect.amount;
    }
  }
  return r;
}

/** CSV (UTF-8 with BOM for Excel) of the filtered expenses. */
export function expensesCsv(
  rows: readonly Expense[],
  names: { category: (id: string) => string; party: (id: PartyId) => string; money: (minor: Minor) => string },
): string {
  const head = ['التاريخ', 'الوصف', 'الفئة', 'المبلغ', 'الحالة', 'سجّله', 'مصدر الدفع', 'التحميل'];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = rows.map((e) =>
    [
      e.date,
      e.description,
      names.category(e.categoryId),
      names.money(e.amount),
      e.status,
      names.party(e.createdBy),
      e.payments.map((p) => (p.source === 'org' ? 'المنشأة' : p.source === 'custody' ? 'عهدة' : `شخصي: ${names.party(p.payerId ?? '')}`)).join(' + '),
      e.bearing.shares.map((s) => `${s.partyId === ORG ? 'المنشأة' : names.party(s.partyId)}: ${names.money(s.amount)}`).join('، '),
    ]
      .map(esc)
      .join(','),
  );
  return `﻿${[head.map(esc).join(','), ...lines].join('\n')}`;
}
