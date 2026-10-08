/**
 * Building and checking an expense: who bears it (split), who paid it
 * (payments, including custody shortfall), and the analytic allocation.
 */
import { splitByWeights, splitEqual, sumMinor, type Minor } from './money';
import { ORG } from './types';
import type { AllocationLine, Bearing, Expense, PartyId, PaymentPart, ShareLine, SplitMethod } from './types';

/**
 * Shares for a split method. `equal`: remainder units to the first parties in
 * the order given (see `splitEqual`). `percent`: largest remainder. `amounts`:
 * as entered (validated separately). `org`: the organization bears it all.
 */
export function buildBearing(
  method: SplitMethod,
  total: Minor,
  parties: readonly PartyId[],
  entered: Readonly<Record<string, number>> = {},
): Bearing {
  if (method === 'org' || parties.length === 0) {
    return { method: 'org', shares: [{ partyId: ORG, amount: total }] };
  }
  if (method === 'equal') {
    const parts = splitEqual(total, parties.length);
    return { method, shares: parties.map((partyId, i) => ({ partyId, amount: parts[i]! })) };
  }
  if (method === 'percent') {
    const weights = parties.map((p) => Number(entered[p] ?? 0));
    const parts = splitByWeights(total, weights);
    return {
      method,
      shares: parties.map((partyId, i) => ({ partyId, amount: parts[i]!, percent: weights[i] })),
    };
  }
  return {
    method,
    shares: parties.map((partyId) => ({ partyId, amount: Math.max(0, Math.round(Number(entered[partyId] ?? 0))) })),
  };
}

/**
 * Payments for a custody expense: up to what the custody can still spend
 * (`available`, its expected balance), the rest from the holder's own money —
 * reimbursable by whoever bears the cost. Covers spending when the custody has
 * run out.
 */
export function custodyPayments(
  total: Minor,
  custodyId: string,
  holderId: string,
  available: Minor,
): PaymentPart[] {
  const fromCustody = Math.max(0, Math.min(total, available));
  const parts: PaymentPart[] = [];
  if (fromCustody > 0) parts.push({ source: 'custody', custodyId, payerId: holderId, amount: fromCustody });
  if (total - fromCustody > 0) {
    parts.push({ source: 'personal', payerId: holderId, amount: total - fromCustody });
  }
  return parts;
}

export function singleAllocation(
  total: Minor,
  costCenterId: string | null | undefined,
  groupId: string | null | undefined,
): AllocationLine[] {
  return [{ costCenterId: costCenterId ?? null, groupId: groupId ?? null, amount: total }];
}

export type ExpenseIssue = { field: string; message: string };

/** Structural checks: amounts add up, parties exist. Policies are separate. */
export function validateExpense(
  expense: Pick<Expense, 'amount' | 'description' | 'categoryId' | 'payments' | 'bearing' | 'allocation'>,
): ExpenseIssue[] {
  const issues: ExpenseIssue[] = [];
  if (!(expense.amount > 0)) issues.push({ field: 'amount', message: 'أدخل مبلغاً أكبر من صفر' });
  if (!expense.description.trim()) issues.push({ field: 'description', message: 'أدخل وصفاً للمصروف' });
  if (!expense.categoryId) issues.push({ field: 'categoryId', message: 'اختر الفئة' });
  const paid = sumMinor(expense.payments.map((p) => p.amount));
  if (paid !== expense.amount) {
    issues.push({ field: 'payments', message: 'مجموع الدفعات لا يساوي مبلغ المصروف' });
  }
  for (const p of expense.payments) {
    if (p.source === 'personal' && !p.payerId) issues.push({ field: 'payments', message: 'اختر من دفع من ماله' });
    if (p.source === 'custody' && !p.custodyId) issues.push({ field: 'payments', message: 'اختر العهدة' });
  }
  const borne = sumMinor(expense.bearing.shares.map((s: ShareLine) => s.amount));
  if (borne !== expense.amount) {
    issues.push({
      field: 'bearing',
      message: `مجموع حصص التحميل (${borne}) لا يساوي مبلغ المصروف (${expense.amount}) بأصغر وحدة`,
    });
  }
  if (expense.bearing.method === 'percent') {
    const pct = expense.bearing.shares.reduce((t, s) => t + (s.percent ?? 0), 0);
    if (Math.abs(pct - 100) > 0.0001) issues.push({ field: 'bearing', message: 'مجموع النسب يجب أن يكون 100%' });
  }
  const allocated = sumMinor(expense.allocation.map((a) => a.amount));
  if (allocated !== expense.amount) {
    issues.push({ field: 'allocation', message: 'مجموع توزيع التكلفة لا يساوي مبلغ المصروف' });
  }
  return issues;
}
