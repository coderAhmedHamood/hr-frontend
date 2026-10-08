/**
 * Point of sale domain, as designed in pos-study v3. The web holds it in a
 * local store until the backend exists; these types are the contract the API
 * will follow.
 */

/** Company-wide stock mode: sell without tracking, or through inventory (pos-inventory bridge). */
export type PosStockMode = 'none' | 'inventory';

export type PosPaymentMethod = 'cash' | 'card' | 'transfer';

export type PosSettings = {
  stockMode: PosStockMode;
  /**
   * A requested change of stock mode (drain): no new shifts until it ends;
   * open shifts finish in their stamped mode; then an admin confirms the new
   * mode explicitly. Null when none is under way.
   */
  stockModeChange: { to: PosStockMode; requestedAt: string; requestedBy: string } | null;
  /** Only products marked "available in POS" in the catalog. */
  onlyPosAvailableProducts: boolean;
  tax: {
    enabled: boolean;
    /** Percent, e.g. 15. */
    rate: number;
    pricesIncludeTax: boolean;
  };
  discounts: {
    /** Highest discount a cashier may give alone, percent of the line/sale. */
    cashierMaxPercent: number;
    /** Above the limit: a supervisor confirms on the same device. */
    supervisorApprovalAbove: boolean;
    allowPriceOverride: boolean;
  };
  returns: {
    windowDays: number;
    refundToOtherMethodNeedsApproval: boolean;
  };
  shifts: {
    blindCount: boolean;
    countByDenomination: boolean;
    /** Difference that needs no reason, in money. */
    differenceTolerance: number;
    denominations: number[];
  };
  paymentMethods: Record<PosPaymentMethod, boolean>;
};

export type PosRegister = {
  id: string;
  name: string;
  /** Receipt number prefix, unique in the company (e.g. POS1). */
  code: string;
  branchId: string | null;
  branchName: string | null;
  /** Inventory mode only. */
  warehouseName: string | null;
  isActive: boolean;
  nextSequence: number;
  createdAt: string;
};

/** A browser paired with a register. */
export type PosDevice = {
  id: string;
  registerId: string;
  label: string;
  pairedAt: string;
  revokedAt: string | null;
};

export type PosSessionStatus = 'open' | 'closed';

export type PosSession = {
  id: string;
  registerId: string;
  cashierId: string;
  cashierName: string;
  status: PosSessionStatus;
  stockMode: PosStockMode;
  openedAt: string;
  openingFloat: number;
  closedAt: string | null;
  countedCash: number | null;
  expectedCash: number | null;
  difference: number | null;
  differenceReason: string | null;
  denominationCounts: Record<string, number> | null;
};

export type PosCustomer =
  | { kind: 'walk_in' }
  | { kind: 'named'; name: string; phone?: string; taxNumber?: string };

export type PosDiscount = { type: 'percent' | 'amount'; value: number };

export type PosSaleLine = {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  variantName: string | null;
  sku: string;
  quantity: number;
  /** Catalog price when added. */
  sourcePrice: number;
  /** Price applied (differs only by an override). */
  unitPrice: number;
  discount: PosDiscount | null;
  /** Computed snapshot. */
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  /** Line total the customer pays. */
  total: number;
  returnedQuantity: number;
};

export type PosSaleStatus = 'awaiting_payment' | 'completed' | 'cancelled' | 'payment_exception';

export type PosPaymentStatus = 'pending' | 'succeeded' | 'declined' | 'cancelled' | 'unknown';

export type PosPayment = {
  id: string;
  kind: 'payment' | 'refund';
  method: PosPaymentMethod;
  amount: number;
  status: PosPaymentStatus;
  /** Approval code, transfer reference… */
  reference: string | null;
  tendered: number | null;
  change: number | null;
  sessionId: string;
  createdAt: string;
  /** Recorded after the fact (late entry), with the reason. */
  lateEntryReason?: string | null;
};

export type PosSaleTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

export type PosSaleRevision = {
  at: string;
  by: string;
  reason: string;
  lines: PosSaleLine[];
  totals: PosSaleTotals;
};

