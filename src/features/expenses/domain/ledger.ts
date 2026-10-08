/**
 * Balances from records — the one place that decides what a record does.
 *
 * Every approved record becomes effects:
 * - debt:    `debtor` owes `creditor` (obligations between people and/or ORG);
 * - custody: a custody's balance changes (the organization's money a holder keeps);
 * - orgCash: the organization's cash moves.
 *
 * Three balances per person stay apart: what others owe them (entitlements),
 * what they owe (liabilities), and the custody they hold. Debts are netted per
 * pair only (A owes B 50, B owes A 20 → A owes B 30); a person's
 * entitlements and liabilities with different parties are never offset.
 *
 * Only `approved` records count. `submitted` records are pending: they are
 * reported apart, and pending spending from a custody lowers its *expected*
 * balance (never its actual balance), so the same money is not spent twice.
 */
import { ORG } from './types';
import type {
  Advance,
  AnyTxn,
  Custody,
  CustodyMove,
  Expense,
  ExpensesData,
  PartyId,
  Settlement,
} from './types';
import type { Minor } from './money';

export type EffectRef = { kind: AnyTxn['kind']; id: string; date: string };

export type Effect =
  | { type: 'debt'; debtor: PartyId; creditor: PartyId; amount: Minor; ref: EffectRef }
  | { type: 'custody'; custodyId: string; amount: Minor; ref: EffectRef }
  | { type: 'orgCash'; amount: Minor; ref: EffectRef };

const refOf = (t: AnyTxn): EffectRef => ({ kind: t.kind, id: t.id, date: t.date });

/**
 * Who paid minus who bears, matched into debts. Custody and organization
 * payments are the organization's money. Creditors and debtors are matched
 * greedily in a fixed order (the organization first, then parties in the order
 * they appear in payments and shares), so the result is exact in minor units
 * and the same every time. With one payer this is simply: every other bearer
 * owes the payer their share.
 */
export function expenseEffects(expense: Expense): Effect[] {
  const ref = refOf(expense);
  const effects: Effect[] = [];
  const order: PartyId[] = [];
  const net = new Map<PartyId, Minor>();
  const touch = (party: PartyId, delta: Minor) => {
    if (!net.has(party)) order.push(party);
    net.set(party, (net.get(party) ?? 0) + delta);
  };

  for (const part of expense.payments) {
    if (part.amount <= 0) continue;
    if (part.source === 'org') {
      effects.push({ type: 'orgCash', amount: -part.amount, ref });
      touch(ORG, part.amount);
    } else if (part.source === 'custody' && part.custodyId) {
      effects.push({ type: 'custody', custodyId: part.custodyId, amount: -part.amount, ref });
      touch(ORG, part.amount);
    } else if (part.source === 'personal' && part.payerId) {
      touch(part.payerId, part.amount);
    }
  }
  for (const share of expense.bearing.shares) {
    if (share.amount > 0) touch(share.partyId, -share.amount);
  }

  const sorted = [...order].sort((a, b) => (a === ORG ? -1 : b === ORG ? 1 : 0));
  const creditors = sorted.filter((p) => (net.get(p) ?? 0) > 0).map((p) => ({ p, left: net.get(p)! }));
  const debtors = sorted.filter((p) => (net.get(p) ?? 0) < 0).map((p) => ({ p, left: -net.get(p)! }));
  let c = 0;
  for (const debtor of debtors) {
    while (debtor.left > 0 && c < creditors.length) {
      const creditor = creditors[c]!;
      const amount = Math.min(debtor.left, creditor.left);
      effects.push({ type: 'debt', debtor: debtor.p, creditor: creditor.p, amount, ref });
      debtor.left -= amount;
      creditor.left -= amount;
      if (creditor.left === 0) c += 1;
    }
  }
  return effects;
}

/** issue / topup: the organization's cash goes to the custody; return: back. */
export function custodyMoveEffects(move: CustodyMove): Effect[] {
  const ref = refOf(move);
  const sign = move.type === 'return' ? -1 : 1;
  return [
    { type: 'custody', custodyId: move.custodyId, amount: sign * move.amount, ref },
    { type: 'orgCash', amount: -sign * move.amount, ref },
  ];
}

/** A personal advance: the organization pays, the person owes it. */
export function advanceEffects(advance: Advance): Effect[] {
  const ref = refOf(advance);
  return [
    { type: 'orgCash', amount: -advance.amount, ref },
    { type: 'debt', debtor: advance.personId, creditor: ORG, amount: advance.amount, ref },
  ];
}

