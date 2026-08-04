/**
 * Tenant company id for inventory admin.
 * Kept independent of storefront naming so Sales/ecommerce call Inventory — not the reverse.
 * Same demo value until multi-tenant resolution exists.
 */
export function getInventoryCompanyId(): string {
  return 'demo-company';
}