export type PosSale = {
  /** The only reference integrations use (`pos:<id>`). */
  id: string;
  /** Visible receipt number, given on completion. */
  number: string | null;
  registerId: string;
  sessionId: string;
  cashierName: string;
  status: PosSaleStatus;
  stockSource: PosStockMode;
  customer: PosCustomer;
  lines: PosSaleLine[];
  orderDiscount: PosDiscount | null;
  totals: PosSaleTotals;
  payments: PosPayment[];
  revisions: PosSaleRevision[];
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  exceptionReason: string | null;
};

export type PosReturnCondition = 'resellable' | 'damaged' | 'not_received';

export type PosReturn = {
  id: string;
  number: string;
  saleId: string;
  saleNumber: string;
  sessionId: string | null;
  createdAt: string;
  createdBy: string;
  reason: string;
  lines: Array<{
    saleLineId: string;
    name: string;
    quantity: number;
    condition: PosReturnCondition;
    amount: number;
  }>;
  /** Money back is its own part: recorded when it actually happens. */
  refund: {
    method: PosPaymentMethod;
    amount: number;
    reference: string | null;
    status: 'pending' | 'done';
  };
  /** Damaged goods wait for a decision (scrap, supplier, repair). */
  damagedDecision: 'pending' | 'scrap' | 'supplier' | 'repair' | null;
  /**
   * Stock of the returned goods, following the sale's stamped source:
   * not_applicable (sold without tracking), posted (back to inventory), or
   * pending — sold from inventory but received while POS is not linked: kept
   * here and reviewed before posting, so it is never counted twice.
   */
  stockPosting?: 'not_applicable' | 'posted' | 'pending' | 'reviewed';
  /** Idempotency key: the same return sent twice has one effect. */
  operationKey?: string;
};

export type PosCashMovement = {
  id: string;
  sessionId: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  createdAt: string;
  createdBy: string;
};

export type PosHeldCart = {
  id: string;
  registerId: string;
  label: string;
  lines: PosSaleLine[];
  customer: PosCustomer;
  orderDiscount: PosDiscount | null;
  createdAt: string;
};

export type PosAuditEvent = {
  id: string;
  at: string;
  by: string;
  type:
    | 'cart_voided'
    | 'price_override'
    | 'discount_over_limit'
    | 'sale_cancelled'
    | 'payment_late_entry'
    | 'payment_not_charged'
    | 'exception_resolved'
    | 'sale_revised'
    | 'return_created'
    | 'refund_recorded'
    | 'cash_movement'
    | 'shift_difference'
    | 'receipt_reprint'
    | 'device_paired'
    | 'device_revoked'
    | 'stock_mode_change_requested'
    | 'stock_mode_change_cancelled'
    | 'stock_mode_changed'
    | 'stock_posting_reviewed';
  detail: string;
};

export const PAYMENT_METHOD_LABELS: Record<PosPaymentMethod, string> = {
  cash: 'نقد',
  card: 'بطاقة',
  transfer: 'تحويل / محفظة',
};

export const SALE_STATUS_LABELS: Record<PosSaleStatus, string> = {
  awaiting_payment: 'بانتظار الدفع',
  completed: 'مكتمل',
  cancelled: 'ملغى',
  payment_exception: 'استثناء دفع',
};

export const RETURN_CONDITION_LABELS: Record<PosReturnCondition, string> = {
  resellable: 'صالح للبيع',
  damaged: 'تالف',
  not_received: 'لم يُستلم',
};

export const DEFAULT_POS_SETTINGS: PosSettings = {
  stockMode: 'none',
  stockModeChange: null,
  onlyPosAvailableProducts: false,
  tax: { enabled: false, rate: 0, pricesIncludeTax: true },
  discounts: { cashierMaxPercent: 10, supervisorApprovalAbove: true, allowPriceOverride: false },
  returns: { windowDays: 7, refundToOtherMethodNeedsApproval: true },
  shifts: {
    blindCount: true,
    countByDenomination: false,
    differenceTolerance: 0,
    denominations: [1000, 500, 200, 100, 50, 20, 10, 5, 1],
  },
  paymentMethods: { cash: true, card: true, transfer: true },
};
