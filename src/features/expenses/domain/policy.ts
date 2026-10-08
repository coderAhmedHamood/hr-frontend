/**
 * Policies (spending limits, attachments) and the approval workflow:
 * draft → submitted → approved | rejected; any approved record → void.
 * Only approved records change balances (see ledger). The mode (simple /
 * advanced) only changes what the screens show: these rules read settings,
 * never the mode.
 */
import type { Minor } from './money';
import type { AnyTxn, Category, Expense, ExpensesData, ExpensesSettings, TxnStatus } from './types';

export type PolicyViolation = {
  code: 'category_limit' | 'attachment_required' | 'monthly_limit';
  message: string;
};

/** Spending (in minor units) of expenses `personId` created in the month of `date`. */
export function monthlySpendOf(data: ExpensesData, personId: string, date: string, currency: string, excludeId?: string): Minor {
  const month = date.slice(0, 7);
  return data.expenses
    .filter(
      (e) =>
        e.id !== excludeId &&
        e.createdBy === personId &&
        e.currency === currency &&
        e.date.startsWith(month) &&
        (e.status === 'approved' || e.status === 'submitted'),
    )
    .reduce((t, e) => t + e.amount, 0);
}

export function checkPolicies(
  expense: Pick<Expense, 'id' | 'amount' | 'categoryId' | 'attachments' | 'createdBy' | 'date' | 'currency'>,
  data: ExpensesData,
  formatAmount: (minor: Minor) => string,
): PolicyViolation[] {
  const settings = data.settings;
  const out: PolicyViolation[] = [];
  const category: Category | undefined = data.categories.find((c) => c.id === expense.categoryId);
  if (category?.maxAmount != null && expense.amount > category.maxAmount) {
    out.push({
      code: 'category_limit',
      message: `يتجاوز حد فئة «${category.name}» (${formatAmount(category.maxAmount)})`,
    });
  }
  if (
    settings.requireAttachmentAbove != null &&
    expense.amount > settings.requireAttachmentAbove &&
    expense.attachments.length === 0
  ) {
    out.push({
      code: 'attachment_required',
      message: `يلزم إرفاق إيصال للمبالغ فوق ${formatAmount(settings.requireAttachmentAbove)}`,
    });
  }
  if (settings.monthlyLimitPerPerson != null) {
    const spent = monthlySpendOf(data, expense.createdBy, expense.date, expense.currency, expense.id);
    if (spent + expense.amount > settings.monthlyLimitPerPerson) {
      out.push({
        code: 'monthly_limit',
        message: `يتجاوز الحد الشهري للشخص (${formatAmount(settings.monthlyLimitPerPerson)})`,
      });
    }
  }
  return out;
}

export function blocksSubmit(violations: readonly PolicyViolation[], settings: ExpensesSettings): boolean {
  return settings.blockOnPolicyViolation && violations.length > 0;
}

/** Status a record takes when submitted: approved at once unless approval is required. */
export function statusOnSubmit(amount: Minor, settings: ExpensesSettings): TxnStatus {
  if (!settings.requireApproval) return 'approved';
  if (settings.autoApproveBelow != null && amount < settings.autoApproveBelow) return 'approved';
  return 'submitted';
}

/**
 * Who may approve or reject a submitted record (the in-app simulation of
 * roles): a listed approver who did not create it. On the server this must be
 * enforced by permissions on the operation, not by screens.
 */
export function canDecide(actorId: string, txn: AnyTxn, settings: ExpensesSettings): boolean {
  return txn.status === 'submitted' && txn.createdBy !== actorId && settings.approverIds.includes(actorId);
}

export function canVoid(txn: AnyTxn): boolean {
  return txn.status === 'approved' || txn.status === 'submitted';
}

export const STATUS_LABELS_AR: Record<TxnStatus, string> = {
  draft: 'مسودة',
  submitted: 'بانتظار الاعتماد',
  approved: 'معتمد',
  rejected: 'مرفوض',
  void: 'ملغى',
};
