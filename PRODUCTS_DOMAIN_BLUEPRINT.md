# Products Domain — Sprint 1 Blueprint

> **Status: PLANNING ONLY. No implementation code has been written against this document.**
> This is the domain design phase requested before Sprint 1 implementation begins. Each task
> below will be implemented one at a time, followed by a compliance audit against
> `.cursor/frontend doc rules.md` v3.0, before moving to the next task.
>
> **v1.1 — amended after CTO design review.** Changes from the original: removed `isFeatured`
> from the Product schema (conflicted with the contract's CMS "Manual Products" concept — see
> the Known Risks Accepted section); added `width`/`height` to `MediaItem`; documented the
> `StockStatus`-is-authoritative rule; specified SSR for the Search page; cut CSV Import from
> Sprint 1 scope (Export only — see T12); added a definition-of-done requiring tests per task.

---

## 1. Domain Model

### Entities

| Entity | Purpose |
|---|---|
| **Product** | The sellable item. Owns pricing, inventory, media, SEO, lifecycle status. |
| **Category** | Hierarchical grouping for browsing/navigation. Self-referential (parent/child). |
| **Brand** | *New this sprint.* Manufacturer/label a product belongs to. Flat (no hierarchy). |

Customer/Order entities already exist from prior work and are out of scope for this sprint — this blueprint covers the **Products Domain** only (Product, Category, Brand, and their shared value objects).

### Relationships

```
Brand 1───* Product        (a product has at most one brand; a brand has many products)
Category 1───* Product      (a product has at most one primary category; a category has many products)
Category 1───* Category     (self-referential parentId — unlimited depth, same as today)
Product 1───* MediaItem     (ordered, one marked primary)
Product 1───1 Inventory     (embedded value object, not a separate table/entity)
Product 1───1 SeoFields     (embedded value object)
Category 1───1 SeoFields    (embedded value object)
Brand 1───1 SeoFields       (embedded value object)
```

**Decision — single category per product, not many-to-many.** Real multi-category tagging is common in mature catalogs, but it's a materially bigger admin UI (multi-select, primary-category concept) and query complexity (join table) for a mock-data sprint. Keeping the existing single `categoryId` (already in the codebase) avoids unnecessary rework; revisit only if a real merchandising need for cross-listing shows up. `tags: string[]` (free-text) covers the "show up in more than one filter" need cheaply in the meantime.

**Decision — Delete vs. Archive are different operations.** `Archive` is a reversible lifecycle transition (`status → 'archived'`): hidden from the storefront, still visible to admins under an "Archived" filter, fully recoverable via `Unarchive`. `Delete` is the existing permanent removal (already built, with a confirm dialog) — kept for genuine mistakes/test data, not as the normal end-of-life path. This is why the Admin Features section below lists both as distinct actions.

### Value Objects

| Value Object | Fields | Notes |
|---|---|---|
| `Money` | `amount`, `currency` | Already exists, unchanged. |
| `MediaItem` | `id`, `url`, `alt`, `type`, `position`, `isPrimary`, `width?`, `height?` | **Upgraded** from the existing `MediaAsset` (`{url, alt}`) — needs an `id` so admin can reorder/remove individual items, `position`/`isPrimary` for gallery ordering and the storefront's "main image," and `width`/`height` so `next/image` can avoid layout shift without a network round-trip (Performance Contract's CLS target). |
| `Inventory` | `trackInventory`, `quantity`, `lowStockThreshold`, `allowBackorder` | New. Embedded in `Product`, not a separate entity — no multi-warehouse concept in this sprint. |
| `SeoFields` | `metaTitle?`, `metaDescription?`, `canonicalPath?`, `ogImage?`, `keywords?` | **Extended** from today's `{metaTitle, metaDescription}` to actually support the SEO Contract's OpenGraph/canonical needs per-entity. |
| `Slug` | (plain validated string) | Not a class/branded type — kebab-case validation lives in the Zod schema, matching the existing `product-schema.ts` pattern. Not over-engineered into a value object type. |

### Enumerations

