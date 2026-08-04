/**
 * The public storefront has no authenticated user session to read `activeCompanyId` from, and
 * there is no domain/tenant resolution yet (single company for now — see
 * `ecommerce-module-architecture` decisions). This is the ONLY hardcoded value in the storefront —
 * every brand/SEO/contact/theme/nav fact is read from the `CompanyConfig` this id resolves to
 * (see `get-storefront-company-config.ts`), never hardcoded in a component.
 *
 * When multi-tenant hosting exists, replace this function body with hostname-based tenant
 * resolution (see the deferred `middleware.ts` plan) — nothing else in the storefront needs to
 * change, since every storefront page already goes through `getStorefrontCompanyConfig()`.
 */
export function getStorefrontCompanyId(): string {
  return 'demo-company';
}
