# Website ↔ Dashboard Mirror Mapping

**Status:** Review document — do **not** implement until this mapping is approved.  
**Philosophy:** The Website defines what exists. The Dashboard edits what exists. Nothing more. Nothing less.  
**Frontend SoT:** `src/features/ecommerce/storefront/page-builder/`  
**Existing admin shell:** `/cms/homepage` (definition-driven editors already started)

---

## 0. Operating rules (non-negotiable)

| Rule | Meaning |
|------|---------|
| **Mirror Principle** | Every editable Website property → one schema field → one Dashboard control. |
| **No invented Dashboard pages** | Do not add CMS screens that do not edit a Website surface. |
| **No invented forms** | Editors come from `SectionDefinition.fields[]`, not hand-built forms. |
| **One order system** | `section.order` on the page record is the only layout order. Dashboard reorder = Website reorder. |
| **One shared model** | `SectionRecord` / Zod schema / Definition / Renderer share the same shape. |
| **Backend-ready** | Every Dashboard field maps 1:1 to a future DTO field. |

### Shared metadata (every section)

```ts
SectionMetadata {
  id: uuid
  status: 'draft' | 'published' | 'archived'
  enabled: boolean
  order: integer          // sole ordering key
  revision: integer
  createdAt / updatedAt / publishedAt
  createdBy / updatedBy
}
```

### Shared style core (every section)

```ts
SectionStyleCore {
  theme: 'light' | 'dark' | 'system'
  layout: <section-specific enum>
  visibility: { mobile: boolean; tablet: boolean; desktop: boolean }
}
```

### Page-level draft / publish (all sections)

| Behavior | Rule |
|----------|------|
| **Draft** | Edits increase `revision`; `status` may stay `draft` until publish. |
| **Publish** | Page `status → published`, `publishedAt` set; Website reads published snapshot only. |
| **Preview** | Dashboard preview = same Renderer as Website, fed draft section payload (no second renderer). |
| **Enable toggle** | `enabled: false` hides section on Website without deleting it. |

---

## 1. Canonical section inventory (Website SoT)

| # | Website component | Definition id | Shared model | Dashboard editor |
|---|-------------------|---------------|--------------|------------------|
| 1 | `HeroCarousel` / `hero-carousel-section.tsx` | `hero-carousel` | `HeroCarouselSectionRecord` | Hero Carousel Editor |
| 2 | `CategoryGridSection` | `category-grid` | `CategoryGridSectionRecord` | Category Grid Editor |
| 3 | `ProductCarouselSection` | `product-carousel` | `ProductCarouselSectionRecord` | Product Carousel Editor |
| 4 | `FlashSaleSection` | `flash-sale` | `FlashSaleSectionRecord` | Flash Sale Editor |
| 5 | `FeaturesGridSection` | `features-grid` | `FeaturesGridSectionRecord` | Features Grid Editor |
| 6 | `BrandSliderSection` | `brand-slider` | `BrandSliderSectionRecord` | Brand Slider Editor |
| 7 | `BannerSection` | `banner` | `BannerSectionRecord` | Banner Editor |

**Do not invent additional section types** until a Website surface exists that needs them.

---

## 2. Section-by-section mapping

Legend for **Website usage**:
- ✅ Rendered today on Website
- ⚠️ In schema / definition but **not** currently rendered (Mirror gap — decide keep+render or remove)
- 🔮 Proposed Mirror field that Website should gain before Dashboard exposes it

---

### 2.1 Hero Carousel

| Aspect | Value |
|--------|--------|
| **Website Component** | `components/catalog/hero-carousel.tsx` via `hero-carousel-section.tsx` |
| **Shared Domain Model** | `HeroCarouselSectionRecord` (`type: 'hero-carousel'`) |
| **Dashboard Editor** | Generated from `HERO_CAROUSEL_DEFINITION.fields` |
| **Schema id** | `storefront.section.hero-carousel.v1` |

#### Editable fields

