/**
 * Operations on the data, as pure functions (data in → new data out). The
 * store calls them and persists the result; tests call them directly. A future
 * backend implements the same operations on the server (with permissions
 * checked there, not in screens).
 */
import { computeLedger } from './ledger';
import { canDecide, canVoid, statusOnSubmit } from './policy';
import { ORG } from './types';
import type {
  Advance,
  AnyTxn,
  Category,
  CostCenter,
  Custody,
  CustodyMove,
  CustodyMoveType,
  Expense,
  ExpenseGroup,
  ExpensesData,
  ExpensesSettings,
  PartyId,
  Settlement,
} from './types';
import type { Minor } from './money';

export type Ctx = {
  actorId: string;
  currency: string;
  now: string;
  newId: (prefix: string) => string;
};

export class CommandError extends Error {}

type Collection = 'expenses' | 'custodyMoves' | 'advances' | 'settlements';
const COLLECTION: Record<AnyTxn['kind'], Collection> = {
  expense: 'expenses',
  custody_move: 'custodyMoves',
  advance: 'advances',
  settlement: 'settlements',
};

export function findTxn(data: ExpensesData, kind: AnyTxn['kind'], id: string): AnyTxn | undefined {
  return (data[COLLECTION[kind]] as AnyTxn[]).find((t) => t.id === id);
}

function replaceTxn(data: ExpensesData, txn: AnyTxn): ExpensesData {
  const key = COLLECTION[txn.kind];
  const list = data[key] as AnyTxn[];
  const exists = list.some((t) => t.id === txn.id);
  return { ...data, [key]: exists ? list.map((t) => (t.id === txn.id ? txn : t)) : [...list, txn] };
}

/** Status and decision fields when a record is submitted (auto-approval included). */
function submitted(amount: Minor, settings: ExpensesSettings, ctx: Ctx) {
  const status = statusOnSubmit(amount, settings);
  return {
    status,
    submittedAt: ctx.now,
    decidedBy: status === 'approved' ? 'auto' : null,
    decidedAt: status === 'approved' ? ctx.now : null,
    decisionNote: status === 'approved' && settings.requireApproval ? 'اعتماد تلقائي (تحت الحد)' : null,
  } as const;
}

export type ExpenseDraft = Omit<
  Expense,
  | 'id'
  | 'kind'
  | 'currency'
  | 'status'
  | 'createdBy'
  | 'createdAt'
  | 'submittedAt'
  | 'decidedBy'
  | 'decidedAt'
  | 'decisionNote'
  | 'voidedBy'
  | 'voidedAt'
  | 'voidReason'
> & { id?: string | null };

/** Creates or edits (draft / rejected only) an expense; `submit` sends it for approval. */
export function saveExpense(data: ExpensesData, draft: ExpenseDraft, submit: boolean, ctx: Ctx) {
  const existing = draft.id ? (findTxn(data, 'expense', draft.id) as Expense | undefined) : undefined;
  if (existing && existing.status !== 'draft' && existing.status !== 'rejected') {
    throw new CommandError('لا يُعدَّل إلا المسودة أو المرفوض');
  }
  const base = {
    ...draft,
    id: existing?.id ?? ctx.newId('exp'),
    kind: 'expense' as const,
    currency: existing?.currency ?? ctx.currency,
    createdBy: existing?.createdBy ?? ctx.actorId,
    createdAt: existing?.createdAt ?? ctx.now,
    voidedBy: null,
    voidedAt: null,
    voidReason: null,
  };
  const expense: Expense = submit
    ? { ...base, ...submitted(draft.amount, data.settings, ctx) }
    : { ...base, status: 'draft', submittedAt: null, decidedBy: null, decidedAt: null, decisionNote: null };
  return { data: replaceTxn(data, expense), expense };
}

export function submitTxn(data: ExpensesData, kind: AnyTxn['kind'], id: string, ctx: Ctx): ExpensesData {
  const txn = findTxn(data, kind, id);
  if (!txn) throw new CommandError('العملية غير موجودة');
  if (txn.status !== 'draft' && txn.status !== 'rejected') throw new CommandError('أُرسلت مسبقاً');
  return replaceTxn(data, { ...txn, ...submitted(txn.amount, data.settings, ctx) } as AnyTxn);
}

