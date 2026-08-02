# Ecommerce Storefront — Work Log

**Project:** HR System Frontend — Public Storefront (`/store/**`)  
**Last updated:** July 13, 2026  
**Design reference:** [Ekleel Abha](https://www.ekleelabha.com/ar) (UX patterns, not assets)  
**Brand:** سوق النخبة — consumables / grocery retail  

This document summarizes everything implemented for the ecommerce public storefront and related foundation work.

---

## Table of Contents

1. [Architecture Decisions](#1-architecture-decisions)
2. [Priority 1 — next-intl Localization](#2-priority-1--next-intl-localization)
3. [Priority 2 — UX Blueprint (Documentation)](#3-priority-2--ux-blueprint-documentation)
4. [Priority 3 — Ekleel Abha UX Implementation](#4-priority-3--ekleel-abha-ux-implementation)
5. [Mock Data & CMS Rebrand](#5-mock-data--cms-rebrand)
6. [Storefront Routes](#6-storefront-routes)
7. [New & Updated Files](#7-new--updated-files)
8. [i18n Message Keys Added](#8-i18n-message-keys-added)
9. [Bug Fixes](#9-bug-fixes)
10. [Verification](#10-verification)
11. [Out of Scope / Not Done](#11-out-of-scope--not-done)
12. [Related Documents](#12-related-documents)

---

## 1. Architecture Decisions

| Decision | Detail |
|----------|--------|
| Data flow | `Route → Page Component → Repository → Static JSON (CMS)` |
| Multi-tenant prep | `getStorefrontCompanyId()` is the only hardcoded tenant value; all branding comes from `CompanyConfig` |
| Server state | TanStack Query not used on storefront — server components + repositories |
| Client UI state | Zustand (persisted) for cart lines and wishlist product IDs only |
| Localization | **next-intl** is the sole storefront i18n layer — no custom `getStorefrontTranslations()` |
| Admin ERP | Ecommerce admin module (`/(app)/(ecommerce)/**`) built separately; storefront changes did not break it |

---

## 2. Priority 1 — next-intl Localization

### Installed & configured

- Added `next-intl` package and Next.js plugin in `next.config.mjs`
- Created i18n infrastructure:
  - `src/i18n/routing.ts` — locales (`ar`, `en`), default locale, pathnames
  - `src/i18n/request.ts` — server message loading
  - `src/i18n/navigation.ts` — locale-aware `Link`, `redirect`, `useRouter`
  - `src/i18n/config.ts` — shared config
- Created `src/proxy.ts` (storefront locale matcher; replaces old middleware approach for `/store` paths)

### Route migration

- Moved storefront from `src/app/store/**` → `src/app/[locale]/store/**`
- URLs are now locale-prefixed: `/ar/store/**`, `/en/store/**`
- Added `src/app/[locale]/layout.tsx` with `NextIntlClientProvider` and `LocaleDocumentSync`

### Message files

- `messages/ar/storefront.json` — Arabic storefront strings
- `messages/en/storefront.json` — English storefront strings
- `messages/ar/common.json`, `messages/en/common.json` — shared strings

### Component migration

- Migrated ~41 storefront files from custom i18n helpers to `getTranslations()` / `useTranslations('storefront')`
- Deleted `src/shared/i18n/storefront.ts` (custom helper removed)
- Added `formatStorefrontPrice`, `formatStorefrontDate` for locale-aware formatting
- Localized SEO metadata, JSON-LD, and sitemap generation

### Theme & locale switchers

- Extended theme store to support **light / dark / system**
- Added `StoreLocaleSwitcher` in header
- Added `StoreThemeSwitcher` in footer utilities
- Added `LocaleDocumentSync` client component to sync `lang` and `dir` on the document

### Infinite request loop fix

- Removed dynamic `getLocale()` from root `app/layout.tsx` (was causing repeated `/en/store/categories` requests)
- Root layout uses static `lang="ar" dir="rtl"`; client `LocaleDocumentSync` updates per route
- Set `prefetch={false}` on storefront navigation links
- Scoped `CompanyThemeProvider` / `DynamicFavicon` away from storefront in `providers.tsx`

---

## 3. Priority 2 — UX Blueprint (Documentation)

Created **`ECOMMERCE_UX_BLUEPRINT.md`** (v1.1) — design spec for approval before coding:

- Ekleel Abha reference analysis (header, mega menu, product card, PLP, footer, cart/wishlist)
- Two-tier header wireframe
- Homepage section registry (hero carousel, category circles, product carousels, brand strip)
- Product card anatomy (heart, discount badge, stars, brand, price, cart button)
- PLP layout (sidebar filters, sort bar, 5-column grid)
- Footer mega structure (company, help, payment methods, category directory, CR bar)
- Product domain shift: furniture demo → consumables retail

---

## 4. Priority 3 — Ekleel Abha UX Implementation

### 4.1 Two-tier header (`store-header.tsx`)

- Teal primary bar: logo, centered search (desktop), locale switcher, login, wishlist badge, cart badge
- White sub-nav: mega menu (الفئات), secondary links (brands, best sellers, new arrivals, offers zone)
- Mobile: hamburger menu, search below header, category accordion
- Cart/wishlist icons link to `/store/cart` and `/store/wishlist`

### 4.2 Search bar (`store-search-bar.tsx`)

- Pill-shaped search input in header
- Submits to `/store/search`

### 4.3 Mega menu (`store-mega-menu.tsx`)

- Desktop: L1 category list + L2 subcategory panel on hover
- Mobile: accordion category navigation (`StoreMobileCategoryNav`)

### 4.4 Product card (`product-card.tsx`)

- Ekleel-style card: wishlist heart, discount badge, star rating placeholder, brand, title, price, compare-at price, circular add-to-cart button
- `StoreProductCarousel` — horizontal scrollable product row with prev/next controls
- `ProductCardCarouselItem` — fixed-width carousel slot wrapper
- Toast on add-to-cart (Sonner via `storefront-shell.tsx`)

### 4.5 Homepage (`store-home-page.tsx`)

- Hero carousel (`store-hero-carousel.tsx`) — CMS-driven slides with dots and arrows
- Category circles (`store-category-circles.tsx`) — circular category icons in horizontal scroll
- Product carousels:
  - وصل حديثاً (new arrivals — `sort=createdAt desc`)
  - الأكثر مبيعاً (best sellers — `tag=best-seller`)
  - عروض اليوم (deals — `tag=deals`)
- Features strip (`HomepageFeaturesSection`)
- Horizontal brand strip

### 4.6 Footer (`store-footer.tsx`)

- Teal mega footer with company contact, link groups, social icons
- Payment methods row (مدى, Visa, Mastercard, etc.)
- Full category directory (roots + subcategories)
- Commercial registration bar
- Theme switcher in `store-footer-utilities.tsx`

### 4.7 PLP — Products browse (`products-browse-page.tsx`)

- Right sidebar category filters (`store-plp-sidebar.tsx`)
- Sort chips: all, newest, best sellers, price ascending
- 5-column product grid on `xl` breakpoints
- Tag filter support (`?tag=deals`)
- Category filter via `?category={slug}`

### 4.8 Category detail page

- Updated to 5-column grid on `xl`
- Breadcrumbs and JSON-LD preserved

### 4.9 Cart page

- Route: `src/app/[locale]/store/cart/page.tsx`
- Server page: `store-cart-page.tsx` (loads product catalog)
- Client UI: `store-cart-client.tsx` (Zustand cart, quantity controls, subtotal, checkout placeholder)

### 4.10 Wishlist page

- Route: `src/app/[locale]/store/wishlist/page.tsx`
- Server page: `store-wishlist-page.tsx`
- Client UI: `store-wishlist-client.tsx` (Zustand wishlist, product grid)

### 4.11 Client UI stores (Zustand — UI only)

- `hooks/use-storefront-cart-ui.ts` — cart lines, add/remove/set quantity, persisted
- `hooks/use-storefront-wishlist-ui.ts` — product ID list, toggle/has/remove, persisted

### 4.12 Shell updates (`storefront-shell.tsx`)

- Passes categories to header and footer
- Max width `1400px` content container
- Sonner `Toaster` for cart toasts
- Company theme CSS variables from `CompanyConfig`

---

## 5. Mock Data & CMS Rebrand

### Company config (`company-configs.ts`)

- Rebranded from furniture ("أثاث المستقبل") → **سوق النخبة** (consumables)
- Added `secondaryNavigation` (brands, best sellers, new arrivals, offers zone)
- Added `footer.paymentMethods` and `footer.commercialRegistration`
- Updated SEO copy, contact, social links, theme colors

### Homepage CMS (`homepage.json`)

- 3 hero carousel slides (grocery, beverages, bakery)
- Updated features copy for grocery delivery
- Flags: `showBestSellers`, `showDeals`, limits for each carousel section

### Categories (`categories.json`)

8 root categories + 2 beverage subcategories:

| Slug | Arabic |
|------|--------|
| `beverages` | المشروبات |
| `soft-drinks` | مشروبات غازية (child) |
| `juices` | عصائر (child) |
| `snacks` | الوجبات الخفيفة |
| `bakery` | المخبوزات |
| `dairy` | الألبان |
| `frozen` | المجمدات |
| `grocery` | البقالة |
| `cleaning` | التنظيف |
| `personal-care` | العناية الشخصية |

### Products (`products.json`)

16 consumables SKUs with:

- Unsplash product images (`type: image`, `position`, `isPrimary`)
- Brands: Pepsi, Almarai, Lay's, Nadec, Dove, Tide
- Tags: `best-seller`, `deals` for carousel filtering
- `compareAtPrice` on discounted items
- One out-of-stock item (mixed nuts) for stock UI testing

### Brands (`brands.json`)

6 consumables brands: المراعي, بيبسي, ليز, نادك, دوف, تايد

### Domain type updates

- `ProductListQuery` — added `tag?: string` filter
- `HomepageConfig` — added `heroSlides`, `showBestSellers`, `showDeals`, section limits
- `CompanyConfig` — `secondaryNavigation`, `paymentMethods`, `commercialRegistration`

### Repository updates

- `products-repository.ts` — tag filter in `matchesActiveProduct`
- Sort mapping in PLP: `newest`, `best-sellers`, `price-asc`, `price-desc`

---

## 6. Storefront Routes

All routes live under `src/app/[locale]/store/`:

| Route | Page component |
|-------|----------------|
| `/store` | `StoreHomePage` |
| `/store/products` | `ProductsBrowsePage` |
| `/store/products/[slug]` | `ProductDetailPage` |
| `/store/categories` | Categories list |
| `/store/categories/[slug]` | `CategoryDetailPage` |
| `/store/brands` | Brands list |
| `/store/brands/[slug]` | Brand detail |
| `/store/search` | Search results |
| `/store/cart` | `StoreCartPage` |
| `/store/wishlist` | `StoreWishlistPage` |
| `/store/about` | About page |
| `/store/contact` | Contact page |
| `/store/faq` | FAQ page |
| `/store/blog` | Blog list |
| `/store/blog/[slug]` | Blog detail |
| `/store/legal/[slug]` | Legal pages |
| `/store/sitemap.xml` | Sitemap |

---

## 7. New & Updated Files

### i18n & routing

```
src/i18n/routing.ts
src/i18n/request.ts
src/i18n/navigation.ts
src/i18n/config.ts
src/proxy.ts
src/app/[locale]/layout.tsx
src/app/api/locale/route.ts
messages/ar/storefront.json
messages/en/storefront.json
messages/ar/common.json
messages/en/common.json
```

### Storefront components (new)

```
store-header.tsx
store-footer.tsx
store-footer-utilities.tsx
store-search-bar.tsx
store-mega-menu.tsx
store-hero-carousel.tsx
store-category-circles.tsx
store-plp-sidebar.tsx
store-cart-page.tsx
store-cart-client.tsx
store-wishlist-page.tsx
store-wishlist-client.tsx
store-locale-switcher.tsx
store-theme-switcher.tsx
locale-document-sync.tsx
homepage-sections.tsx
store-empty-state.tsx
store-not-found-page.tsx
about-page.tsx
contact-page.tsx
contact-form.tsx
faq-page.tsx
legal-page.tsx
blog-list-page.tsx
blog-detail-page.tsx
brands-list-page.tsx
brand-detail-page.tsx
categories-list-page.tsx
store-search-page.tsx
store-search-results.tsx
```

### Storefront hooks

```
hooks/use-storefront-cart-ui.ts
hooks/use-storefront-wishlist-ui.ts
```

### Storefront lib & repositories

```
lib/repositories/products-repository.ts
lib/repositories/categories-repository.ts
lib/repositories/brands-repository.ts
lib/repositories/homepage-repository.ts
lib/repositories/search-repository.ts
lib/repositories/content-repository.ts
lib/repositories/blog-repository.ts
lib/format-storefront.ts
lib/seo.ts
lib/store-paths.ts
lib/mock/homepage.json
lib/mock/company-configs.ts
lib/mock/blog-posts.json
lib/mock/content-pages.json
domain/homepage.ts
domain/content.ts
domain/company-config.ts
```

### Shared mock data

```
src/features/ecommerce/shared/lib/mock/categories.json
src/features/ecommerce/shared/lib/mock/products.json
src/features/ecommerce/shared/lib/mock/brands.json
```

---

## 8. i18n Message Keys Added

### `nav`

`login`, `wishlist`, `cart`, `bestSellers`, `newArrivals`, `offersZone`  
(updated `categories` label to الفئات in Arabic)

### `home`

`bestSellers`, `dealsToday`  
(renamed `latestProducts` usage to وصل حديثاً semantics)

### `products`

`sortBy`, `filters`, `priceRange`

### `cart`

`title`, `empty`, `emptyDescription`, `continueShopping`, `total`, `checkout`, `remove`, `quantity`, `subtotal`

### `wishlist`

`title`, `empty`, `emptyDescription`, `browseProducts`

### `footer`

`paymentMethods`, `categoryDirectory`, `cr`

---

## 9. Bug Fixes

| Issue | Fix |
|-------|-----|
| Infinite `GET /en/store/categories` loop | Removed dynamic locale from root layout; `LocaleDocumentSync` + `prefetch={false}` |
| `company-configs.ts` missing `secondaryNavigation` | Added full secondary nav + footer payment/CR fields |
| Build failure on `MediaItem` type | Products JSON media updated with `type: "image"` and `position` |
| Storefront tests failing after rebrand | Updated search/brand test assertions to consumables data |

---

## 10. Verification

| Check | Result |
|-------|--------|
| `npm run build` | Passed |
| Storefront Jest tests (`--testPathPatterns=storefront`) | 12/12 passed |
| Routes generated | `/ar/store/**`, `/en/store/**` including cart & wishlist |

---

## 11. Out of Scope / Not Done

These were explicitly excluded or deferred:

- **Checkout flow** — cart checkout button is a placeholder (no payment backend)
- **User login** — login button in header is UI-only (no auth integration)
- **Real API** — all data still from static JSON repositories
- **Admin storefront CMS editor** — homepage/content edited via JSON files only
- **Product reviews** — star rating is visual placeholder on product card
- **Server-side cart** — cart is client-only Zustand (by design for current phase)
- **E2E Playwright tests** — not added for storefront flows yet
- **Image CDN config** — using `unoptimized` + Unsplash URLs in mock data

---

## 12. Related Documents

| File | Purpose |
|------|---------|
| `ECOMMERCE_UX_BLUEPRINT.md` | UX design spec (Ekleel Abha reference) |
| `ECOMMERCE_COMPLIANCE_AUDIT.md` | Architecture compliance audit |
| `PRODUCTS_DOMAIN_BLUEPRINT.md` | Products domain model blueprint |
| `.cursor/ecommerce/implementation-handbook.md` | Implementation handbook |

---

## Quick Start

```bash
npm run dev
# Open http://localhost:3001/ar/store
```

Key pages to review:

- `/ar/store` — homepage with carousel + category circles + product carousels
- `/ar/store/products` — PLP with sidebar filters
- `/ar/store/cart` — shopping cart
- `/ar/store/wishlist` — wishlist
- `/en/store` — English locale