| Field path | Type | Website | Validation | Editor control |
|------------|------|---------|------------|----------------|
| `content.title` | `LocalizableString \| null` | ⚠️ section heading (currently not shown) | optional | localized-text |
| `content.subtitle` | `LocalizableString \| null` | ⚠️ | optional | localized-textarea |
| `content.slides[]` | slide list | ✅ images + href | min 1 slide | slide-list |
| `content.slides[].id` | uuid | ✅ | required | (list key) |
| `content.slides[].imageUrl` | url | ✅ desktop/main | required url | image |
| `content.slides[].mobileImageUrl` | url? | ✅ | optional url | image |
| `content.slides[].title` | LocalizableString? | ⚠️ overlay removed from UI | optional | localized-text |
| `content.slides[].alt` | LocalizableString? | ✅ a11y | optional | localized-text |
| `content.slides[].href` | `/store…`? | ✅ whole-slide link | store-path | store-path |
| `settings.autoplay` | boolean | ✅ | required | boolean |
| `settings.intervalMs` | number | ✅ | 1000–30000 | number |
| `style.layout` | `full-bleed \| contained` | ✅ | enum | layout |
| `style.height` | string (e.g. `21/7`) | ✅ aspect ratio | required | text/number ratio |
| `style.theme` | theme enum | ⚠️ limited visual effect | enum | theme |
| `style.visibility.*` | boolean | ✅ SectionShell | required | visibility |
| `dataSource` | `{ kind: 'manual' }` | n/a (slides are content) | kind=manual | data-source |
| metadata `order` / `enabled` / `status` | — | ✅ | required | page builder chrome |

#### Mirror decisions required before build

1. **Section title/subtitle:** either restore on Website, or drop from definition (`supportsTitle: false`).
2. **Slide title:** either restore overlay CTA caption on Website, or remove from slide schema/editor.
3. **CTA label:** Website uses fixed `hero.shopNow` i18n — **not** an editable field unless Website adds `slides[].ctaLabel`.

#### JSON structure

```json
{
  "id": "uuid",
  "type": "hero-carousel",
  "status": "published",
  "enabled": true,
  "order": 10,
  "revision": 1,
  "content": {
    "title": null,
    "subtitle": null,
    "slides": [
      {
        "id": "uuid",
        "imageUrl": "https://…",
        "mobileImageUrl": "https://…",
        "title": { "ar": "…", "en": "…" },
        "alt": { "ar": "…", "en": "…" },
        "href": "/store/products"
      }
    ]
  },
  "settings": { "autoplay": true, "intervalMs": 5000 },
  "style": {
    "theme": "system",
    "layout": "full-bleed",
    "height": "21/7",
    "visibility": { "mobile": true, "tablet": true, "desktop": true }
  },
  "dataSource": { "kind": "manual", "entityIds": [] }
}
```

#### Future Backend DTO

`HeroCarouselSectionDto` — same shape as JSON above + `SectionMetadata` timestamps/actors.

#### Preview / draft-publish

- Preview: `HeroCarousel` renderer with draft slides.
- Publish: include section in published page snapshot ordered by `order`.

---

### 2.2 Category Grid

| Aspect | Value |
|--------|--------|
| **Website Component** | `category-grid-section.tsx` |
| **Shared Domain Model** | `CategoryGridSectionRecord` |
| **Dashboard Editor** | Category Grid Editor ← definition fields |
| **Schema id** | `storefront.section.category-grid.v1` |

#### Editable fields

| Field path | Type | Website | Validation | Control |
|------------|------|---------|------------|---------|
| `content.title` | LocalizableString | ✅ | required | localized-text |
| `content.subtitle` | LocalizableString \| null | ✅ | optional | localized-textarea |
| `settings.showLabels` | boolean | ✅ | required | boolean |
| `settings.columns.mobile/tablet/desktop` | 2–12 | ✅ grid density | min/max | column-grid |
| `style.layout` | `circles \| cards \| list` | ✅ | enum | layout |
| `style.theme` | theme | ✅ | enum | theme |
| `style.visibility.*` | boolean | ✅ | required | visibility |
| `dataSource` | manual \| collection \| query | ✅ resolves categories | discriminated union | data-source |
| `order` / `enabled` | — | ✅ | required | chrome |

#### Not on Website (do not invent in Dashboard)

- Free-form “spacing” token — only exists via layout/columns today.
- “View all” link — **not** in current schema (unlike product carousel). Add only if Website gains `content.viewAllHref`.

#### JSON structure

```json
{
  "type": "category-grid",
  "order": 20,
  "content": {
    "title": { "ar": "تسوق حسب القسم", "en": "Shop by Category" },
    "subtitle": null
  },
  "settings": {
    "showLabels": true,
    "columns": { "mobile": 4, "tablet": 6, "desktop": 8 }
  },
  "style": {
    "theme": "light",
    "layout": "circles",
    "visibility": { "mobile": true, "tablet": true, "desktop": true }
  },
  "dataSource": { "kind": "collection", "collectionId": "featured-categories", "limit": 12 }
}
```

#### Future Backend DTO

`CategoryGridSectionDto` — identical.

#### Preview / draft-publish

Preview resolves `dataSource` → categories → same Category Grid renderer.

---

### 2.3 Product Carousel

