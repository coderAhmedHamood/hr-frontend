# Homepage CMS Architecture — Design Specification

**Status:** Design only — **no implementation** until approved  
**Date:** 2026-07-13  
**Scope:** `src/features/ecommerce/storefront/homepage/` (proposed capsule)  
**Acceptance criterion:** Replacing `homepage.json` with a backend API changes **only** `homepage-repository.ts` (and optionally request mappers). Homepage, section renderer, section components, and route shell require **zero** architectural changes.

---

## 1. Problem Statement

The current homepage is **statically composed**:

| Current anti-pattern | Why it blocks scale |
|---------------------|---------------------|
| `StorefrontHomepage` has boolean flags (`showLatestProducts`, `showDeals`, …) | Admin cannot add/reorder/disable sections without code changes |
| `homepage.service.ts` orchestrates fetches from flags | Service knows section inventory — same problem |
| `store-home-page.tsx` hardcodes section JSX in fixed order | Adding a section type requires editing the page |
| `homepage.json` embeds content blobs at root level | Not aligned with admin “section instance” model |

This is acceptable for a demo storefront. It is **not** acceptable for a Salla/Noon-scale CMS where merchandisers manage 50+ section types from an admin dashboard.

---

## 2. Target Architecture

### 2.1 Data flow (unidirectional)

```text
app/[locale]/store/page.tsx          ← thin route (metadata + loader call)
        ↓
homepage.service.loadPage()          ← orchestration: resolve section data only
        ↓
homepage.repository.getPage()        ← CMS config → normalized section models
        ↓
StoreHomePage                        ← renders sections[] — NO type knowledge
        ↓
HomepageSectionRenderer              ← registry lookup by section.type
        ↓
<section-type>-section.tsx           ← presentation + interaction only
```

### 2.2 Responsibility boundaries

| Layer | Owns | Must NOT own |
|-------|------|--------------|
| **Route** | `generateMetadata`, call `loadPage`, pass result to page | Section logic, fetching |
| **Service** | Per-section data hydration via resolver registry | JSX, section type switches |
| **Repository** | Read CMS, validate, localize, sort, filter `enabled`, normalize arrays | Product/category API calls (except embedded static refs in config) |
| **StoreHomePage** | Map `sections` → `HomepageSectionRenderer` | Section types, conditional blocks |
| **SectionRenderer** | Registry lookup, visibility/theme wrapper | Business rules |
| **Section component** | Render one resolved section model | Fetching, normalization, CMS shape |

### 2.3 Proposed file layout (page capsule)

```text
features/ecommerce/storefront/homepage/
├── components/
│   ├── store-home-page.tsx              # maps sections only
│   ├── homepage-section-renderer.tsx    # registry dispatch + section shell
│   └── sections/
│       ├── hero-carousel-section.tsx
│       ├── category-grid-section.tsx
│       ├── product-carousel-section.tsx
│       ├── features-grid-section.tsx
│       ├── brand-slider-section.tsx
│       ├── banner-section.tsx
│       └── flash-sale-section.tsx       # thin alias over product-carousel OR own type
├── domain/
│   ├── homepage-records.ts              # JSON / API DTO shape (bilingual fields)
│   ├── homepage-models.ts             # Storefront* resolved models
│   ├── homepage-section-types.ts        # SectionType union + config interfaces
│   └── schemas/
│       └── homepage-section.schema.ts   # Zod — validation at repository boundary
├── lib/
│   ├── section-registry.tsx             # type → React component
│   ├── section-data-resolvers.ts        # type → async data hydration
│   ├── mappers/
│   │   └── homepage-mapper.ts           # record → normalized section models
│   └── repositories/
│       └── homepage-repository.ts
├── services/
│   └── homepage.service.ts
└── docs/
    └── homepage-api-contract.md         # backend handoff (section 5 below)
```

> **Migration note:** Existing files (`store-home-page.tsx`, `homepage.service.ts`, etc.) move into this capsule and are rewritten — not duplicated.

---

## 3. Homepage JSON Schema (Temporary CMS)

### 3.1 Root document

