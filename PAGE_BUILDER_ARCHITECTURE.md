# Page Builder Engine — Architecture (Approved + Implemented v1)

**Status:** Implemented (homepage first consumer) + Section Definition System  
**Supersedes:** `HOMEPAGE_CMS_ARCHITECTURE.md` (homepage-only draft)

---

## Overview

The **Page Builder Engine** is a generic, CMS-driven composition system. The **homepage** is the first consumer; the same engine will power category landings, brand pages, campaigns, offers, and custom CMS pages.

```text
Route (thin)
  → page.service.loadStorefrontPage(companyId, pageType, locale)
    → page.repository.getByPageType()
      → StorefrontPage (normalized sections)
    → section-data-resolvers (hydrate entities)
      → StorefrontPageView (resolved sections)
  → StoreHomePage (homepage consumer)
    → StorefrontPage
      → SectionRenderer (registry)
        → <type>-section.tsx
```

**Swap criterion:** Only `page-repository.ts` changes when JSON → API.

---

## Approved Design Improvements

| Requirement | Implementation |
|-------------|----------------|
| Generic page builder | `features/ecommerce/storefront/page-builder/` |
| Section registry (no switch in pages) | `section-renderer.tsx` → `lib/section-registry.tsx` |
| Self-describing section definitions | `definitions/*.definition.ts` + `lib/section-definition-registry.ts` |
| Typed layout enums | `domain/layout-types.ts` + Zod `z.enum()` per section |
| Strongly typed configs | `domain/section-types.ts` per-type `*Config` |
| `schemaVersion` + `contentVersion` | On `PageRecord` |
| UUID section/page ids | Enforced in Zod schemas |
| Section metadata | `SectionMetadata` on every section |
| content / settings / style / dataSource | Separated on every section record |
| Data source abstraction | `domain/data-source.ts` |
| Repository normalization | `page-mapper.ts` + Zod at repository |
| next-intl UI chrome | Section components; CMS copy in JSON |

---

## File Layout

```text
page-builder/
├── domain/
│   ├── page-types.ts
│   ├── page-records.ts
│   ├── page-models.ts
│   ├── section-types.ts      # typed configs per section
│   ├── section-definition.ts # SectionDefinition, FieldDefinition, capabilities
│   ├── layout-types.ts       # strongly typed layout enums per section
│   ├── section-metadata.ts
│   ├── section-style.ts
│   └── data-source.ts
├── definitions/
│   ├── index.ts
│   ├── shared/field-builders.ts
│   └── *.definition.ts       # one file per section type
├── schemas/page.schema.ts
├── docs/section-definition-backend-contract.md
├── lib/
│   ├── mappers/page-mapper.ts
│   ├── repositories/page-repository.ts
│   ├── section-data-resolvers.ts
│   ├── section-definition-registry.ts
│   ├── section-registry.tsx
│   └── mock/pages/homepage.json
├── services/page.service.ts
├── components/
│   ├── storefront-page.tsx   # unchanged when adding sections
│   ├── section-renderer.tsx
│   ├── section-shell.tsx
│   └── sections/*.tsx
└── __tests__/
    ├── page-mapper.test.ts
    └── section-definition-registry.test.ts
```

---

## Page Record Shape

```json
{
  "id": "<uuid>",
  "companyId": "demo-company",
  "pageType": "homepage",
  "slug": "home",
  "displayName": { "ar": "...", "en": "..." },
  "schemaVersion": 1,
  "contentVersion": 1,
  "status": "published",
  "sections": [ /* SectionRecord[] */ ]
}
```

## Section Record Shape

```json
{
  "id": "<uuid>",
  "type": "product-carousel",
  "status": "published",
  "enabled": true,
  "order": 30,
  "revision": 1,
  "createdAt": "...",
  "updatedAt": "...",
  "publishedAt": "...",
  "createdBy": null,
  "updatedBy": null,
  "content": { },
  "settings": { },
  "style": { "theme": "light", "layout": "carousel", "visibility": {} },
  "dataSource": { "kind": "query", "sort": "createdAt", ... }
}
```

---

## v1 Section Types

`hero-carousel` · `category-grid` · `product-carousel` · `flash-sale` · `features-grid` · `brand-slider` · `banner`

---

## Future Page Types (same engine)

`category-landing` · `brand-page` · `campaign` · `offer` · `custom`

Add JSON + `page.repository` index entry — no UI changes.

---

## Adding a New Section

1. Create `definitions/{type}.definition.ts` (fields, capabilities, defaults)
2. Create `components/sections/{type}-section.tsx`
3. Register in `lib/section-definition-registry.ts` and `lib/section-registry.tsx`
4. Add layout enum + types + Zod schema
5. Add JSON section config to page mock/API

**Do not change** `storefront-page.tsx`.

---

## Backend API (documentation)

`GET /api/ecommerce/storefront/pages/:pageType?companyId=&locale=`  
Returns `PageRecord` envelope. Admin CRUD documented in original spec §9.
