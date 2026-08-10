/**
 * Store Admin — `/store-admin/companies/:companyId/payment-accounts`
 *
 * Backend intentionally has **no** `.read` leaf: list/detail need JWT only.
 * Mutations are gated. Group node: `sta.payment-accounts`.
 * Public catalog: `GET /public/store/payment-accounts` (no JWT).
 */
export const PAYMENT_ACCOUNTS_PERMISSIONS = {
  /** Group / module node (optional UI gate) */
  module: 'sta.payment-accounts',
  create: 'sta.payment-accounts.create',
  /** Update + restore */
  update: 'sta.payment-accounts.update',
  /** Soft archive */
  delete: 'sta.payment-accounts.delete',
} as const;
