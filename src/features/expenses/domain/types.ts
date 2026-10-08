/**
 * Expenses & custody — domain records. Amounts are minor units (`Minor`), and
 * every record carries its currency (the company base currency when it was
 * written). Records are never deleted once they affect balances: they are
 * voided (`status: 'void'`) so statements and reports keep their history.
 */
import type { Minor } from './money';

/** The organization itself as a party of obligations and payments. */
export const ORG = 'org' as const;
export type PartyId = string; // a participant id, or ORG

export type TxnStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'void';

/**
 * Someone who can pay, bear a cost, hold a custody or settle: a company user,
 * an internal contact, or both (a contact linked to a user). A contact may have
 * no user account.
 */
export interface Participant {
  id: string;
  name: string;
  email?: string | null;
  kind: 'user' | 'contact' | 'user_contact';
  userId?: string | null;
  contactId?: string | null;
  /** live: read from the company's users / internal contacts; demo: sample data. */
  source: 'live' | 'demo';
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  archived?: boolean;
  /** Policy: one expense of this category above this amount is a violation. */
  maxAmount?: Minor | null;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  archived?: boolean;
}

/** A trip, project or shared household: expenses filed under it, its members split them. */
export interface ExpenseGroup {
  id: string;
  name: string;
  description?: string | null;
  memberIds: string[];
  costCenterId?: string | null;
  closed?: boolean;
}

interface TxnBase {
  id: string;
  currency: string;
  /** Business date, YYYY-MM-DD. */
  date: string;
  status: TxnStatus;
  createdBy: string;
  createdAt: string;
  submittedAt?: string | null;
  decidedBy?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  voidedBy?: string | null;
  voidedAt?: string | null;
  voidReason?: string | null;
  note?: string | null;
}

/**
 * Who paid. `org`: the organization's cash/bank. `custody`: from a custody
 * the holder keeps (the organization's money). `personal`: the payer's own
 * money (reimbursable by whoever bears the cost).
 */
export type PaymentSource = 'org' | 'custody' | 'personal';

export interface PaymentPart {
  source: PaymentSource;
  amount: Minor;
  custodyId?: string | null;
  /** personal: who paid; custody: filled with the holder. */
  payerId?: string | null;
}

/**
 * Who bears the cost — and therefore who owes whom. Kept apart from the
 * analytic allocation: charging a share to a person creates a debt; filing a
 * cost under a cost center does not.
 */
export type SplitMethod = 'org' | 'equal' | 'amounts' | 'percent';

export interface ShareLine {
  partyId: PartyId;
  amount: Minor;
  /** percent method: the weight entered (for editing). */
  percent?: number | null;
}

export interface Bearing {
  method: SplitMethod;
  shares: ShareLine[];
}

/** Analytic distribution of the cost (reports only — never a debt). */
export interface AllocationLine {
  costCenterId: string | null;
  groupId: string | null;
  amount: Minor;
}

export interface AttachmentMeta {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface Expense extends TxnBase {
  kind: 'expense';
  description: string;
  amount: Minor;
  categoryId: string;
  groupId?: string | null;
  costCenterId?: string | null;
  payments: PaymentPart[];
  bearing: Bearing;
  allocation: AllocationLine[];
  attachments: AttachmentMeta[];
}

/**
 * Operational custody (عهدة تشغيلية): the organization's money a person holds
 * to spend on its behalf. Not a debt of the holder while it is accounted for
 * by expenses and returns. Personal advances are separate (`Advance`).
 */
export interface Custody {
  id: string;
  holderId: string;
  purpose: string;
  currency: string;
  limit?: Minor | null;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string | null;
  createdBy: string;
}

/** issue: first handover; topup: refill; return: money back to the organization. */
export type CustodyMoveType = 'issue' | 'topup' | 'return';

export interface CustodyMove extends TxnBase {
  kind: 'custody_move';
  custodyId: string;
  type: CustodyMoveType;
  amount: Minor;
}

/** Personal advance (سلفة شخصية): the person owes it to the organization. */
export interface Advance extends TxnBase {
  kind: 'advance';
  personId: string;
  amount: Minor;
  purpose: string;
}

/** A payment from one party to another that settles what they owe. */
export interface Settlement extends TxnBase {
  kind: 'settlement';
  fromId: PartyId;
  toId: PartyId;
  amount: Minor;
  method: 'cash' | 'transfer' | 'payroll' | 'other';
}

export type AnyTxn = Expense | CustodyMove | Advance | Settlement;

export interface ExpensesSettings {
  mode: 'simple' | 'advanced';
  /** Off: a submitted record is approved at once. */
  requireApproval: boolean;
  /** Approved at once below this amount (when approval is required). */
  autoApproveBelow: Minor | null;
  /** An attachment is required above this amount. */
  requireAttachmentAbove: Minor | null;
  /** Monthly spending of one person (expenses they created) above this warns. */
  monthlyLimitPerPerson: Minor | null;
  /** Policy violations block submitting (else they warn). */
  blockOnPolicyViolation: boolean;
  /** Who approves (empty: nobody — approval stays pending). */
  approverIds: string[];
  /** Used when the company currency is unknown (demo). */
  fallbackCurrency: string;
}

export interface ExpensesData {
  version: 1;
  /** Sample participants (demo source); live ones are read, never stored. */
  demoParticipants: Participant[];
  categories: Category[];
  costCenters: CostCenter[];
  groups: ExpenseGroup[];
  custodies: Custody[];
  expenses: Expense[];
  custodyMoves: CustodyMove[];
  advances: Advance[];
  settlements: Settlement[];
  settings: ExpensesSettings;
}
