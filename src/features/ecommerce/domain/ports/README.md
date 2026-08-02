/**
 * Ecommerce dual-port architecture (approved).
 *
 * Website and Dashboard share a domain, not one isomorphic CRUD repository.
 *
 * ## Catalog
 *
 * - Admin ports: `domain/ports/catalog.ports.ts`
 * - Storefront ports: `storefront/domain/catalog-ports.ts`
 * - Shared mock store: `shared/lib/adapters/mock-catalog-store.ts`
 * - Facades: `productsApi` / `storefrontProductsRepository` (and categories/brands)
 *
 * ## Pages / Company (CMS)
 *
 * - Page ports: `page-builder/domain/page.ports.ts`
 * - Company ports: `storefront/domain/company.ports.ts`
 * - Adapters: page-repository / company-repository (single in-memory indexes)
 * - Storefront page reads return **published** documents only; CMS read/write any status.
 *
 * ## Rules
 *
 * 1. UI never talks JSON paths or raw `fetch` for domain data.
 * 2. One shared mock index per catalog aggregate (no cloned seeds).
 * 3. HTTP cutover swaps adapters; port shapes may evolve when auth/pagination/media land.
 * 4. No GraphQL / multi-transport abstraction until a second transport is real.
 */
export {};