| Enum | Values | Purpose |
|---|---|---|
| `ProductStatus` | `draft \| active \| archived` | **New.** Admin lifecycle — what "Archive" toggles. `draft` = not yet published to storefront; `active` = live; `archived` = reversibly retired. |
| `StockStatus` | `in_stock \| out_of_stock \| preorder \| discontinued` | Renamed/clarified from today's `ProductAvailability` — this is the customer-facing purchasability signal, **explicitly admin-set**, not auto-derived from `Inventory.quantity` (an admin may want to mark something `preorder` regardless of current count). "Low stock" is a computed UI badge (`quantity <= lowStockThreshold`), not a status value — keeps the enum small and avoids a state that doesn't change purchasability. **Authoritative-source rule (added on review):** `stockStatus` is always the purchasability source of truth; `Inventory.quantity` is informational/display-only and never auto-overrides it. This is a documented business rule, not enforced by new schema — an admin can legally set `in_stock` with `quantity: 0`, and that's an admin data-entry concern, not a system inconsistency to reconcile in code. |
| `MediaType` | `image \| video` | New — supports the Media schema. |

---

## 2. Mock Data Model

### Product schema (final)

```ts
type Product = TenantScoped & Slugged & {
  id: string;
  sku: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  brandId?: string | null;
  categoryId?: string | null;
  status: ProductStatus;
  stockStatus: StockStatus;
  inventory: Inventory;
  price: Money;
  compareAtPrice?: Money;
  media: MediaItem[];
  seo: SeoFields;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};
```

### Category schema (final)