| Aspect | Value |
|--------|--------|
| **Website Component** | `product-carousel-section.tsx` → `ProductCarousel` |
| **Shared Domain Model** | `ProductCarouselSectionRecord` |
| **Dashboard Editor** | Product Carousel Editor |
| **Schema id** | `storefront.section.product-carousel.v1` |

#### Editable fields

| Field path | Type | Website | Validation | Control |
|------------|------|---------|------------|---------|
| `content.title` | LocalizableString | ✅ (e.g. الأكثر مبيعاً) | required | localized-text |
| `content.subtitle` | LocalizableString \| null | ✅ | optional | localized-textarea |
| `content.viewAllHref` | `/store…` \| null | ✅ | store-path | store-path |
| `settings.autoplay` | boolean | ⚠️ schema only (scroll carousel, not timed) | required | boolean |
| `settings.showPrice` | boolean | ⚠️ always priced today | required | boolean |
| `settings.showBadge` | boolean | ✅ promo badges | required | boolean |
| `style.layout` | `carousel \| grid` | ✅ | enum | layout |
| `style.theme` | theme | ✅ | enum | theme |
| `style.visibility.*` | boolean | ✅ | required | visibility |
| `dataSource` | manual \| query \| tag \| category \| collection \| recommendation | ✅ | union | data-source |
| `order` / `enabled` | — | ✅ | required | chrome |

#### Mirror gaps (approve before Dashboard shows)

| Gap | Action |
|-----|--------|
| `settings.autoplay` | Wire autoplay on carousel **or** remove from definition. |
| `settings.showPrice` | Honor flag in `ProductCard` **or** remove. |
| Navigation arrows | Website behavior: desktop + hover only — not a CMS field (UX rule, not content). |
| Columns | Grid columns are hardcoded in section (`mobile: 2…`) — 🔮 promote to `settings.columns` only if Website becomes configurable. |

#### JSON structure

```json
{
  "type": "product-carousel",
  "order": 40,
  "content": {
    "title": { "ar": "الأكثر مبيعاً", "en": "Best Sellers" },
    "subtitle": null,
    "viewAllHref": "/store/products?tag=best-seller"
  },
  "settings": { "autoplay": false, "showPrice": true, "showBadge": true },
  "style": {
    "theme": "light",
    "layout": "carousel",
    "visibility": { "mobile": true, "tablet": true, "desktop": true }
  },
  "dataSource": { "kind": "tag", "tag": "best-seller", "limit": 12 }
}
```

#### Future Backend DTO

`ProductCarouselSectionDto` — identical + resolved products only at read-time API if needed (`data.products` not stored).

#### Preview / draft-publish

Preview must call same data resolvers as Website so tag/query/manual match production.

---

### 2.4 Flash Sale

| Aspect | Value |
|--------|--------|
| **Website Component** | `flash-sale-section.tsx` |
| **Shared Domain Model** | `FlashSaleSectionRecord` |
| **Dashboard Editor** | Flash Sale Editor |
| **Schema id** | `storefront.section.flash-sale.v1` |

#### Editable fields

| Field path | Website | Validation | Control |
|------------|---------|------------|---------|
| `content.title` | ✅ | required | localized-text |
| `content.subtitle` | ✅ | optional | localized-textarea |
| `content.viewAllHref` | ✅ | store-path | store-path |
| `settings.showPrice` | ⚠️ | boolean | boolean |
| `settings.showCountdown` | ⚠️ (off in mock) | boolean | boolean |
| `settings.endsAt` | ⚠️ | datetime \| null | datetime |
| `style.layout` | `carousel \| grid \| highlight` ✅ | enum | layout |
| `style.theme` | ✅ (often dark) | enum | theme |
| `style.visibility.*` | ✅ | required | visibility |
| `dataSource` | tag \| query only ✅ | union | data-source |
| `order` / `enabled` | ✅ | required | chrome |

#### Mirror gaps

- Honor `showCountdown` + `endsAt` in Website UI before treating them as required CMS features.

#### JSON / DTO

Same pattern as product-carousel + flash-sale settings; DTO name `FlashSaleSectionDto`.

---

### 2.5 Features Grid

| Aspect | Value |
|--------|--------|
| **Website Component** | `features-grid-section.tsx` → `HomepageFeaturesSection` |
| **Shared Domain Model** | `FeaturesGridSectionRecord` |
| **Dashboard Editor** | Features Grid Editor |
| **Schema id** | `storefront.section.features-grid.v1` |

#### Editable fields