/**
 * `from` pays `to`: offsets what `from` owed `to` (recorded as `to` owing
 * `from`, which nets the pair). Organization cash moves when it is a side.
 */
export function settlementEffects(settlement: Settlement): Effect[] {
  const ref = refOf(settlement);
  const effects: Effect[] = [
    { type: 'debt', debtor: settlement.toId, creditor: settlement.fromId, amount: settlement.amount, ref },
  ];
  if (settlement.fromId === ORG) effects.push({ type: 'orgCash', amount: -settlement.amount, ref });
  if (settlement.toId === ORG) effects.push({ type: 'orgCash', amount: settlement.amount, ref });
  return effects;
}

export function effectsOf(txn: AnyTxn): Effect[] {
  switch (txn.kind) {
    case 'expense':
      return expenseEffects(txn);
    case 'custody_move':
      return custodyMoveEffects(txn);
    case 'advance':
      return advanceEffects(txn);
    case 'settlement':
      return settlementEffects(txn);
  }
}

/** All records, oldest first (date, then creation time). */
export function allTxns(data: ExpensesData): AnyTxn[] {
  return [...data.expenses, ...data.custodyMoves, ...data.advances, ...data.settlements].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  );
}

export type PairBalance = {
  counterparty: PartyId;
  /** > 0: this party owes the counterparty; < 0: the counterparty owes it. */
  net: Minor;
};

export type CustodyBalance = {
  custody: Custody;
  issued: Minor;
  toppedUp: Minor;
  spent: Minor;
  returned: Minor;
  /** Approved records only. */
  actual: Minor;
  /** Submitted (not yet approved) spending and returns from this custody. */
  pendingOut: Minor;
  /** actual − pendingOut: what is really still available to spend. */
  expected: Minor;
};

export type PartyBalance = {
  partyId: PartyId;
  /** Others owe this party (sum over counterparties, pair-netted). */
  entitlements: Minor;
  /** This party owes others. */
  liabilities: Minor;
  pairs: PairBalance[];
  /** Custodies held (participants only). */
  custodyActual: Minor;
  custodyExpected: Minor;
};

export type Ledger = {
  currency: string;
  parties: Map<PartyId, PartyBalance>;
  custodies: Map<string, CustodyBalance>;
  orgCash: Minor;
  pending: { count: number; amount: Minor };
};

const pairKey = (a: PartyId, b: PartyId) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** Balances in one currency (records in another currency are left out). */
export function computeLedger(data: ExpensesData, currency: string): Ledger {
  const inCurrency = (t: { currency: string }) => t.currency === currency;
  const pairNet = new Map<string, Minor>(); // key a|b (a<b): > 0 → a owes b
  const custodies = new Map<string, CustodyBalance>();
  for (const custody of data.custodies.filter(inCurrency)) {
    custodies.set(custody.id, {
      custody,
      issued: 0,
      toppedUp: 0,
      spent: 0,
      returned: 0,
      actual: 0,
      pendingOut: 0,
      expected: 0,
    });
  }
  let orgCash = 0;
  const pending = { count: 0, amount: 0 };

  for (const txn of allTxns(data)) {
    if (!inCurrency(txn)) continue;
    if (txn.status === 'submitted') {
      pending.count += 1;
      pending.amount += txn.amount;
      for (const effect of effectsOf(txn)) {
        if (effect.type === 'custody' && effect.amount < 0) {
          const balance = custodies.get(effect.custodyId);
          if (balance) balance.pendingOut += -effect.amount;
        }
      }
      continue;
    }
    if (txn.status !== 'approved') continue;

    if (txn.kind === 'custody_move') {
      const balance = custodies.get(txn.custodyId);
      if (balance) {
        if (txn.type === 'issue') balance.issued += txn.amount;
        else if (txn.type === 'topup') balance.toppedUp += txn.amount;
        else balance.returned += txn.amount;
      }
    }
    for (const effect of effectsOf(txn)) {
      if (effect.type === 'orgCash') orgCash += effect.amount;
      else if (effect.type === 'custody') {
        const balance = custodies.get(effect.custodyId);
        if (balance) {
          balance.actual += effect.amount;
          if (txn.kind === 'expense') balance.spent += -effect.amount;
        }
      } else if (effect.debtor !== effect.creditor) {
        const key = pairKey(effect.debtor, effect.creditor);
        const sign = effect.debtor < effect.creditor ? 1 : -1;
        pairNet.set(key, (pairNet.get(key) ?? 0) + sign * effect.amount);
      }
    }
  }
  for (const balance of custodies.values()) balance.expected = balance.actual - balance.pendingOut;

  const parties = new Map<PartyId, PartyBalance>();
  const party = (id: PartyId): PartyBalance => {
    let p = parties.get(id);
    if (!p) {
      p = { partyId: id, entitlements: 0, liabilities: 0, pairs: [], custodyActual: 0, custodyExpected: 0 };
      parties.set(id, p);
    }
    return p;
  };
  for (const [key, net] of pairNet) {
    if (net === 0) continue;
    const [a, b] = key.split('|') as [PartyId, PartyId];
    const pa = party(a);
    const pb = party(b);
    pa.pairs.push({ counterparty: b, net });
    pb.pairs.push({ counterparty: a, net: -net });
    if (net > 0) {
      pa.liabilities += net;
      pb.entitlements += net;
    } else {
      pa.entitlements += -net;
      pb.liabilities += -net;
    }
  }
  for (const balance of custodies.values()) {
    const holder = party(balance.custody.holderId);
    holder.custodyActual += balance.actual;
    holder.custodyExpected += balance.expected;
  }
  return { currency, parties, custodies, orgCash, pending };
}