export function decideTxn(
  data: ExpensesData,
  kind: AnyTxn['kind'],
  id: string,
  decision: 'approved' | 'rejected',
  note: string | null,
  ctx: Ctx,
): ExpensesData {
  const txn = findTxn(data, kind, id);
  if (!txn) throw new CommandError('العملية غير موجودة');
  if (!canDecide(ctx.actorId, txn, data.settings)) {
    throw new CommandError('لا تملك اعتماد هذه العملية (لست معتمِداً أو أنت من سجّلها)');
  }
  if (decision === 'approved' && txn.kind === 'custody_move' && txn.type === 'return') {
    const balance = computeLedger(data, txn.currency).custodies.get(txn.custodyId);
    if (balance && txn.amount > balance.actual) throw new CommandError('المرتجع أكبر من رصيد العهدة');
  }
  return replaceTxn(data, { ...txn, status: decision, decidedBy: ctx.actorId, decidedAt: ctx.now, decisionNote: note } as AnyTxn);
}

/** Void keeps the record (and its history) but takes it out of balances and reports. */
export function voidTxn(data: ExpensesData, kind: AnyTxn['kind'], id: string, reason: string, ctx: Ctx): ExpensesData {
  const txn = findTxn(data, kind, id);
  if (!txn) throw new CommandError('العملية غير موجودة');
  if (!canVoid(txn)) throw new CommandError('لا يمكن إلغاء هذه العملية');
  if (!reason.trim()) throw new CommandError('اكتب سبب الإلغاء');
  if (txn.kind === 'custody_move' && txn.status === 'approved' && txn.type !== 'return') {
    const balance = computeLedger(data, txn.currency).custodies.get(txn.custodyId);
    if (balance && balance.actual - txn.amount < 0) {
      throw new CommandError('إلغاء التسليم يجعل رصيد العهدة سالباً: ألغِ المصروفات منها أولاً');
    }
  }
  return replaceTxn(data, { ...txn, status: 'void', voidedBy: ctx.actorId, voidedAt: ctx.now, voidReason: reason } as AnyTxn);
}

function newMove(custodyId: string, type: CustodyMoveType, amount: Minor, date: string, note: string | null, data: ExpensesData, ctx: Ctx): CustodyMove {
  return {
    id: ctx.newId('mv'),
    kind: 'custody_move',
    custodyId,
    type,
    amount,
    date,
    note,
    currency: ctx.currency,
    createdBy: ctx.actorId,
    createdAt: ctx.now,
    ...submitted(amount, data.settings, ctx),
  };
}

/** Opens an operational custody and hands over its first amount. */
export function openCustody(
  data: ExpensesData,
  input: { holderId: string; purpose: string; limit: Minor | null; amount: Minor; date: string },
  ctx: Ctx,
) {
  if (!input.holderId) throw new CommandError('اختر حامل العهدة');
  if (!(input.amount > 0)) throw new CommandError('أدخل مبلغ التسليم');
  if (input.limit != null && input.amount > input.limit) throw new CommandError('مبلغ التسليم يتجاوز سقف العهدة');
  const custody: Custody = {
    id: ctx.newId('cus'),
    holderId: input.holderId,
    purpose: input.purpose.trim() || 'عهدة تشغيلية',
    currency: ctx.currency,
    limit: input.limit,
    status: 'open',
    openedAt: input.date,
    createdBy: ctx.actorId,
  };
  const move = newMove(custody.id, 'issue', input.amount, input.date, null, data, ctx);
  return { data: { ...data, custodies: [...data.custodies, custody], custodyMoves: [...data.custodyMoves, move] }, custody };
}

/** Refill or return (return cannot exceed what the custody can still spend). */
export function addCustodyMove(
  data: ExpensesData,
  input: { custodyId: string; type: Exclude<CustodyMoveType, 'issue'>; amount: Minor; date: string; note: string | null },
  ctx: Ctx,
): ExpensesData {
  const custody = data.custodies.find((c) => c.id === input.custodyId);
  if (!custody || custody.status !== 'open') throw new CommandError('العهدة غير مفتوحة');
  if (!(input.amount > 0)) throw new CommandError('أدخل المبلغ');
  const balance = computeLedger(data, custody.currency).custodies.get(custody.id);
  if (input.type === 'return' && balance && input.amount > balance.expected) {
    throw new CommandError('المرتجع أكبر من الرصيد المتاح للعهدة (بعد المعلق)');
  }
  if (input.type === 'topup' && custody.limit != null && balance && balance.actual + input.amount > custody.limit) {
    throw new CommandError('التغذية تتجاوز سقف العهدة');
  }
  return { ...data, custodyMoves: [...data.custodyMoves, newMove(custody.id, input.type, input.amount, input.date, input.note, data, ctx)] };
}