| Field path | Website | Validation | Control |
|------------|---------|------------|---------|
| `content.title` | ⚠️ optional heading | optional | localized-text |
| `content.subtitle` | ⚠️ | optional | localized-textarea |
| `content.items[]` | ✅ icons/copy | max 8; icon enum | feature-list |
| `content.items[].icon` | ✅ | `truck\|shield\|sparkles\|headphones` | icon-picker |
| `content.items[].title/description` | ✅ | required localized | inside feature-list |
| `settings.columns.*` | ⚠️ layout enum used more than columns | 1–4 | column-grid |
| `style.layout` | `two\|three\|four-column` ⚠️ under-applied | enum | layout |
| `style.theme` / `visibility` | partial | — | theme / visibility |
| `dataSource` | manual | entityIds unused if items are content | data-source |
| `order` / `enabled` | ✅ | — | chrome |

#### Mirror gaps

Renderer currently underuses `style.layout` / `settings.columns` — **fix Website first**, then expose Dashboard controls.

---

### 2.6 Brand Slider

| Aspect | Value |
|--------|--------|
| **Website Component** | `brand-slider-section.tsx` |
| **Shared Domain Model** | `BrandSliderSectionRecord` |
| **Dashboard Editor** | Brand Slider Editor |
| **Schema id** | `storefront.section.brand-slider.v1` |

#### Editable fields

| Field path | Website | Validation | Control |
|------------|---------|------------|---------|
| `content.title` | ✅ | required | localized-text |
| `content.subtitle` | ✅ | optional | localized-textarea |
| `content.viewAllHref` | ✅ | store-path | store-path |
| `settings.showLogo` | ✅ | boolean | boolean |
| `style.layout` | `slider \| grid` ✅ | enum | layout |
| `style.theme` / `visibility` | ✅ | — | theme / visibility |
| `dataSource` | manual \| collection ✅ | union | data-source |
| `order` / `enabled` | ✅ | — | chrome |

#### JSON / DTO

`BrandSliderSectionDto` — same shape; resolved `brands` at read time.

---

### 2.7 Banner

| Aspect | Value |
|--------|--------|
| **Website Component** | `banner-section.tsx` → `PromoBanner` |
| **Shared Domain Model** | `BannerSectionRecord` |
| **Dashboard Editor** | Banner Editor |
| **Schema id** | `storefront.section.banner.v1` |

#### Editable fields (current Website model)

| Field path | Website | Validation | Control |
|------------|---------|------------|---------|
| `content.imageUrl` | ✅ | required url | image |
| `content.mobileImageUrl` | ✅ | optional url | image |
| `content.alt` | ✅ | LocalizableString | localized-text |
| `content.href` | ✅ | store-path | store-path |
| `content.target` | ✅ | `_self \| _blank` | link-target |
| `style.layout` | `contained \| full-bleed \| split` ✅ | enum | layout |
| `style.theme` / `visibility` | ✅ | — | theme / visibility |
| `dataSource` | manual | — | data-source |
| `order` / `enabled` | ✅ | — | chrome |

#### Explicitly **out of scope** until Website supports them

Do **not** invent Dashboard fields for: schedule/start-end, overlay, button label, banner title/subtitle — unless Website gains those properties first (your example list is aspirational; current Website `PromoBanner` does not render them).

#### JSON / DTO

```json
{
  "type": "banner",
  "order": 60,
  "content": {
    "imageUrl": "https://…",
    "mobileImageUrl": "https://…",
    "alt": { "ar": "…", "en": "…" },
    "href": "/store/products",
    "target": "_self"
  },
  "settings": {},
  "style": {
    "theme": "light",
    "layout": "contained",
    "visibility": { "mobile": true, "tablet": true, "desktop": true }
  },
  "dataSource": { "kind": "manual", "entityIds": [] }
}
```

`BannerSectionDto` — identical.

---

## 3. Page-level model (Homepage)

| Website | Shared model | Dashboard |
|---------|--------------|-----------|
| Homepage composed of ordered sections | `PageRecord` (`pageType: 'homepage'`) | Homepage Page Builder (`/cms/homepage`) |

### Page JSON (abridged)

```json
{
  "id": "uuid",
  "companyId": "uuid",
  "pageType": "homepage",
  "slug": "home",
  "displayName": { "ar": "الرئيسية", "en": "Home" },
  "schemaVersion": 1,
  "contentVersion": 1,
  "status": "published",
  "sections": [ /* ordered by section.order */ ]
}
```

### Section order (single system)

```
Dashboard drag-reorder
        ↓
section.order rewrite (unique, contiguous)
        ↓
Website Homepage renderer sorts by order
```

**Forbidden:** separate “nav order”, “displayOrder” on page, or hard-coded section sequence in React.

### Preview behavior