export function partyBalance(ledger: Ledger, partyId: PartyId): PartyBalance {
  return (
    ledger.parties.get(partyId) ?? {
      partyId,
      entitlements: 0,
      liabilities: 0,
      pairs: [],
      custodyActual: 0,
      custodyExpected: 0,
    }
  );
}

export type StatementLine = {
  txn: AnyTxn;
  /** Increases what others owe this party (or decreases what it owes). */
  credit: Minor;
  /** Increases what this party owes (or decreases what it is owed). */
  debit: Minor;
  /** Change of custody held by this party. */
  custody: Minor;
  /** Running net (credit − debit) and custody after this line (approved only). */
  balance: Minor;
  custodyBalance: Minor;
  pending: boolean;
};

/**
 * A party's account statement (كشف حساب): every record that changes what it
 * is owed, owes or holds, oldest first, with running balances. Pending
 * records are listed (flagged) without moving the running balances.
 */
export function statement(data: ExpensesData, partyId: PartyId, currency: string): StatementLine[] {
  const holderOf = new Map(data.custodies.map((c) => [c.id, c.holderId]));
  const lines: StatementLine[] = [];
  let balance = 0;
  let custodyBalance = 0;
  for (const txn of allTxns(data)) {
    if (txn.currency !== currency) continue;
    if (txn.status !== 'approved' && txn.status !== 'submitted') continue;
    let credit = 0;
    let debit = 0;
    let custody = 0;
    for (const effect of effectsOf(txn)) {
      if (effect.type === 'debt' && effect.debtor !== effect.creditor) {
        if (effect.creditor === partyId) credit += effect.amount;
        if (effect.debtor === partyId) debit += effect.amount;
      } else if (effect.type === 'custody' && holderOf.get(effect.custodyId) === partyId) {
        custody += effect.amount;
      }
    }
    if (credit === 0 && debit === 0 && custody === 0) continue;
    const pending = txn.status === 'submitted';
    if (!pending) {
      balance += credit - debit;
      custodyBalance += custody;
    }
    lines.push({ txn, credit, debit, custody, balance, custodyBalance, pending });
  }
  return lines;
}

export type SettlementSuggestion = { fromId: PartyId; toId: PartyId; amount: Minor };

/**
 * One direct payment per pair that owes something (who owes pays whom they
 * owe). Re-routing debts between pairs (A→B→C becomes A→C) is deferred: it
 * would change who a person owes, which needs everyone's agreement.
 */
export function settlementSuggestions(ledger: Ledger): SettlementSuggestion[] {
  const out: SettlementSuggestion[] = [];
  for (const p of ledger.parties.values()) {
    for (const pair of p.pairs) {
      if (pair.net > 0) out.push({ fromId: p.partyId, toId: pair.counterparty, amount: pair.net });
    }
  }
  return out.sort((a, b) => b.amount - a.amount);
}

/** Currencies that appear in the records (the base currency first). */
export function currenciesInUse(data: ExpensesData, base: string): string[] {
  const set = new Set<string>([base]);
  for (const t of allTxns(data)) set.add(t.currency);
  return [...set];
}