```json
{
  "companyId": "demo-company",
  "version": 2,
  "updatedAt": "2026-07-13T12:00:00.000Z",
  "sections": []
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `companyId` | `string` | yes | Tenant scope |
| `version` | `integer` | yes | Optimistic locking for admin saves |
| `updatedAt` | `ISO-8601` | yes | Cache invalidation / preview |
| `sections` | `SectionRecord[]` | yes | May be empty array — never omitted |

### 3.2 Section record (common envelope)

Every section instance shares this envelope. **Admin dashboard edits this shape directly.**

```json
{
  "id": "flash-sale-1",
  "type": "product-carousel",
  "enabled": true,
  "order": 20,
  "title": { "ar": "عروض اليوم", "en": "Today's Deals" },
  "subtitle": { "ar": "لفترة محدودة", "en": "Limited time" },
  "theme": "system",
  "layout": "carousel",
  "visibility": {
    "mobile": true,
    "tablet": true,
    "desktop": true
  },
  "config": {}
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `id` | `string` | yes | Unique within homepage; stable for admin CRUD |
| `type` | `SectionType` | yes | Must exist in section registry |
| `enabled` | `boolean` | yes | `false` → excluded at repository (not passed to UI) |
| `order` | `integer` | yes | Sort ascending; duplicates allowed (stable secondary sort by `id`) |
| `title` | `LocalizableString \| null` | no | CMS copy — resolved at repository |
| `subtitle` | `LocalizableString \| null` | no | CMS copy |
| `theme` | `"light" \| "dark" \| "system"` | yes | Section wrapper applies design tokens |
| `layout` | `string` | yes | Type-specific layout variant (validated per type) |
| `visibility` | `VisibilityConfig` | yes | Responsive show/hide |
| `config` | `object` | yes | Type-specific; validated by Zod per `type` |

```typescript
type LocalizableString = { ar: string; en: string };

type VisibilityConfig = {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
};

type SectionTheme = 'light' | 'dark' | 'system';
```

### 3.3 Full example `homepage.json` (v2)

```json
{
  "companyId": "demo-company",
  "version": 2,
  "updatedAt": "2026-07-13T12:00:00.000Z",
  "sections": [
    {
      "id": "hero-main",
      "type": "hero-carousel",
      "enabled": true,
      "order": 10,
      "title": null,
      "subtitle": null,
      "theme": "system",
      "layout": "full-bleed",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "autoplay": true,
        "intervalMs": 5000,
        "height": "21/7",
        "slides": [
          {
            "id": "slide-1",
            "imageUrl": "https://cdn.example/hero-1.jpg",
            "mobileImageUrl": "https://cdn.example/hero-1-mobile.jpg",
            "title": { "ar": "عروض الأسبوع", "en": "Weekly Deals" },
            "alt": { "ar": "...", "en": "..." },
            "href": "/store/products?tag=deals"
          }
        ]
      }
    },
    {
      "id": "categories-featured",
      "type": "category-grid",
      "enabled": true,
      "order": 20,
      "title": { "ar": "تسوق حسب القسم", "en": "Shop by Category" },
      "subtitle": null,
      "theme": "light",
      "layout": "circles",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "source": "featured",
        "categoryIds": [],
        "limit": 12,
        "columns": { "mobile": 4, "tablet": 6, "desktop": 8 },
        "showLabels": true
      }
    },
    {
      "id": "products-latest",
      "type": "product-carousel",
      "enabled": true,
      "order": 30,
      "title": { "ar": "أحدث المنتجات", "en": "Latest Products" },
      "subtitle": null,
      "theme": "light",
      "layout": "carousel",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "source": "query",
        "productIds": [],
        "categoryId": null,
        "tag": null,
        "sort": "createdAt",
        "sortDirection": "desc",
        "limit": 10,
        "autoplay": false,
        "showPrice": true,
        "showBadge": false,
        "viewAllHref": "/store/products?sort=newest"
      }
    },
    {
      "id": "products-best-sellers",
      "type": "product-carousel",
      "enabled": true,
      "order": 40,
      "title": { "ar": "الأكثر مبيعاً", "en": "Best Sellers" },
      "subtitle": null,
      "theme": "light",
      "layout": "carousel",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "source": "query",
        "productIds": [],
        "categoryId": null,
        "tag": "best-seller",
        "sort": "sales",
        "sortDirection": "desc",
        "limit": 10,
        "autoplay": false,
        "showPrice": true,
        "showBadge": true,
        "viewAllHref": "/store/products?sort=best-sellers"
      }
    },
    {
      "id": "flash-sale",
      "type": "flash-sale",
      "enabled": true,
      "order": 50,
      "title": { "ar": "تخفيضات اليوم", "en": "Flash Sale" },
      "subtitle": { "ar": "ينتهي قريباً", "en": "Ending soon" },
      "theme": "dark",
      "layout": "carousel",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "tag": "deals",
        "limit": 10,
        "endsAt": "2026-07-14T23:59:59.000Z",
        "showCountdown": true,
        "showPrice": true,
        "viewAllHref": "/store/products?tag=deals"
      }
    },
    {
      "id": "trust-features",
      "type": "features-grid",
      "enabled": true,
      "order": 60,
      "title": null,
      "subtitle": null,
      "theme": "light",
      "layout": "four-column",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "items": [
          {
            "id": "feat-delivery",
            "icon": "truck",
            "title": { "ar": "توصيل سريع", "en": "Fast Delivery" },
            "description": { "ar": "...", "en": "..." }
          }
        ]
      }
    },
    {
      "id": "brands-featured",
      "type": "brand-slider",
      "enabled": true,
      "order": 70,
      "title": { "ar": "علامات مميزة", "en": "Featured Brands" },
      "subtitle": null,
      "theme": "light",
      "layout": "slider",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "source": "featured",
        "brandIds": [],
        "limit": 6,
        "showLogo": true,
        "viewAllHref": "/store/brands"
      }
    },
    {
      "id": "promo-banner-mid",
      "type": "banner",
      "enabled": true,
      "order": 55,
      "title": null,
      "subtitle": null,
      "theme": "system",
      "layout": "contained",
      "visibility": { "mobile": true, "tablet": true, "desktop": true },
      "config": {
        "imageUrl": "https://cdn.example/banner.jpg",
        "mobileImageUrl": "https://cdn.example/banner-mobile.jpg",
        "alt": { "ar": "...", "en": "..." },
        "href": "/store/categories/beverages",
        "target": "_self"
      }
    }
  ]
}
```

---

## 4. Section Registry

### 4.1 Design rules

1. **No `switch (section.type)`** in `StoreHomePage` or renderer.
2. Registry is a **plain object map** — same pattern as `MODULE_REGISTRY` in `src/shared/modules/registry.ts`.
3. Unknown types: log in dev, skip in production (never crash the homepage).
4. Adding a section = **register component + register resolver + add Zod schema** — nothing else.

### 4.2 Section type catalog (v1)

| `type` | Component | Data resolver | Notes |
|--------|-----------|---------------|-------|
| `hero-carousel` | `HeroCarouselSection` | none (slides in config) | Static CMS content |
| `category-grid` | `CategoryGridSection` | `resolveCategoryGrid` | Fetches categories by ids/source |
| `product-carousel` | `ProductCarouselSection` | `resolveProductCarousel` | Query or explicit ids |
| `flash-sale` | `FlashSaleSection` | `resolveFlashSale` | Extends product query + countdown |
| `features-grid` | `FeaturesGridSection` | none | Items in config |
| `brand-slider` | `BrandSliderSection` | `resolveBrandSlider` | Fetches brands |
| `banner` | `BannerSection` | none | Static CMS content |

Future types (register only): `video-hero`, `rich-text`, `testimonials`, `instagram-feed`, `countdown`, `multi-banner`, `product-grid`, `collection-tabs`, …

### 4.3 Registry API

```typescript
// lib/section-registry.tsx
import type { ComponentType } from 'react';
import type { ResolvedHomepageSection } from '../domain/homepage-models';

export type HomepageSectionComponentProps<T extends ResolvedHomepageSection = ResolvedHomepageSection> = {
  section: T;
};

export const HOMEPAGE_SECTION_REGISTRY: Record<
  HomepageSectionType,
  ComponentType<HomepageSectionComponentProps>
> = {
  'hero-carousel': HeroCarouselSection,
  'category-grid': CategoryGridSection,
  'product-carousel': ProductCarouselSection,
  'flash-sale': FlashSaleSection,
  'features-grid': FeaturesGridSection,
  'brand-slider': BrandSliderSection,
  'banner': BannerSection,
};

export function getHomepageSectionComponent(type: HomepageSectionType) {
  return HOMEPAGE_SECTION_REGISTRY[type] ?? null;
}
```

### 4.4 Section renderer

```typescript
// components/homepage-section-renderer.tsx
export function HomepageSectionRenderer({ section }: { section: ResolvedHomepageSection }) {
  const Component = getHomepageSectionComponent(section.type);
  if (!Component) return null;

  return (
    <HomepageSectionShell section={section}>
      <Component section={section} />
    </HomepageSectionShell>
  );
}
```

`HomepageSectionShell` applies `theme`, `visibility` (responsive classes), `layout` spacing, and `id` anchor — **shared presentation only**.

### 4.5 Data resolver registry (service layer)

```typescript
// lib/section-data-resolvers.ts
export type SectionDataResolver<T extends HomepageSectionType> = (
  ctx: ResolverContext,
  section: NormalizedHomepageSection<T>,
) => Promise<ResolvedHomepageSection<T>>;

export const SECTION_DATA_RESOLVERS: {
  [K in HomepageSectionType]?: SectionDataResolver<K>;
} = {
  'category-grid': resolveCategoryGrid,
  'product-carousel': resolveProductCarousel,
  'flash-sale': resolveFlashSale,
  'brand-slider': resolveBrandSlider,
};
```

Sections without resolvers pass through with config-only data (hero, banner, features).

### 4.6 StoreHomePage (final shape)

```typescript
export async function StoreHomePage({ page }: { page: StorefrontHomepageView }) {
  return (
    <div className="flex flex-col gap-10">
      <h1 className="sr-only">{page.seoTitle}</h1>
      {page.sections.map((section) => (
        <HomepageSectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
```

**No section names. No conditionals. No data fetching.**

---

## 5. Domain Models

### 5.1 Two-layer type system

| Layer | File | Purpose |
|-------|------|---------|
| **Records** | `homepage-records.ts` | Exact JSON/API shape; `LocalizableString` fields |
| **Models** | `homepage-models.ts` | UI-consumed; all strings resolved; arrays guaranteed |

### 5.2 Normalized section model (post-repository)

```typescript
type HomepageSectionBase = {
  id: string;
  type: HomepageSectionType;
  order: number;
  title: string;           // '' if null in CMS
  subtitle: string;        // '' if null in CMS
  theme: SectionTheme;
  layout: string;
  visibility: VisibilityConfig;
};

// Discriminated union — config narrowed per type
type NormalizedHomepageSection =
  | (HomepageSectionBase & { type: 'hero-carousel'; config: HeroCarouselConfig })
  | (HomepageSectionBase & { type: 'product-carousel'; config: ProductCarouselConfig })
  | ...;
```

### 5.3 Resolved section model (post-service)

```typescript
type ResolvedHomepageSection =
  | (HomepageSectionBase & {
      type: 'hero-carousel';
      config: HeroCarouselConfig;
      data: { slides: StorefrontHeroSlide[] };
    })
  | (HomepageSectionBase & {
      type: 'product-carousel';
      config: ProductCarouselConfig;
      data: { products: StorefrontProduct[]; viewAllHref: `/store${string}` | null };
    })
  | ...;
```

**Rule:** `data` arrays are always `[]`, never `undefined`. Empty sections return `data` with empty arrays; section component decides whether to render null (e.g. hide empty carousel).

### 5.4 Page view model

```typescript
type StorefrontHomepageView = {
  companyId: string;
  version: number;
  updatedAt: string;
  seoTitle: string;        // derived: first hero slide title or company SEO title
  sections: ResolvedHomepageSection[];
};
```

---

## 6. Section Configuration Reference

### 6.1 `hero-carousel`

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `autoplay` | yes | `boolean` | — |
| `intervalMs` | yes | `integer` | 1000–30000 |
| `height` | yes | `string` | Aspect token e.g. `"21/7"`, `"16/9"` |
| `slides` | yes | `HeroSlideRecord[]` | min 1 when enabled |
| `slides[].id` | yes | `string` | unique within section |
| `slides[].imageUrl` | yes | `url` | — |
| `slides[].mobileImageUrl` | no | `url` | falls back to `imageUrl` |
| `slides[].title` | no | `LocalizableString` | — |
| `slides[].alt` | no | `LocalizableString` | defaults to title |
| `slides[].href` | no | `store path` | — |

### 6.2 `category-grid`

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `source` | yes | `"featured" \| "manual"` | — |
| `categoryIds` | if manual | `string[]` | max 24 |
| `limit` | yes | `integer` | 1–24 |
| `columns` | yes | `{ mobile, tablet, desktop }` | 2–12 each |
| `showLabels` | yes | `boolean` | — |

### 6.3 `product-carousel`

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `source` | yes | `"query" \| "manual"` | — |
| `productIds` | if manual | `string[]` | max 24 |
| `categoryId` | no | `string \| null` | — |
| `tag` | no | `string \| null` | — |
| `sort` | yes | `ProductSortField` | — |
| `sortDirection` | yes | `"asc" \| "desc"` | — |
| `limit` | yes | `integer` | 1–24 |
| `autoplay` | yes | `boolean` | — |
| `showPrice` | yes | `boolean` | — |
| `showBadge` | yes | `boolean` | — |
| `viewAllHref` | no | `store path` | — |

### 6.4 `flash-sale`

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `tag` | yes | `string` | — |
| `limit` | yes | `integer` | 1–24 |
| `endsAt` | no | `ISO-8601` | — |
| `showCountdown` | yes | `boolean` | — |
| `showPrice` | yes | `boolean` | — |
| `viewAllHref` | no | `store path` | — |

### 6.5 `features-grid`

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `items` | yes | `FeatureItemRecord[]` | max 8 |
| `items[].icon` | yes | `truck \| shield \| sparkles \| headphones` | extensible enum |

### 6.6 `brand-slider`

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `source` | yes | `"featured" \| "manual"` | — |
| `brandIds` | if manual | `string[]` | max 12 |
| `limit` | yes | `integer` | 1–12 |
| `showLogo` | yes | `boolean` | — |
| `viewAllHref` | no | `store path` | — |

### 6.7 `banner`

| Field | Required | Type | Validation |
|-------|----------|------|------------|
| `imageUrl` | yes | `url` | — |
| `mobileImageUrl` | no | `url` | — |
| `alt` | yes | `LocalizableString` | — |
| `href` | yes | `store path` | — |
| `target` | yes | `"_self" \| "_blank"` | — |

---

## 7. Repository Contract

### 7.1 Interface

```typescript
export const storefrontHomepageRepository = {
  /**
   * Returns a normalized homepage for the given tenant + locale.
   * - Filters enabled sections
   * - Sorts by order ASC, id ASC
   * - Resolves all LocalizableString → string
   * - Validates each section config via Zod
   * - Drops invalid sections (logs error in dev)
   * - NEVER returns null sections array
   */
  getPage(companyId: string, locale: StorefrontLocale): Promise<StorefrontHomepage | null>,
};
```

### 7.2 `StorefrontHomepage` (repository output)

```typescript
type StorefrontHomepage = {
  companyId: string;
  version: number;
  updatedAt: string;
  sections: NormalizedHomepageSection[];  // always array
};
```

### 7.3 Normalization guarantees

| Guarantee | Where |
|-----------|-------|
| `sections` is `[]` not `undefined` | repository |
| Disabled sections excluded | repository |
| Sorted by `order` | repository |
| Localized strings resolved | mapper |
| Invalid sections skipped + logged | repository + Zod |
| No `?.map()` in UI | enforced by contract |

### 7.4 Swap point (JSON → API)

Only `homepage-repository.ts` changes:

```typescript
// Future
getPage: (companyId, locale) =>
  apiRequest<HomepageRecordDto>(`/ecommerce/storefront/homepage`, {
    query: { companyId, locale },
  }).then((dto) => mapHomepageRecord(dto, locale)),
```

Mapper stays if DTO matches record shape. Service, registry, components unchanged.

---

## 8. Service Contract

### 8.1 Interface

```typescript
export async function loadStorefrontHomepage(
  companyId: string,
  locale: StorefrontLocale,
): Promise<StorefrontHomepageView | null>;
```

### 8.2 Algorithm

```text
1. page = await repository.getPage(companyId, locale)
2. if !page → return null
3. sections = await Promise.all(
     page.sections.map(async (section) => {
       const resolver = SECTION_DATA_RESOLVERS[section.type]
       return resolver ? resolver({ companyId, locale }, section) : passthrough(section)
     })
   )
4. return { ...page, sections, seoTitle: deriveSeoTitle(sections, companyConfig) }
```

### 8.3 Resolver rules

- Resolvers call **existing** product/category/brand repositories — never fetch in components.
- Parallelize independent resolvers via `Promise.all`.
- Each resolver returns fully hydrated `data` with empty arrays on miss.
- Resolver failures: section omitted from output + error logged (homepage still renders).

---

## 9. Future Backend API Contract (Documentation Only)

### 9.1 Storefront read

```http
GET /api/ecommerce/storefront/homepage
  ?companyId={uuid}
  &locale=ar|en
```

**Response envelope** (per engineering contract):

```json
{
  "status": "success",
  "message": "Homepage loaded",
  "data": {
    "companyId": "demo-company",
    "version": 2,
    "updatedAt": "2026-07-13T12:00:00.000Z",
    "sections": [ /* SectionRecord[] — same shape as homepage.json */ ]
  },
  "error": null
}
```

**Caching:** `ETag` from `version` + `updatedAt`; `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.

### 9.2 Admin CRUD (future dashboard)

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Get draft + published | `GET` | `/api/ecommerce/admin/homepage` |
| Replace full page | `PUT` | `/api/ecommerce/admin/homepage` |
| Create section | `POST` | `/api/ecommerce/admin/homepage/sections` |
| Update section | `PATCH` | `/api/ecommerce/admin/homepage/sections/{id}` |
| Delete section | `DELETE` | `/api/ecommerce/admin/homepage/sections/{id}` |
| Reorder | `POST` | `/api/ecommerce/admin/homepage/sections/reorder` |
| Duplicate | `POST` | `/api/ecommerce/admin/homepage/sections/{id}/duplicate` |
| Publish | `POST` | `/api/ecommerce/admin/homepage/publish` |

**Reorder payload:**

```json
{
  "orderedSectionIds": ["hero-main", "categories-featured", "products-latest"]
}
```

**Section create payload:** `SectionRecord` without `id` (server generates UUID).

**Validation:** Backend validates per `type` using same rules as frontend Zod schemas (share OpenAPI/JSON Schema spec).

### 9.3 Admin preview

```http
GET /api/ecommerce/storefront/homepage/preview?token={draftToken}&locale=ar
```

Returns same DTO as published homepage. Frontend preview route passes token to repository implementation.

### 9.4 Versioning / optimistic locking

Admin `PUT` / `PATCH` requires `If-Match: {version}` header. `409 Conflict` on stale version — dashboard reloads.

---

## 10. next-intl Compliance

| String source | Rule |
|---------------|------|
| Section `title` / `subtitle` | CMS `LocalizableString` → resolved in repository |
| Hero slide titles, banner alt, feature copy | CMS — same |
| UI chrome (`viewAll`, `addToCart`, carousel a11y) | `getTranslations('storefront')` in section components |
| Dates (flash sale countdown) | `useFormatter` / `getFormatter` |
| Prices | `getFormatter` / `useFormatter` |

**No** `getTranslations()` for CMS merchandising copy — that content is tenant-owned and locale-keyed in CMS, not in `messages/*.json`.

**No** custom `formatStorefront*` helpers.

---

## 11. Theme Support

### 11.1 Section-level theme

```typescript
type SectionTheme = 'light' | 'dark' | 'system';
```

`HomepageSectionShell` maps theme → wrapper classes:

| Theme | Wrapper |
|-------|---------|
| `light` | `bg-background text-foreground` |
| `dark` | `dark bg-card text-card-foreground` (local dark island) |
| `system` | inherit from document / `prefers-color-scheme` via CSS |

**No hardcoded colors.** Only design tokens: `bg-background`, `bg-card`, `text-foreground`, `border-border`, `shadow-soft`, etc.

### 11.2 Layout variants

`layout` is a **string token** validated per section type. Components map layout → composition (e.g. `category-grid` + `circles` vs `cards`).

---

## 12. Engineering Contract Verification

| Rule | Compliance |
|------|------------|
| Page capsule mirrors route | `features/.../homepage/` |
| Thin `app/` route | Unchanged — calls `loadStorefrontHomepage` only |
| Repository per page | `homepage-repository.ts` in capsule |
| Service only when orchestration needed | Resolvers hydrate cross-repo data |
| Components never call APIs | Section components receive `section` prop only |
| TanStack Query not required for SSR homepage | RSC + service load (documented exception) |
| Normalize once in repository | Zod + mapper |
| No `?.map()` in components | Arrays guaranteed on models |
| next-intl for UI chrome | Section components |
| Zod validation at boundary | `homepage-section.schema.ts` |
| Discriminated unions | `NormalizedHomepageSection`, `ResolvedHomepageSection` |
| Extensibility without homepage edits | Registry pattern |
| RTL | Section shell uses `start`/`end`; CMS does not encode direction |

---

## 13. Migration Plan (Current → v2)

| Current | v2 equivalent |
|---------|---------------|
| `heroSlides[]` at root | `section.type = hero-carousel` |
| `showFeaturedCategories` | `section.type = category-grid` |
| `showLatestProducts` | `section.type = product-carousel` (sort newest) |
| `showBestSellers` | `section.type = product-carousel` (tag best-seller) |
| `showDeals` | `section.type = flash-sale` |
| `features[]` at root | `section.type = features-grid` |
| `showFeaturedBrands` | `section.type = brand-slider` |
| `homepage.service` flag orchestration | Resolver registry |
| `store-home-page` conditionals | `sections.map(HomepageSectionRenderer)` |

**Deprecate:** `StorefrontHomepage` flat model, `StoreHomePageData` with parallel arrays, boolean flags in `HomepageConfig`.

---

## 14. Implementation Phases (After Approval)

### Phase A — Foundation (no visual change)
1. Create `homepage/` capsule structure
2. Define records, models, Zod schemas
3. Rewrite `homepage.json` to v2
4. Rewrite repository + mapper
5. Implement registry + renderer shell

### Phase B — Section extraction
6. Extract each section from current `store-home-page.tsx` into `sections/*`
7. Implement data resolvers
8. Rewrite `homepage.service.ts`
9. Reduce `StoreHomePage` to map-only

### Phase C — Verification
10. Unit tests: mapper, Zod, resolvers, registry
11. Visual parity check (ar + en)
12. Confirm backend swap requires repository-only change

---

## 15. Open Questions (Resolve Before Implementation)

1. **`flash-sale` vs `product-carousel`** — Separate type (recommended for countdown UX) or `product-carousel` + `layout: flash-sale`?
2. **Empty section behavior** — Hide silently vs show empty state component?
3. **Preview mode** — Separate `/store/preview?token=` route now or defer until admin exists?
4. **Section error boundary** — Per-section `ErrorBoundary` so one bad section does not break homepage?

---

## 16. Approval Gate

Implementation starts **only after**:

- [ ] This design approved
- [ ] Open questions resolved
- [ ] Section type catalog for v1 confirmed

**Explicitly out of scope until architecture lands:** new homepage visuals, additional section designs, admin UI.