/**
 * Closing (تسوية وإقفال): no pending spending may remain; what is left is
 * returned to the organization (approved, as part of the closing) and the
 * custody is closed.
 */
export function closeCustody(data: ExpensesData, custodyId: string, date: string, ctx: Ctx): ExpensesData {
  const custody = data.custodies.find((c) => c.id === custodyId);
  if (!custody || custody.status !== 'open') throw new CommandError('العهدة غير مفتوحة');
  const balance = computeLedger(data, custody.currency).custodies.get(custodyId);
  if (balance && balance.pendingOut > 0) throw new CommandError('توجد مصروفات معلقة من هذه العهدة: اعتمدها أو ارفضها أولاً');
  let next = data;
  if (balance && balance.actual > 0) {
    const move: CustodyMove = {
      ...newMove(custodyId, 'return', balance.actual, date, 'إرجاع الرصيد عند الإقفال', data, ctx),
      status: 'approved',
      decidedBy: ctx.actorId,
      decidedAt: ctx.now,
    };
    next = { ...next, custodyMoves: [...next.custodyMoves, move] };
  }
  return {
    ...next,
    custodies: next.custodies.map((c) => (c.id === custodyId ? { ...c, status: 'closed', closedAt: date } : c)),
  };
}

export function addAdvance(
  data: ExpensesData,
  input: { personId: string; amount: Minor; purpose: string; date: string },
  ctx: Ctx,
): ExpensesData {
  if (!input.personId) throw new CommandError('اختر الشخص');
  if (!(input.amount > 0)) throw new CommandError('أدخل مبلغ السلفة');
  const advance: Advance = {
    id: ctx.newId('adv'),
    kind: 'advance',
    personId: input.personId,
    amount: input.amount,
    purpose: input.purpose.trim() || 'سلفة شخصية',
    date: input.date,
    currency: ctx.currency,
    createdBy: ctx.actorId,
    createdAt: ctx.now,
    ...submitted(input.amount, data.settings, ctx),
  };
  return { ...data, advances: [...data.advances, advance] };
}

export function addSettlement(
  data: ExpensesData,
  input: { fromId: PartyId; toId: PartyId; amount: Minor; method: Settlement['method']; date: string; note: string | null },
  ctx: Ctx,
): ExpensesData {
  if (!input.fromId || !input.toId || input.fromId === input.toId) throw new CommandError('اختر طرفين مختلفين');
  if (!(input.amount > 0)) throw new CommandError('أدخل مبلغ السداد');
  const settlement: Settlement = {
    id: ctx.newId('set'),
    kind: 'settlement',
    fromId: input.fromId,
    toId: input.toId,
    amount: input.amount,
    method: input.method,
    date: input.date,
    note: input.note,
    currency: ctx.currency,
    createdBy: ctx.actorId,
    createdAt: ctx.now,
    ...submitted(input.amount, data.settings, ctx),
  };
  return { ...data, settlements: [...data.settlements, settlement] };
}

/** What `fromId` owes `toId` now (approved records), for settlement checks. */
export function owedBetween(data: ExpensesData, fromId: PartyId, toId: PartyId, currency: string): Minor {
  const party = computeLedger(data, currency).parties.get(fromId);
  const pair = party?.pairs.find((p) => p.counterparty === toId);
  return pair && pair.net > 0 ? pair.net : 0;
}

export function upsertCategory(data: ExpensesData, category: Category): ExpensesData {
  const exists = data.categories.some((c) => c.id === category.id);
  return { ...data, categories: exists ? data.categories.map((c) => (c.id === category.id ? category : c)) : [...data.categories, category] };
}

export function upsertCostCenter(data: ExpensesData, center: CostCenter): ExpensesData {
  const exists = data.costCenters.some((c) => c.id === center.id);
  return { ...data, costCenters: exists ? data.costCenters.map((c) => (c.id === center.id ? center : c)) : [...data.costCenters, center] };
}

export function upsertGroup(data: ExpensesData, group: ExpenseGroup): ExpensesData {
  const exists = data.groups.some((g) => g.id === group.id);
  return { ...data, groups: exists ? data.groups.map((g) => (g.id === group.id ? group : g)) : [...data.groups, group] };
}

export function updateSettings(data: ExpensesData, patch: Partial<ExpensesSettings>): ExpensesData {
  return { ...data, settings: { ...data.settings, ...patch } };
}

export const PARTY_ORG_LABEL = 'المنشأة';
export const isOrg = (id: PartyId) => id === ORG;