| Mode | Data | Renderer |
|------|------|----------|
| Live Website | published `PageRecord` | section-registry |
| Dashboard Preview | draft `PageRecord` | **same** section-registry |
| Section dialog | draft section fragment | same typed section component |

### Draft / publish behavior

1. Edit → validate against section Zod schema.  
2. Save draft → bump `contentVersion` / section `revision`.  
3. Publish → atomic page publish; Website switches snapshot.  
4. Archive section → `status: archived` or remove from page array (pick one convention and stick to it).

---

## 4. Dynamic form pipeline (target, already partially live)

```
SectionDefinition
   → fields[]
   → SectionDefinitionFields (control → widget)
   → Section Edit Dialog
   → Zod validate
   → PageRecord.sections[i]
   → Website Renderer
```

| Control | Used by | Implement widget? |
|---------|---------|-------------------|
| localized-text / textarea | titles | ✅ exists |
| boolean / number | settings | ✅ exists |
| theme / layout / visibility | style | ✅ exists |
| data-source | data | ✅ exists |
| slide-list | hero | ✅ exists |
| feature-list | features | ✅ exists |
| image / url / store-path / datetime | various | ✅ / partial |
| column-grid | category / features | ⚠️ falls back to text — improve before Mirror lock |
| category/product/brand pickers | dataSource.manual | ⚠️ not specialized yet |

**Rule:** new fields = add to Definition + Zod + Website consumption. Never add a Dashboard-only widget field.

---

## 5. Cross-cutting Mirror gaps (fix before implementation)

| # | Gap | Why it violates Mirror | Recommended decision |
|---|-----|------------------------|----------------------|
| G1 | Hero section/slide titles in schema but not rendered | Dashboard would edit invisible content | Restore Website UI **or** remove fields |
| G2 | Product `autoplay` / `showPrice` under-honored | Editor ≠ Website | Wire or drop |
| G3 | Flash countdown under-honored | Same | Wire or drop |
| G4 | Features layout/columns under-applied | Same | Wire Website |
| G5 | Banner schedule/CTA/title in “dream list” | Invented Dashboard | Block until Website has them |
| G6 | Product grid columns hardcoded | Dashboard cannot mirror | Add `settings.columns` to Website first |

---

## 6. Global chrome that **is** Website-editable (separate from sections)

Only map if a Website surface exists:

| Website surface | Proposed editor | Notes |
|-----------------|-----------------|-------|
| Header / footer links | Navigation CMS (`/cms/navigation`) | Already present — keep Mirror to storefront nav config |
| Company theme colors | Settings | Feeds CSS vars on storefront shell |
| Legal / FAQ / About / Blog | Content CMS | Content pages, not homepage sections |

Do **not** invent unrelated “marketing tools” pages.

---

## 7. Future backend DTO checklist

Backend engineer should generate OpenAPI/DTOs **directly** from:

1. `schemas/page.schema.ts` (Zod)  
2. `docs/section-definition-backend-contract.md`  
3. This mapping’s per-section JSON  

| DTO | Maps to |
|-----|---------|
| `PageDto` | Homepage / landing page record |
| `HeroCarouselSectionDto` | §2.1 |
| `CategoryGridSectionDto` | §2.2 |
| `ProductCarouselSectionDto` | §2.3 |
| `FlashSaleSectionDto` | §2.4 |
| `FeaturesGridSectionDto` | §2.5 |
| `BrandSliderSectionDto` | §2.6 |
| `BannerSectionDto` | §2.7 |
| `PublishPageRequest` | draft → published |

Resolved catalog payloads (`products`, `categories`, `brands`) are **read models**, not stored CMS fields.

---

## 8. Deliverable sign-off gate

Implementation of Dashboard CMS (beyond current `/cms/homepage`) may begin only after approving:

1. [ ] Section list is complete (these 7 only).  
2. [ ] Decisions on Mirror gaps G1–G6.  
3. [ ] Agreement: Definition → Form Generator is the only editor path.  
4. [ ] Agreement: single `order` field owns Website layout.  
5. [ ] Backend DTOs will copy this document’s JSON shapes.

---

## 9. Clarification on recent UI work

| You asked | Correct Mirror interpretation |
|-----------|-------------------------------|
| Remove title/description from **top** carousel | Hero **overlay** copy (done) |
| Keep titles on عروض / الأكثر مبيعاً | Product/Flash **section** `content.title` (restored) |
| L/R arrows on big screens + hover | Website UX rule, **not** a CMS field |

---

*Document generated from live page-builder definitions, Zod schemas, renderers, and `/cms/homepage` — pending human review before implementation.*
