# Ecommerce UX Blueprint

**Status:** Draft for approval — implementation follows blueprint sign-off  
**Scope:** Public storefront (`/store/**`) only — admin dashboard unchanged  
**Engineering foundation:** Approved — Repository pattern + Static CMS retained  
**Localization:** next-intl (ar / en) — sole storefront i18n layer  
**Design reference:** [Ekleel Abha](https://www.ekleelabha.com/ar) — patterns adopted, not copied  

---

## 0. Design Reference — Ekleel Abha (Approved Direction)

**Reference site:** [ekleelabha.com/ar](https://www.ekleelabha.com/ar)  
**Reference pages reviewed:**

| Page | URL | What we adopt |
|------|-----|---------------|
| Homepage | `/ar` | Two-tier header, hero carousel, category circles, product carousels, brand strip, mega footer |
| Best sellers | `/ar/products/best-sellers` | Curated PLP layout, same card + filter patterns |
| Category PLP | `/ar/categories/392` | Sidebar filters, sort bar, dense 5-col grid, breadcrumbs |
| Cart | `/ar/cart` | Line-item cart (placeholder until checkout backend) |
| Wishlist | `/ar/wishlist` | Saved-products grid reusing product card |
| Mega menu | (screenshot) | L1 category list + L2 subcategory panel |

**Important:** We adopt **UX structure and interaction patterns** from Ekleel Abha. We do **not** copy their logo, exact colors, imagery, or proprietary assets. Our brand uses existing design tokens (forest teal + gold).

**Product domain shift:** Reference is pharmacy/beauty; **our store sells consumables** — groceries, beverages, snacks, bakery, dairy, frozen, cleaning, household. Same UX patterns apply; category tree and mock content change.

### 0.1 Header (Two-Tier — Match Reference)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TEAL BAR (bg-primary)                                                    │
│  [♡ Wishlist] [🛒 Cart+n] [👤 Login] [AR▾]     [════ Search ════]  [Logo] │
├─────────────────────────────────────────────────────────────────────────┤
│ WHITE SUB-NAV                                                            │
│  [🎁 منطقة العروض]     العلامات | الأكثر مبيعاً | وصل حديثاً    [☰ الفئات] │
└─────────────────────────────────────────────────────────────────────────┘
```

| Element | Reference behavior | Our implementation |
|---------|-------------------|-------------------|
| Search | Full-width pill, centered, always visible | `StoreSearchBar` in header (desktop); overlay on mobile |
| Wishlist | Heart icon + badge count | Placeholder route `/store/wishlist` — UI only, local state until backend |
| Cart | Cart icon + badge count | Placeholder route `/store/cart` — UI only until checkout phase |
| Login | Text + icon button | Disabled/placeholder with tooltip "قريباً" |
| Locale | AR + flag dropdown | `StoreLocaleSwitcher` (existing) |
| Sub-nav links | Brands, Best Sellers, New Arrivals, Offers | CMS-driven `navigation.secondary[]` |
| Categories | Hamburger + "الفئات" opens mega menu | `StoreMegaMenu` component |

### 0.2 Mega Menu (Match Reference Screenshot)

```
┌──────────────────┬────────────────────────────────────────┐
│ مزيل عرق      ◀ │  مزيل عرق                              │
│ التسوق حسب...  │  ─────────────────────────────────     │
│ مكملات غذائية  │  • مزيل عرق رول                        │
│ العناية بالرجل │  • مزيل عرق ستيك                       │
│ ... (scroll)   │  • مزيل عرق بخاخ                       │
│ [teal active]  │  • مزيل عرق كريمي                      │
└──────────────────┴────────────────────────────────────────┘
```

- **L1 (right column in RTL):** Top-level categories from repository tree; active item = teal fill
- **L2 (left panel):** Subcategories of hovered/active L1; links to category PLP
- **Data:** `categories` repository (`parentId` tree) — no hardcoded category names in component
- **Mobile:** Full-screen sheet with accordion (L1 expands to L2)

**Our consumables L1 examples (mock CMS):** مشروبات · وجبات خفيفة · مخبوزات · ألبان وأجبان · مجمدات · بقالة · تنظيف · عناية شخصية

### 0.3 Homepage Sections (Match Reference Screenshot)

CMS-driven section order (see §4):

| # | Section | Reference |
|---|---------|-----------|
| 1 | `hero_carousel` | Full-width promo banners (swipeable) |
| 2 | `category_circles` | Horizontal scroll of circular category thumbnails |
| 3 | `product_carousel` | "وصل حديثاً" — New arrivals |
| 4 | `product_carousel` | "الأكثر مبيعاً" — Best sellers |
| 5 | `product_carousel` | "عروض اليوم" — Deals with % badge |
| 6 | `brand_strip` | Grayscale brand logos carousel |

### 0.4 Product Card (Match Reference — Critical)

```
┌─────────────────┐
│ ♡          -15% │  ← wishlist (top-start) + promo badge (top-end)
│                 │
│   [product img] │
│                 │
│ ★★★★★ 5.0 (0)  │  ← rating row (placeholder until reviews)
│ Brand name      │  ← muted small text
│ Product title   │  ← 2-line clamp
│ 90.00 ر.س  [🛒]│  ← price bold + circular add-to-cart
└─────────────────┘
```

- White card, subtle border, no heavy shadow
- **Add to cart:** Teal circle button (icon only) — toast "السلة قريباً" until cart backend
- **Wishlist heart:** Toggle local state; sync to `/store/wishlist` page
- Grid density: **5 columns desktop** · **3 tablet** · **2 mobile** (match reference PLP)

### 0.5 Category / PLP Page (Match Reference Screenshot)

```
Breadcrumbs: الرئيسية > الفئات > فيتامينات التحكم بالوزن

┌─────────────┬──────────────────────────────────────────┐
│ FILTERS     │  [ترتيب حسب ▾]              12 منتج      │
│ (sidebar)   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│             │  │card│ │card│ │card│ │card│ │card│   │
│ + الفئات    │  └────┘ └────┘ └────┘ └────┘ └────┘   │
│ + نطاق السعر│                                          │
│ + العروض    │  [Pagination]                            │
│ + التوفر    │                                          │
└─────────────┴──────────────────────────────────────────┘
```

- **RTL:** Sidebar on the **right** (start side)
- **Mobile:** Filters in bottom sheet; sort in sticky bar
- Pre-filtered when arriving from category slug

### 0.6 Footer (Match Reference — Large)

Three bands on `bg-primary` (teal):

1. **Top band:** Company · Help · Follow us (social) · App download badges (CMS placeholders)
2. **Payment row:** Mada, Visa, Mastercard, Tabby, Tamara icons (CMS `footer.paymentIcons[]`)
3. **Category sitemap grid:** All L1 categories with L2 link columns (from repository — SEO + navigation)
4. **Compliance bar:** © copyright · CR number · VAT badge placeholders · legal links

### 0.7 Cart & Wishlist Pages (From Reference URLs)

| Page | Route | MVP (no backend) |
|------|-------|------------------|
| Cart | `/store/cart` | Empty state + line-item UI with mock item; qty stepper; subtotal; disabled checkout |
| Wishlist | `/store/wishlist` | Grid of wishlisted products (Zustand UI state); remove + add-to-cart actions |

Both pages reuse **header + footer shell** and **product card** components.

---

## 1. Executive Summary

The current storefront reads as a **single-category furniture demo**. The product target is a **modern multi-category consumables retail platform** — groceries, beverages, snacks, bakery, dairy, cleaning, household — with UX quality matching regional leaders. **Ekleel Abha** is the approved visual/UX reference for layout density, navigation, cards, and footer depth.

This blueprint **does not rebuild architecture**. It redesigns the **product experience** on top of:

```
Route → Page Component → Repository → Static JSON (CMS)
```

All visible copy, navigation labels, and section content remain **data-driven** — never hardcoded in UI. UI strings use **next-intl** namespaces; merchandising copy uses **CMS JSON**.

---

## 2. Design Principles (Cross-Platform Patterns)

Modern retail storefronts share these UX patterns. We adopt the **principles**, not any single brand's visual identity.

| Pattern | What users expect | Our direction |
|--------|-------------------|---------------|
| **Category-first discovery** | Browse by aisle / department before search | Mega menu + category rails on homepage |
| **Search as primary utility** | Prominent search, suggestions, recent queries | Sticky search bar, typeahead, zero-results guidance |
| **Dense product grids** | Many SKUs visible per screen; scannable cards | Compact cards: image, price, unit, promo badge, add CTA |
| **Filter / sort strip** | Refine without losing context | Horizontal filter chips + drawer on mobile |
| **Trust & fulfillment signals** | Delivery, returns, payment icons near decision points | Feature strip + PDP assurance row |
| **Promotional hierarchy** | Hero → deals → categories → recommendations | CMS-ordered section stack |
| **Mobile commerce-first** | Thumb reach, bottom actions, collapsible filters | Mobile-first layouts; sticky add-to-cart on PDP |
| **Localization** | RTL Arabic default; LTR English; localized prices/dates | next-intl + `Intl` formatters (implemented) |
| **Theme continuity** | Light / dark / system across all surfaces | Theme tokens only; no raw colors |

**Visual identity (unchanged engineering tokens):** deep forest teal, warm gold accents, ivory backgrounds, soft shadows, Arabic-first typography, `rounded-lg` / `rounded-xl`, `shadow-soft` / `shadow-elevated`.

---

## 3. Information Architecture

### 3.1 Top-Level Navigation (Desktop) — Ekleel Abha Pattern

See §0.1 for the two-tier header spec. Theme switcher moves to footer utility row (desktop) or mobile menu — not in primary teal bar (keeps reference clean).

### 3.2 Mobile Navigation

```
[Logo]                    [Search icon] [Cart*] [Menu]

— Full-screen search overlay on search tap
— Bottom sheet menu: categories tree, account links, locale, theme
— Optional sticky bottom bar: Home | Categories | Search | Cart | Account
```

### 3.3 URL Structure (locale-prefixed)

| Page | Path |
|------|------|
| Home | `/{locale}/store` |
| PLP | `/{locale}/store/products` |
| Best sellers | `/{locale}/store/products?sort=best-sellers` |
| New arrivals | `/{locale}/store/products?sort=newest` |
| Offers | `/{locale}/store/products?tag=deals` |
| PDP | `/{locale}/store/products/{slug}` |
| Category hub | `/{locale}/store/categories` |
| Category PLP | `/{locale}/store/categories/{slug}` |
| Search | `/{locale}/store/search?q=` |
| Brand | `/{locale}/store/brands/{slug}` |
| Cart | `/{locale}/store/cart` |
| Wishlist | `/{locale}/store/wishlist` |

CMS `href` values remain **locale-agnostic** (`/store/products`); `Link` from `@/i18n/navigation` resolves prefixes.

---

## 4. Homepage — Fully CMS-Driven Section Registry

### 4.1 Problem Today

`homepage.json` drives hero + boolean flags (`showFeaturedCategories`, etc.), but `store-home-page.tsx` **knows which sections exist**. Adding a section requires code changes. Content is furniture-branded.

### 4.2 Target Architecture

The homepage page component becomes a **thin renderer**:

```tsx
// Conceptual — post-approval implementation
export async function StoreHomePage() {
  const sections = await storefrontHomepageRepository.getOrderedSections(companyId);
  return <HomepageSectionRenderer sections={sections} />;
}
```

`HomepageSectionRenderer` maps `section.type` → registered React component. The page **does not branch on section names**.

### 4.3 CMS Schema (proposed)

```json
{
  "companyId": "demo-company",
  "sections": [
    {
      "id": "hero-main",
      "type": "hero_banner",
      "enabled": true,
      "order": 10,
      "config": {
        "title": { "ar": "...", "en": "..." },
        "subtitle": { "ar": "...", "en": "..." },
        "ctaLabel": { "ar": "...", "en": "..." },
        "ctaHref": "/store/products",
        "imageUrl": null,
        "layout": "centered"
      }
    },
    {
      "id": "promo-strip",
      "type": "promo_strip",
      "enabled": true,
      "order": 20,
      "config": {
        "items": [
          { "label": { "ar": "توصيل مجاني", "en": "Free delivery" }, "icon": "truck" }
        ]
      }
    },
    {
      "id": "category-rail",
      "type": "category_grid",
      "enabled": true,
      "order": 30,
      "config": { "title": { "ar": "تسوّق حسب القسم", "en": "Shop by aisle" }, "limit": 12, "source": "featured" }
    },
    {
      "id": "deals-carousel",
      "type": "product_carousel",
      "enabled": true,
      "order": 40,
      "config": { "title": { "ar": "عروض اليوم", "en": "Today's deals" }, "query": { "tag": "deal" }, "limit": 12 }
    },
    {
      "id": "latest-products",
      "type": "product_grid",
      "enabled": true,
      "order": 50,
      "config": { "title": { "ar": "وصل حديثًا", "en": "New arrivals" }, "query": { "sort": "newest" }, "limit": 8 }
    },
    {
      "id": "brand-strip",
      "type": "brand_logos",
      "enabled": true,
      "order": 60,
      "config": { "limit": 10 }
    },
    {
      "id": "editorial-banner",
      "type": "split_banner",
      "enabled": false,
      "order": 70,
      "config": { "imageUrl": "...", "title": { "ar": "...", "en": "..." }, "href": "/store/categories/electronics" }
    }
  ]
}
```

### 4.4 Section Type Registry

| `type` | Purpose | Data source |
|--------|---------|-------------|
| `hero_banner` | Primary value prop + CTA | CMS config |
| `promo_strip` | Delivery / payment / returns icons | CMS config |
| `category_grid` | Department discovery | categories repository |
| `category_rail` | Horizontal scroll categories | categories repository |
| `product_carousel` | Deals, bestsellers | products repository + query |
| `product_grid` | Latest / recommended | products repository + query |
| `brand_logos` | Brand trust strip | brands repository |
| `split_banner` | Seasonal / category promo | CMS config |
| `blog_teaser` | Content marketing | content repository |
| `html_block` | Future rich CMS (sanitized HTML) | CMS config |

Each section component receives `{ id, config, locale }` only.

### 4.5 Section Contract

Every section supports:

- **enable / disable** — `enabled: false` skips render
- **ordering** — `order` ascending sort in repository
- **configuration** — opaque `config` per type schema (Zod-validated in repository)
- **future CMS editing** — JSON is API-shaped; swap repository impl for headless CMS later

### 4.6 Homepage Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile `<640px` | Single column; carousels swipeable; category rail horizontal scroll |
| Tablet `640–1024px` | 2-col product grids; condensed hero |
| Desktop `≥1024px` | 4–6 col product grids; full mega-menu affordance in header |

---

## 5. Navigation & Mega Menu

### 5.1 Desktop Mega Menu

Triggered by **"All Categories"** (not every nav link — avoids duplicate sidebar nav per architecture rules).

```
┌─────────────────────────────────────────────────────────────┐
│ [Groceries] [Beverages] [Snacks] [Bakery] [Home] [Beauty]  │  ← L1 tabs
├──────────────────┬──────────────────────────────────────────┤
│ Dairy            │  [img] Featured: Weekly Grocery Deals     │
│ Frozen           │  ─────────────────────────────────────    │
│ Fresh Produce    │  Sub: Milk, Cheese, Yogurt, Eggs          │
│ Bakery           │  Sub: Bread, Pastries                     │
│ ...              │  [View all Groceries →]                   │
└──────────────────┴──────────────────────────────────────────┘
```

**Data:** `categories` repository — tree via `parentId`. Featured promo column from CMS `navigation.promos[]`.

**Behavior:**
- Hover / click opens panel; ESC closes; focus trap for keyboard
- L1 vertical list filters L2/L3 column
- Max depth: 3 levels
- "View all" links to category PLP

### 5.2 Header Search Integration

Desktop: search input **in header center** (not icon-only). Submits to `/store/search?q=`.

### 5.3 Footer Navigation

Keep CMS `footer.linkGroups` — extend with:
- Payment method icons (CMS `footer.paymentIcons[]`)
- App download badges (optional CMS)
- Newsletter slot (disabled until backend)

---

## 6. Search Experience

### 6.1 Entry Points

- Header search input (desktop)
- Full-screen search overlay (mobile)
- `/store/search` results page

### 6.2 Typeahead (Phase 2 — architecture now)

Client hook `useStorefrontSearch` already exists. Extend with:

| Feature | Behavior |
|---------|----------|
| Debounced query | 300ms |
| Grouped results | Products (6) / Categories (3) / Brands (3) |
| Keyboard nav | ↑↓ select, Enter go |
| Empty state | Suggested categories from CMS |
| Recent searches | `sessionStorage` (non-PII) |

### 6.3 Results Page Layout

```
Search: "chocolate" — 24 results

[Products ▾] [Categories] [Brands]   ← tabs or sections

[Filter chips] [Sort ▾]

[Product grid...]
```

### 6.4 Zero Results

- Illustration + "No results for …"
- Suggested popular categories (CMS)
- Clear filters CTA

---

## 7. Product Listing Page (PLP)

### 7.1 Layout

```
Breadcrumbs
H1: Products / {Category name}
[Active filter chips                    ] [Clear all]

[Filters sidebar]  |  [Sort: Relevance ▾]  [Grid/List toggle]
  Category           |  ┌────┐ ┌────┐ ┌────┐ ┌────┐
  Brand              |  │    │ │    │ │    │ │    │
  Price range        |  └────┘ └────┘ └────┘ └────┘
  Availability       |
  (collapsible)      |  [Pagination]
```

### 7.2 Mobile PLP

- Filters open in **bottom sheet** or full-screen drawer
- Sticky sort bar below header
- 2-column product grid default

### 7.3 Product Card (retail-grade)

```
┌─────────────────┐
│ [Sale -15%]     │  ← promo badge (CMS/product flag)
│     [image]     │
│                 │
│ Brand name      │  ← muted, small
│ Product title   │  ← 2-line clamp
│ ★ 4.5 (120)     │  ← placeholder until reviews phase
│ 24.95 SAR       │  ← locale currency via formatStorefrontPrice
│ 29.95           │  ← compare-at strikethrough
│ per pack        │  ← unit label when applicable
│ [+ Add]         │  ← icon button; full "Add to cart" on PDP
└─────────────────┘
```

### 7.4 Sort Options

- Relevance (search context)
- Price: low → high / high → low
- Newest
- Best selling (mock sort key until backend)

### 7.5 Empty / Loading

- Skeleton grid (8 cards)
- Empty: illustration + reset filters

---

## 8. Product Detail Page (PDP)

### 8.1 Layout (desktop)

```
Breadcrumbs

┌────────────────────┬──────────────────────────────┐
│  [Gallery]         │  Brand → link                  │
│  thumbnails        │  H1 Product name               │
│                    │  ★ rating | SKU | stock badge  │
│                    │  Price block (large)           │
│                    │  Unit / variant selectors      │
│                    │  [Add to cart — primary]       │
│                    │  [Buy now — secondary]         │
│                    │  Delivery · Returns · Payment  │
└────────────────────┴──────────────────────────────┘

Tabs: Description | Specifications | Reviews*
Related products carousel

* Reviews — placeholder tab until backend
```

### 8.2 Mobile PDP

- Sticky bottom bar: price + **Add to cart** (full width)
- Gallery: swipe; pinch-zoom phase 2
- Accordions instead of tabs below fold

### 8.3 Multi-Category Content

Descriptions support bullet specs (weight, volume, ingredients, electronics specs) via structured `product.attributes[]` in domain — render as definition list.

---

## 9. Category Experience

### 9.1 Category Hub (`/categories`)

Grid of **top-level departments** with image, name, product count:

```
┌──────────┐ ┌──────────┐ ┌──────────┐
│ [img]    │ │ [img]    │ │ [img]    │
│ Groceries│ │ Beverages│ │ Snacks   │
│ 1,240    │ │ 380      │ │ 520      │
└──────────┘ └──────────┘ └──────────┘
```

### 9.2 Category PLP (`/categories/{slug}`)

- Category hero: name, description, optional banner image (CMS override per category)
- Subcategory chips if children exist
- Same PLP filter/sort as global products — **pre-filtered by category**
- Breadcrumbs: Home → Categories → {parent?} → {current}

---

## 10. Promotional Areas

| Placement | Format | CMS control |
|-----------|--------|-------------|
| Homepage hero | Full-width banner | `hero_banner` section |
| Promo strip | Icon + label row | `promo_strip` section |
| Inline PLP banner | Card between rows | `listing_banners[]` in CMS |
| Category banner | Top of category PLP | per-category `banner` in categories JSON |
| Countdown deal | Optional carousel slide | `endsAt` in section config |

**Rules:**
- Max 1 hero per homepage
- PLP inline promo every 8–12 products (configurable)
- Respect `enabled` flag per promo

---

## 11. Footer

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  Tagline from company config                        │
│  Social icons                                               │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│ Shop        │ Company     │ Support     │ Legal            │
│ (linkGroup) │ (linkGroup) │ (linkGroup) │ (linkGroup)      │
├─────────────┴─────────────┴─────────────┴──────────────────┤
│  Payment icons: Mada, Visa, Mastercard, Apple Pay (CMS)     │
│  © {copyrightOwnerName}                                     │
│  [Locale switcher] [Theme switcher]                         │
└────────────────────────────────────────────────────────────┘
```

Mobile: accordion link groups.

---

## 12. CMS Architecture (Static → Headless Ready)

### 12.1 Repository Boundaries (unchanged)

| Repository | Content |
|------------|---------|
| `homepage-repository` | Section registry + ordering |
| `content-repository` | About, FAQ, blog, legal |
| `company-repository` | Brand, nav, footer, theme |
| `products/categories/brands-repository` | Catalog |
| `search-repository` | Client search aggregation |

### 12.2 Localization Split

| Layer | Source | Example |
|-------|--------|---------|
| UI chrome | `messages/{locale}.json` via next-intl | "Add to cart", "Search" |
| Merchandising | CMS JSON with `{ ar, en }` fields | Hero title, promo copy |
| Catalog | Domain entities (`nameAr` / future `nameEn`) | Product names — migrate to localized fields in blueprint phase 2 |

**Phase 1 (implementation):** UI via next-intl ✅; CMS copy uses Arabic with English CMS fields added in mock JSON during UX implementation.

### 12.3 Company Config Evolution

```typescript
// Proposed extensions to CompanyConfig
navigation: {
  primary: NavLink[];
  megaMenu: { rootCategoryIds: string[]; promo?: MegaMenuPromo };
};
footer: {
  linkGroups: FooterLinkGroup[];
  paymentIcons: string[];
  tagline?: LocalizedString;
};
```

Nav `label` fields become `LocalizedString` or remain Arabic until CMS editor exists — renderer picks by `locale`.

---

## 13. Theme System Audit

| Area | Light | Dark | System | Notes |
|------|-------|------|--------|-------|
| Theme store | ✅ | ✅ | ✅ | `system` added; listens to `prefers-color-scheme` |
| Boot script | ✅ | ✅ | ✅ | Resolves system before paint |
| Store header/footer | ✅ | ✅ | ✅ | Token-based |
| Product cards | ✅ | ✅ | ✅ | Verify image placeholder contrast |
| Forms (contact) | ✅ | ✅ | ✅ | Input borders use `border-border` |
| Dialogs / sheets | ⚠️ | ⚠️ | ⚠️ | Not used on storefront yet |
| Mega menu panel | 🔲 | 🔲 | 🔲 | To build — must use `bg-popover` |
| Search overlay | 🔲 | 🔲 | 🔲 | To build |

**Rule:** No `bg-white`, `text-black`, or raw Tailwind colors — design tokens only.

---

## 14. Responsive Audit (Current → Target)

| Page | Mobile | Tablet | Desktop | Gap |
|------|--------|--------|---------|-----|
| Home | ⚠️ Basic | ⚠️ | ⚠️ | No carousels, furniture copy, static sections |
| PLP | ⚠️ 1-col | ⚠️ 2-col | ✅ 3-col | No filter drawer, weak cards |
| PDP | ⚠️ | ⚠️ | ⚠️ | No sticky mobile CTA, sparse gallery |
| Categories | ⚠️ | ⚠️ | ⚠️ | List-only, no department visuals |
| Search | ✅ | ✅ | ✅ | No typeahead |
| Blog | ✅ | ✅ | ✅ | Acceptable |
| About/Contact/FAQ | ✅ | ✅ | ✅ | Acceptable |
| Header | ⚠️ | ⚠️ | ⚠️ | Icon search only; no mega menu |
| Footer | ⚠️ | ⚠️ | ✅ | Link groups OK; no payment row |

**Mobile-first rule:** Design at 375px first, then `sm:` / `md:` / `lg:` enhancements.

---

## 15. Mock Data Rebrand (Implementation Phase)

Replace furniture-specific seed data with **consumables retail** (Ekleel Abha density, our product domain):

| Entity | Current | Target |
|--------|---------|--------|
| Company name | أثاث المستقبل | e.g. **سوق النخبة** / **Elite Market** |
| Categories | Furniture-heavy | 3-level tree: مشروبات · وجبات خفيفة · مخبوزات · ألبان · مجمدات · بقالة · تنظيف · عناية شخصية |
| Products | Desks, wardrobes | 50+ SKUs with images, brands, prices, promo badges |
| Homepage CMS | Furniture hero | Carousel promos + category circles + 3 product carousels |
| Blog posts | Furniture tips | Recipes, nutrition tips, seasonal promos |
| Footer | 3 link groups | Full category sitemap + payment icons + social + app badges |

---

## 16. Implementation Phases (Post-Approval)

### Phase A — Foundation (partially complete)
- [x] next-intl routing, middleware/proxy, layouts
- [x] Locale + theme switchers in header
- [x] Localized metadata, JSON-LD, sitemap
- [x] Price + date formatters per locale

### Phase B — Shell Redesign (Ekleel Abha Header + Footer)
- [ ] Two-tier `StoreHeader` (teal bar + white sub-nav)
- [ ] `StoreSearchBar` centered in header
- [ ] Wishlist + cart icons with badge counts (UI state)
- [ ] Mega footer (company · help · social · payments · category sitemap)
- [ ] Rebrand `company-configs.ts` + mock categories/products

### Phase C — Homepage Section Registry
- [ ] `HomepageSection` domain type + Zod schemas
- [ ] Section registry: hero_carousel, category_circles, product_carousel, brand_strip
- [ ] Migrate `homepage.json` to new schema
- [ ] Horizontal carousels with prev/next arrows

### Phase D — Navigation & Catalog
- [ ] `StoreMegaMenu` (L1/L2 panel — match reference screenshot)
- [ ] Product card redesign (wishlist, rating, promo badge, circular add CTA)
- [ ] PLP: right sidebar filters + sort + 5-col grid
- [ ] PDP gallery + sticky mobile add-to-cart
- [ ] `/store/cart` and `/store/wishlist` placeholder pages

### Phase E — Polish
- [ ] Typeahead search grouped results
- [ ] Skeleton loading states
- [ ] Visual QA: light/dark/system × ar/en × mobile/tablet/desktop

---

## 17. Out of Scope (Unchanged)

- Cart / checkout / payments backend
- User accounts / wishlists
- Admin dashboard UX
- Real API integration
- Product reviews backend

---

## 18. Approval Checklist

Before implementation begins, confirm:

- [x] Design reference: Ekleel Abha patterns (§0) — **user provided link + screenshots**
- [ ] Product domain: consumables / grocery (not furniture) — §0 opening note
- [ ] Two-tier header layout (§0.1)
- [ ] Mega menu L1/L2 model (§0.2)
- [ ] Product card anatomy (§0.4)
- [ ] PLP sidebar filters (§0.5)
- [ ] Cart + wishlist placeholder pages (§0.7)
- [ ] Mock rebrand name (§15) — confirm **سوق النخبة** or your preferred brand
- [ ] Phase ordering (§16)

---

*Document version: 1.1 — July 2026 — Ekleel Abha reference added*
