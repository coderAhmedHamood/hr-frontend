/**
 * Store Admin — `/store-admin/companies/:companyId/payment-accounts`
 * Granted to superadmin via `system:init`; add manually for other roles.
 * Public catalog: `GET /public/store/payment-accounts` (no JWT).
 */
export const PAYMENT_ACCOUNTS_PERMISSIONS = {
  /** List + detail */
  read: 'sta.payment-accounts.read',
  create: 'sta.payment-accounts.create',
  /** Update + restore */
  update: 'sta.payment-accounts.update',
  /** Soft archive */
  delete: 'sta.payment-accounts.delete',
} as const;
