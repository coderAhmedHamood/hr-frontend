/**
 * Operations the screens send to the server (`POST /expenses/commands`).
 * The server runs them with `domain/commands` and checks each one's `exp.*`
 * permission; amounts are integers in minor units.
 */
import type { ExpenseDraft } from '../domain/commands';
import type { AnyTxn, Category, CostCenter, ExpenseGroup, ExpensesSettings, PartyId, Settlement } from '../domain/types';
import type { Minor } from '../domain/money';

export type ExpensesCommand =
  | { type: 'saveExpense'; draft: ExpenseDraft; submit: boolean }
  | { type: 'submit'; kind: AnyTxn['kind']; id: string }
  | { type: 'decide'; kind: AnyTxn['kind']; id: string; decision: 'approved' | 'rejected'; note?: string | null }
  | { type: 'void'; kind: AnyTxn['kind']; id: string; reason: string }
  | { type: 'openCustody'; holderId: string; purpose: string; limit: Minor | null; amount: Minor; date: string }
  | { type: 'addCustodyMove'; custodyId: string; moveType: 'topup' | 'return'; amount: Minor; date: string; note: string | null }
  | { type: 'closeCustody'; custodyId: string; date: string }
  | { type: 'addAdvance'; personId: string; amount: Minor; purpose: string; date: string }
  | { type: 'addSettlement'; fromId: PartyId; toId: PartyId; amount: Minor; method: Settlement['method']; date: string; note: string | null }
  /** A new row is sent with an empty id; the server gives it one. */
  | { type: 'upsertCategory'; category: Category }
  | { type: 'upsertCostCenter'; center: CostCenter }
  | { type: 'upsertGroup'; group: ExpenseGroup }
  | { type: 'updateSettings'; patch: Partial<ExpensesSettings> };