```ts
type Category = TenantScoped & Slugged & {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  parentId?: string | null;
  image?: MediaItem;
  seo: SeoFields;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Brand schema (new, final)

```ts
type Brand = TenantScoped & Slugged & {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  logo?: MediaItem;
  websiteUrl?: string;
  seo: SeoFields;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
```

### Inventory schema (value object)

```ts
type Inventory = {
  trackInventory: boolean;
  quantity: number;
  lowStockThreshold: number; // default 5
  allowBackorder: boolean;
};
```

### Media schema (value object)

```ts
type MediaItem = {
  id: string;
  url: string;
  alt: string;
  type: MediaType;
  position: number;
  isPrimary: boolean;
  width?: number;
  height?: number;
};
```

### SEO schema (value object, extended)

```ts
type SeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string; // override; defaults to the entity's own slug-derived path
  ogImage?: string;
  keywords?: string[];
};
```

---

## 3. Admin Features

| Feature | Spec |
|---|---|
| **Complete CRUD** | Create/Read/Update already exist for Products/Categories; Brand CRUD is net-new this sprint (mirrors Categories). Delete stays a permanent, confirm-gated action. |
| **Filters** | Category, Brand, Status (draft/active/archived), Stock Status. Filter state lives in URL search params (already the pattern from the prior audit fix). |
| **Search** | Debounced text search across `nameAr`, `nameEn`, `sku`, `tags` (extended from today's `nameAr`/`sku`-only search). |
| **Sorting** | By name, price, stock quantity, `createdAt`, `updatedAt` — a sort `<Select>` next to the search bar (the list stays a card grid, not a table — see the compliance audit's Contract Issue #12 on why a table isn't mandated for a visual catalog). |
| **Bulk Actions** | Checkbox selection on cards → bulk `Archive`, bulk `Activate`, bulk `Delete`, bulk `Export` (selected rows only). **No permission gating yet** — same accepted, documented gap as the rest of ecommerce admin (see Known Risks Accepted); worth re-flagging here since bulk delete is the most destructive action added this sprint. |
| **Export** | CSV of the current filtered result set (not just the visible page). **Import is cut from Sprint 1** — see the Known Risks Accepted section for why. |
| **Archive** | Per-row `Archive`/`Unarchive` action; an "Archived" tab/toggle on the list page filters `status = archived` (hidden by default, matching the storefront hiding archived products automatically since it only ever queries `status = active`). |
| **Duplicate** | Per-row `Duplicate` action: clones a product with a new id, `sku` suffixed (`-copy`), `slug` suffixed/uniqued, `status` reset to `draft`. |

### Storefront Features

| Feature | Spec |
|---|---|
| **Product listing** | Existing `/store/products`, extended with Brand filter pills and a sort control alongside the existing Category pills. |
| **Product details** | Existing `/store/products/[slug]`, extended with a real multi-image gallery (using the new `MediaItem[]` array) and a **Related Products** section. |
| **Category pages** | Existing `/store/categories/[slug]`, unchanged structurally, benefits from richer Product data (brand shown on cards, etc.). |
| **Search** | **New** `/store/search?q=` page, reusing `ProductCard`/`StorePagination`. Per the SEO Contract's Search Pages rule, this page is `noindex, follow`. **Rendering strategy: SSR**, not ISR — per the contract's own Storefront Rendering Strategy table ("Search results → SSR"), since results are query-dependent and not meaningfully cacheable. |
| **Filtering** | Extend the existing category-pill pattern on `/store/products` with a Brand pill row and a simple min/max price range filter — all still URL-driven (`?brand=`, `?minPrice=`, `?maxPrice=`), matching the existing `?category=` pattern. |
| **Related products** | New component on the product detail page: same category or brand as the current product, excluding itself, limited to ~4. |
| **Breadcrumbs** | Already exists (`StoreBreadcrumbs`) — reused as-is, no new work. |
| **Structured data** | Extend the existing `productJsonLd()` to include `brand` (schema.org `Brand`/`Organization` sub-object). Listing pages keep `CollectionPage`; no `ItemList` upgrade planned this sprint (noted as a later-sprint nicety, not required). |

---

## 5. Folder Structure

```
src/features/ecommerce/
  domain/
    types/
      product.ts          (updated)
      category.ts          (updated)
      brand.ts             (new)
      common.ts            (updated — MediaItem, Inventory, extended SeoFields)
      index.ts
    constants/
      product-status.ts     (new — ProductStatus)
      stock-status.ts        (new — StockStatus, replaces product-availability.ts)
  admin/
    products/
      components/            (+ product-media-fields.tsx, product-filters-bar.tsx, bulk-actions-bar.tsx, import-export-dialogs.tsx)
      hooks/                 (query-keys.ts, use-products.ts, use-product-mutations.ts + bulk/duplicate/archive variants)
      lib/
        api/products.ts
        product-form-mapping.ts
        product-csv.ts        (new)
      schemas/product-schema.ts
    categories/               (existing, unchanged shape)
    brands/                   (new — mirrors categories/ structure exactly)
      components/
      hooks/
      lib/api/brands.ts
      schemas/brand-schema.ts
  storefront/
    components/
      product-card.tsx
      product-detail-page.tsx
      products-browse-page.tsx
      category-detail-page.tsx
      search-page.tsx          (new)
      related-products.tsx     (new)
      storefront-shell.tsx
      store-pagination.tsx
      store-breadcrumbs.tsx
      json-ld.tsx
    domain/company-config.ts
    lib/ (seo.ts, storefront-company.ts, get-storefront-company-config.ts, api/company-config-api.ts, mock/company-configs.ts)
  shared/
    lib/mock/ (repository.ts, products.json, categories.json, brands.json [new])
    utils/ (format-price.ts, csv.ts [new, shared CSV build/parse])

src/app/
  (app)/(ecommerce)/
    products/page.tsx
    categories/page.tsx
    brands/page.tsx            (new)
  store/
    page.tsx, products/page.tsx, products/[slug]/page.tsx, categories/[slug]/page.tsx
    search/page.tsx             (new)
    loading.tsx, error.tsx
```

## 6. Repository Structure

The existing `createMockRepository<T>()` factory (`shared/lib/mock/repository.ts`) already provides `list`/`getById`/`getBySlug`/`create`/`update`/`remove`. Sprint 1 extends it with two additions, used by every entity (Products, Categories, Brands alike):

```ts
bulkUpdate(companyId: string, ids: string[], patch: Partial<T>): Promise<T[]>
bulkRemove(companyId: string, ids: string[]): Promise<number> // returns count removed
```

`Duplicate` is **not** a repository primitive — it's composed in the `*Api` layer (`productsApi.duplicate(id)` reads the source record, mutates a copy, calls the existing `create()`), since "clone with a new slug/status" is product-specific business logic, not a generic repository concern.

## 7. Hook Structure

| Hook | Resource | New/Existing |
|---|---|---|
| `useProducts(query)` | list | existing |
| `useProduct(slugOrId)` | single | existing (`getBySlug`/`getById` already on the API) |
| `useProductMutations()` | create/update/remove | existing — extended with `duplicate`, `archive`, `unarchive` |
| `useProductBulkActions()` | bulk archive/activate/delete/export | new |
| `useBrands(query)` / `useBrandMutations()` | Brand CRUD | new, mirrors `useCategories`/category mutations exactly |
| `useCategories(query)` / `useCategoryMutations()` | Category CRUD | existing (mutations don't exist yet either — categories currently has read-only hooks; this sprint's Products focus means Category mutations stay out of scope unless a task explicitly calls for it) |

## 8. API Structure (mock only)

| Module | Methods |
|---|---|
| `productsApi` | `getAll`, `getById`, `getBySlug`, `create`, `update`, `remove`, `duplicate`, `bulkUpdateStatus`, `bulkRemove`, `exportCsv` |
| `categoriesApi` | `getAll`, `getById`, `getBySlug`, `create`, `update`, `remove` (unchanged) |
| `brandsApi` | `getAll`, `getById`, `getBySlug`, `create`, `update`, `remove` (new, mirrors `categoriesApi` exactly) |
| `shared/utils/csv.ts` | `buildCsv(rows)` — generic, reused by export, not product-specific. `parseCsv` deferred with Import (see Known Risks Accepted). |

---

## 9. Sprint 1 Task Breakdown

Each task is scoped to ~30–90 minutes and will be implemented **one at a time**, each followed by a compliance audit before the next begins. **Definition-of-done for every task that adds business logic (mapping functions, bulk operations, CSV formatting, duplicate/slug generation): a Jest test ships with the task, not as a follow-up finding in the next audit.**

### Foundation
| # | Task | Est. |
|---|---|---|
| T1 | Domain types: extend `common.ts` (`MediaItem`, `Inventory`, extended `SeoFields`); add `product-status.ts`, `stock-status.ts`; update `product.ts`/`category.ts`; add `brand.ts`. | 75–90 min |
| T2 | Mock seed data: new `brands.json`; migrate `products.json`/`categories.json` to the new schema shape (status, stockStatus, inventory, media[], seo, tags). | 45–60 min |
| T3 | Extend `createMockRepository` with `bulkUpdate`/`bulkRemove`; confirm `companyId`-prefixed query-key convention carries into new modules. | 45 min |

### Admin — Brands (new module, validates the pattern before touching Products)
| # | Task | Est. |
|---|---|---|
| T4 | `brandsApi` + `useBrands`/`useBrandMutations` + `query-keys.ts`. | 60 min |
| T5 | Brands admin UI (list page, form dialog, delete dialog) + nav/route wiring. | 75–90 min |

### Admin — Products extension
| # | Task | Est. |
|---|---|---|
| T6 | Update `product-schema.ts`/`product-form-mapping.ts` for brand/status/stockStatus/inventory/tags; extend `product-inventory-fields.tsx`. | 75–90 min |
| T7 | Multi-image media management in the product form (add/remove/reorder via up/down buttons — **full drag-and-drop reordering deferred to a later sprint**, out of this time-box). | 60–75 min |
| T8 | Filters bar (category/brand/status/stock status) + sort control on the admin products list. | 75–90 min |
| T9 | Bulk selection + bulk Archive/Activate/Delete on the admin products list. **No permission gating on these bulk actions yet — accepted, documented gap, not an oversight (see Known Risks Accepted).** | 90 min |
| T10 | Duplicate action (single-product clone). | 45–60 min |
| T11 | Archive/Unarchive single-product action + "Archived" filter tab. | 45–60 min |
| T12 | CSV Export (current filtered result set). **Import is cut from Sprint 1** (see Known Risks Accepted) — revisit once a real backend exists to make it meaningful. | 45–60 min |

### Storefront extensions
| # | Task | Est. |
|---|---|---|
| T13 | Related Products component on the product detail page. | 45–60 min |
| T14 | Search page (`/store/search`), `noindex,follow`, **SSR rendering** per the SEO/Storefront Rendering Strategy contracts. | 60–75 min |
| T15 | Storefront Brand filter pills + price range filter + sort control on the browse page. | 75–90 min |
| T16 | Extend `productJsonLd()` with brand data. | 45 min |

**16 tasks total** (revised down from 17 — CSV Import cut, tasks renumbered; nothing else changed shape). Company-config discipline (no new hardcoded brand/currency/locale strings) is a checklist item within T14/T15, not a standalone task.

---

## Known Risks Accepted for Sprint 1 (explicit, not silent)

1. **No Variant entity.** SKU/Price/Inventory/Media are modeled on Product directly. Introducing product variants later (size/color combinations) will require moving these down to a Variant entity — a breaking schema migration, not an additive change. Accepted for Sprint 1 scope (this blueprint is the *Products* Domain, not a Variants Domain); flagged so it's a deliberate, tracked decision rather than a surprise later.
2. **`isFeatured` removed from Product** — "featured" placement belongs to the CMS Engine's "Manual Products" section-config concept (already adopted in the contract), not a product-level flag. No loss of capability, just modeled in the right place when the CMS section config is built.
3. **CSV Import cut from Sprint 1.** Importing into a mock repository that resets on every page reload has near-zero practical value, and a real backend's import semantics (server-side streaming, queued processing) would likely make a mock implementation throwaway work. Export ships this sprint; Import is deferred until a real backend exists.
4. **No permission gating on ecommerce admin bulk actions**, including bulk delete — consistent with the existing, previously-audited gap (`useCan()` fails closed and there's no real permission-catalog entry for ecommerce yet), but explicitly re-flagged here since bulk delete increases the blast radius of that accepted gap.
5. **`nameAr`/`nameEn` per-field schema** (not a translation-key catalog) doesn't scale past two languages without a migration — inherited house-wide convention, not introduced by this blueprint, not fixed here.
6. **Multi-warehouse inventory** will require restructuring `Inventory` off Product into a location-scoped list whenever it's needed — correctly deferred, but a migration when it comes, not a simple extension.

## Other explicit assumptions/decisions

1. Single category per product (not many-to-many) — `tags[]` covers lightweight cross-listing.
2. `Archive` (reversible) and `Delete` (permanent) are distinct actions, both kept.
3. `StockStatus` is admin-set, not auto-derived from `Inventory.quantity` (see the authoritative-source rule in Section 1); "low stock" is a computed badge, not a status.
4. Category mutations (create/edit/delete UI) are **not** in this sprint's scope — only Brand gets net-new full CRUD; Categories stay read-only in the storefront/admin-list sense they are today, unless you want that added.
5. Full drag-and-drop media reordering is deferred; Sprint 1 ships simple up/down ordering buttons.
6. No `ItemList` structured-data upgrade for listing pages this sprint — `CollectionPage` stays as-is.

---

## CTO Design Review — Verdict

Reviewed against domain modeling, data model, UX, architecture/contract compliance, future compatibility (real backend, multi-company, CMS, localization, multi-currency, inventory expansion, variants, bundles, marketplace, APIs, mobile), simplification opportunities, and consolidated risk. All findings from that review are folded into this v1.1 document (`isFeatured` removed, `MediaItem` width/height added, `StockStatus` authoritative rule documented, Search page SSR specified, CSV Import cut, permission-gap re-flagged on T9, tests baked into each task's definition-of-done). Remaining risks (Variants, i18n schema shape, multi-warehouse migration) are explicitly named above as accepted Sprint 1 debt, not silent gaps.

> **Sprint 1 Blueprint Approved**

**Awaiting your approval before implementing T1.**
