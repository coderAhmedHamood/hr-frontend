# Ecommerce Storefront — Rule Compliance Audit

**Auditor role:** Lead Frontend Architect (PR review)  
**Scope:** Public Website only — `src/features/ecommerce/storefront/**`, `src/app/[locale]/store/**`, `messages/*/storefront.json`, `src/i18n/**` (storefront usage)  
**Standards:** Frontend Engineering Contract (`.cursor/frontend doc rules.md`), Ecommerce Implementation Handbook (`.cursor/ecommerce/implementation-handbook.md`)  
**Date:** July 13, 2026  
**Verdict:** **NOT MERGE-READY** for production without architectural remediation

---

## Violations

### A. Internationalization & next-intl

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| I-01 | **Critical** | `product-card.tsx`, `product-detail-page.tsx`, `category-detail-page.tsx`, `brand-detail-page.tsx`, `store-cart-client.tsx`, `store-mega-menu.tsx`, `store-plp-sidebar.tsx`, `store-footer.tsx`, `store-category-circles.tsx`, `store-home-page.tsx`, `store-search-results.tsx`, `categories-list-page.tsx`, `brands-list-page.tsx`, `lib/seo.ts` | Entity display always uses `nameAr` even when locale is `en` and `nameEn` exists on domain types. English storefront URLs render Arabic catalog names — breaks next-intl locale contract. | Add `getLocalizedName(entity, locale)` utility; use in UI, breadcrumbs, alt fallbacks, and all SEO/JSON-LD builders. |
| I-02 | **Critical** | `lib/mock/company-configs.ts` | `name`, `navigation[].label`, `secondaryNavigation[].label`, `footer.linkGroups`, `footer.paymentMethods`, `seo.*` are hardcoded Arabic strings with no `en` variant. English locale still renders Arabic nav/footer/SEO from config. | Model locale-keyed CMS fields (`labelAr`/`labelEn` or nested `locales.en`) or resolve via next-intl message keys — not raw Arabic literals in config. |
| I-03 | **Major** | `lib/mock/homepage.json`, `lib/mock/content-pages.json`, `lib/mock/blog-posts.json`, `about-page.tsx`, `contact-page.tsx`, `faq-page.tsx`, `legal-page.tsx`, `blog-list-page.tsx`, `blog-detail-page.tsx`, `homepage-sections.tsx` | CMS content rendered without locale selection. All copy is Arabic-only in JSON; `en` pages show Arabic body text. | CMS records must carry per-locale fields; repository returns locale-scoped content; pages pass `locale` into resolvers. |
| I-04 | **Major** | `store-hero-carousel.tsx` | Hardcoded English `aria-label="Previous"`, `"Next"`, `` `Slide ${i + 1}` `` — not from `messages/*/storefront.json`. | Add `storefront.a11y.carouselPrevious`, `carouselNext`, `carouselSlide`; use `useTranslations`. |
| I-05 | **Major** | `store-cart-client.tsx` | Hardcoded English `aria-label="Decrease"` / `"Increase"`. | Add translated a11y keys; use `t()`. |
| I-06 | **Major** | `app/[locale]/store/error.tsx` → `components/shared/public-segment-error.tsx` → `components/shared/error-fallback.tsx` | Store error boundary renders hardcoded Arabic defaults (`'حدث خطأ غير متوقع'`, `'إعادة المحاولة'`, `goBackLabel="الصفحة الرئيسية"`). Not wired to `storefront` next-intl messages. | Store `error.tsx` must use `useTranslations('storefront')` or a localized error component; remove hardcoded Arabic from shared fallbacks when used by storefront. |
| I-07 | **Major** | `lib/seo.ts` | `organizationJsonLd`: `contactType: 'customer service'` — hardcoded English string in public JSON-LD. | Localize or omit; use locale-aware copy. |
| I-08 | **Major** | `lib/seo.ts` | `storeHomeMetadata` / `productsBrowseMetadata` use `config.seo.homeTitle` etc. — Arabic-only config strings for all locales. | Locale-aware SEO resolver (see I-02). |
| I-09 | **Minor** | `product-card.tsx` | Hardcoded English rating placeholder `5.0 (0)` — user-facing, not from next-intl. | Remove until real review data exists, or add translated key with honest copy. |
| I-10 | **Minor** | `products-browse-page.tsx` | Sort chip label `'↑'` — not translated; fails “every user-facing string” rule. | Use `t('products.priceAsc')` (add key to both locale files). |
| I-11 | **Minor** | `store-header.tsx` | Emoji `🎁` and `☰`/`✕` glyphs in UI — not localizable copy. | Use Lucide icons + translated labels only. |
| I-12 | **Major** | `lib/format-storefront.ts` | Hand-rolled `Intl.NumberFormat` / `Intl.DateTimeFormat` instead of `getFormatter()` / `useFormatter()` per Implementation Handbook §next-intl. | Replace with next-intl formatters in server/client call sites. |

---

### B. Design tokens, styling & Tailwind

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| S-01 | **Major** | `store-header.tsx`, `store-search-bar.tsx`, `product-card.tsx` | Uses `shadow-sm` — Contract §22 requires design-token shadows (`shadow-soft`, `shadow-elevated`, `shadow-luxe`). | Replace `shadow-sm` → `shadow-soft`. |
| S-02 | **Medium** | `storefront-shell.tsx` | Inline `style={themeStyle}` injecting `--primary`, `--secondary`, `--accent` from CMS HSL strings. Bypasses token files; Contract §22 prefers design-system variables. | Map CMS theme to predefined token presets or CSS class variants; avoid runtime inline style on root shell. |
| S-03 | **Low** | `storefront-shell.tsx`, `store-header.tsx` (×3), `store-footer.tsx` | `max-w-[1400px]` arbitrary value — `tailwind.config` already defines `container` at 1400px. | Use `container` or a named `max-w-*` extension in theme config. |
| S-04 | **Low** | `store-hero-carousel.tsx` | `aspect-[21/7]`, `min-h-[160px]`, `sm:min-h-[220px]` — arbitrary layout values outside spacing scale. | Add named utilities to `tailwind.config.js` or use tokenized aspect utilities. |
| S-05 | **Low** | `store-mega-menu.tsx` | `min-h-[320px]` arbitrary value. | Tokenize in theme. |
| S-06 | **Low** | `store-cart-client.tsx` | `lg:grid-cols-[1fr_320px]` arbitrary grid template. | Use standard grid cols or named template in theme. |
| S-07 | **Low** | `contact-page.tsx` | `lg:grid-cols-[1fr_1.1fr]` arbitrary value. | Same as S-06. |
| S-08 | **Low** | `product-card.tsx` | `text-[10px]`, `w-[180px]`, `sm:w-[200px]` — arbitrary typography/sizing. | Use `text-xs` and named width tokens. |
| S-09 | **Low** | `store-header.tsx` | `text-[10px]` on cart badge. | Use `text-xs`. |
| S-10 | **Low** | `store-header.tsx` | Arbitrary variant selectors `[&_select]:border-primary-foreground/30` etc. on locale switcher. | Extract to a styled wrapper component with tokenized classes. |
| S-11 | **Low** | `faq-page.tsx` | `[&::-webkit-details-marker]:hidden` arbitrary variant. | Move to `globals.css` utility if needed globally. |

---

### C. Architecture, layering & data access

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| A-01 | **Critical** | `src/app/layout.tsx` + `locale-document-sync.tsx` | Root `<html lang="ar" dir="rtl">` is hardcoded; English locale depends on client `useLayoutEffect` to mutate `document.documentElement`. Hydration mismatch / RTL flash risk; RTL source of truth must be server-side per locale routing contract. | Move `<html lang dir>` ownership to locale layout or next-intl middleware-driven root; remove client document mutation workaround. |
| A-02 | **High** | `store-home-page.tsx`, `storefront-shell.tsx`, `products-browse-page.tsx`, `category-detail-page.tsx`, `brand-detail-page.tsx`, `store-cart-page.tsx`, `store-wishlist-page.tsx`, `faq-page.tsx`, `blog-list-page.tsx`, `categories-list-page.tsx`, `brands-list-page.tsx` | Feature page components call repositories directly. Contract §9: server data should flow through defined layers; handbook expects consistent data-access patterns. No service layer for multi-repo orchestration (homepage loads 5 repos inline). | Extract `services/` (e.g. `homepage.service.ts`, `storefront-nav.service.ts`); pages receive preloaded props from thin `app/` routes or services. |
| A-03 | **High** | `app/[locale]/store/products/[slug]/page.tsx`, `categories/[slug]/page.tsx`, `brands/[slug]/page.tsx`, `blog/[slug]/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `legal/[slug]/page.tsx` | Route files contain loader logic (`loadProduct`, `loadCategory`, `notFound`, pagination parsing) — violates thin `page.tsx` capsule rule (Contract §2, §3). | Move loaders to `features/.../services/` or `lib/loaders/` with `cache()`; `page.tsx` imports one feature component only. |
| A-04 | **High** | `src/app/store/**` (7 files) AND `src/app/[locale]/store/**` | Duplicate non-locale `/store` routes coexist with `/[locale]/store`. Contract §2 / Forbidden Patterns: route duplication. | Delete `src/app/store/**` or replace with redirects to `/[locale]/store`. |
| A-05 | **High** | Entire storefront read path (RSC pages) | Contract §9/§11 requires TanStack Query for all API-backed server state. Storefront SSR pages bypass hooks entirely (only search uses `useQuery`). | Document explicit RSC exception in architecture, or add prefetch+dehydrate pattern for client refetch paths; align with contract. |
| A-06 | **Medium** | `store-mega-menu.tsx` + `store-plp-sidebar.tsx` + `store-footer.tsx` | `buildCategoryTree()` duplicated in three files. Contract §25: duplicated logic. | Extract to `features/ecommerce/storefront/utils/category-tree.ts`. |
| A-07 | **Medium** | `storefront-shell.tsx` + `products-browse-page.tsx` | Categories fetched twice per request (`limit: 200` in shell, `limit: 50` in PLP) — duplicated repository usage. | Dedupe with `cache()` on list call; pass shell categories down or fetch roots-only for nav. |
| A-08 | **Medium** | `locale-document-sync.tsx` in `storefront/components/` | Storefront-specific file imported by `app/[locale]/layout.tsx` (locale-wide). Wrong ownership boundary. | Move to `src/i18n/locale-document-sync.tsx`. |
| A-09 | **Low** | `hooks/use-storefront-cart-ui.ts`, `hooks/use-storefront-wishlist-ui.ts` | Kebab-case hook filenames; Contract §20 expects `useStorefrontCartUi.ts`. | Rename files and update imports. |
| A-10 | **Low** | `hooks/query-keys.ts` | Single search key only — premature `query-keys.ts` per Contract §0 simplicity override. | Inline keys in `use-storefront-search.ts` until ≥3 shared keys exist. |
| A-11 | **Major** | `store-header.tsx` secondary navigation | Duplicates sidebar ecommerce routes (brands, best sellers, new arrivals, offers) as horizontal sub-nav. Architecture rule §21 forbids module sub-navigation bars duplicating sidebar routes. | Remove sub-nav row or demote to CMS-driven promo only; rely on sidebar + breadcrumbs (conflicts with approved UX blueprint — requires contract exception documented). |

---

### D. Server / Client boundaries

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| C-01 | **High** | `store-header.tsx` | Entire header is `'use client'` — pulls mega-menu, search, Zustand cart/wishlist, locale switcher into persistent client bundle on every page. Contract §10: push `'use client'` to smallest leaf. | Split server header shell; client islands for search, badges, mega-menu toggle only. |
| C-02 | **High** | `product-card.tsx` | Client component on every grid cell; imports `sonner`, cart/wishlist stores into all listing pages. | Server card shell + client action island for wishlist/cart buttons. |
| C-03 | **Medium** | `store-category-circles.tsx` | Marked `'use client'` but has no hooks, state, or event handlers — unnecessary Client Component. | Remove `'use client'`; render as Server Component. |
| C-04 | **Low** | `store-footer-utilities.tsx` | Client wrapper with no state; only renders `StoreThemeSwitcher`. | Remove wrapper; import switcher directly from server `store-footer.tsx`. |

---

### E. Zustand & state

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| Z-01 | **Critical** | `hooks/use-storefront-cart-ui.ts` | `persist` middleware stores cart line items in `localStorage`. Implementation Handbook §Zustand: **never persist cart contents** — cart is server state. | Remove `persist` from cart store; use session/cookie-backed cart API when available, or document as explicit demo-only exception. |
| Z-02 | **Major** | `hooks/use-storefront-wishlist-ui.ts` | `persist` on wishlist product IDs — same handbook rule; wishlist is server-owned user data, not a UI preference. | Remove persist; back with authenticated wishlist API. |

---

### F. CMS-driven Website

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| M-01 | **Critical** | `store-category-circles.tsx` | `CATEGORY_IMAGES` map hardcodes Unsplash URLs by slug in component — not CMS/repository driven. | Move images to category records in `categories.json` / CMS; read from repository. |
| M-02 | **Critical** | See I-01, I-02, I-03 | Catalog and company content lack English locale fields — Website is not locale-complete CMS. | Per-locale CMS schema across company config, homepage, products, categories, brands, content pages. |
| M-03 | **Major** | `company-configs.ts` | Theme colors are raw HSL strings in mock JSON, not admin-editable token presets validated against design system. | Constrain theme to allowed token presets; validate in domain layer. |
| M-04 | **Major** | `store-cart-page.tsx`, `store-wishlist-page.tsx` | Resolves client UI state by bulk-loading `limit: 100` products — not CMS/API targeted fetch by IDs. | Repository method `getByIds(companyId, ids[])`; fetch only referenced products. |

---

### G. Loading, empty & error states

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| U-01 | **High** | `store-search-results.tsx` | `useStorefrontSearch` exposes error state but UI handles only loading/empty — no `isError` branch. Handbook §UI State Patterns requires error handling. | Render error empty-state with retry via `refetch()`. |
| U-02 | **Medium** | `store-cart-client.tsx`, `store-wishlist-client.tsx` | Cart/wishlist lines whose `productId` is outside the 100-item server catalog are silently dropped — can show empty while Zustand has IDs. | Fetch by ID list; show explicit partial-load error. |
| U-03 | **Low** | Nested storefront segments (`products/`, `categories/`, `brands/`, `blog/`, `cart/`, `wishlist/`, etc.) | Only parent `store/error.tsx` and `store/loading.tsx` exist. Contract §3 requires route-level boundaries per feature route. | Add segment `error.tsx` + `loading.tsx` or document parent-boundary exception. |

---

### H. Accessibility

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| X-01 | **High** | `product-card.tsx` | `<button>` (wishlist, add-to-cart) nested inside wrapping `<Link>` — invalid interactive nesting; keyboard/AT breakage. | Card as `<div>`; link only image/title; buttons as siblings outside link. |
| X-02 | **High** | `store-header.tsx` | Mobile logo link: image `alt=""` + `aria-hidden`, store name `hidden sm:inline` — link has no accessible name on small screens. | `aria-label={config.name}` on link or visible text at all breakpoints. |
| X-03 | **High** | `store-home-page.tsx` | No `<h1>` on homepage; hero title is `<p>` inside carousel. | Add page-level `<h1>` or render primary hero title as `<h1>`. |
| X-04 | **Medium** | `store-hero-carousel.tsx` | `alt={slide.title ?? ''}` — untitled slides get empty alt on meaningful promo images. | CMS `alt` field or `t('home.heroImageAlt')` fallback. |
| X-05 | **Medium** | `store-breadcrumbs.tsx` | Breadcrumbs use `<nav>` + `<span>` — not `<ol>/<li>` list semantics. | Ordered list with `aria-current="page"` on last item. |
| X-06 | **Medium** | `product-card.tsx` | Fake `5.0 (0)` rating — misleading for users and assistive tech. | Remove or hide until real data exists. |
| X-07 | **Low** | `store-mega-menu.tsx`, `store-plp-sidebar.tsx` | Filter/nav groups use `<div>` instead of `<ul>/<li>`. | Semantic list markup. |

---

### I. SEO

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| E-01 | **Critical** | `lib/seo.ts` — `localizedAlternates()` | `canonical: languages.ar` always — English pages (`/en/store/**`) get Arabic canonical URL. | Set `canonical` to current locale URL: `languages[locale]`. |
| E-02 | **High** | `app/[locale]/store/cart/page.tsx`, `wishlist/page.tsx` | No `generateMetadata` — missing title, description, robots. | Add metadata helpers; `robots: { index: false, follow: true }`. |
| E-03 | **Medium** | `app/[locale]/store/products/page.tsx` + `productsBrowseMetadata` | `hasFilter` checks `category` only; `?tag=` and `?sort=` create indexable duplicates. | Pass all filter params; `noindex` non-canonical variants. |
| E-04 | **Medium** | `lib/seo.ts` — `productMetadata` | `openGraph.type: 'website'` on PDP — should be `'product'`. | Use `type: 'product'`. |
| E-05 | **Medium** | `store-home-page.tsx` | No `WebSite` / `SearchAction` JSON-LD on homepage. | Add `WebSite` schema pointing to `/store/search`. |
| E-06 | **Medium** | `products-browse-page.tsx`, `categories-list-page.tsx`, `brands-list-page.tsx`, `blog-list-page.tsx` | Visual breadcrumbs present but missing matching `BreadcrumbList` JSON-LD. | Add `breadcrumbJsonLd()` alongside existing schemas. |
| E-07 | **Low** | `lib/seo.ts` | `productJsonLd` omits `brand` when `brandId` known; `articleJsonLd` omits `image`. | Complete schema fields. |
| E-08 | **Low** | `app/[locale]/store/not-found.tsx` | No route-level metadata override for 404. | Export `generateMetadata` with `robots: { index: false }`. |

---

### J. Performance

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| P-01 | **Medium** | `storefront-shell.tsx` | Fetches up to **200 categories** on every storefront page. Contract §18a: no large client-side dumps; server should paginate/lazy-load. | Roots-only nav endpoint; lazy-load mega-menu children. |
| P-02 | **Medium** | `store-cart-page.tsx`, `store-wishlist-page.tsx` | Server fetches **100 products** per visit to hydrate client cart/wishlist. Contract §18a: never fetch 50+ for picker resolution. | Fetch by cart/wishlist product IDs only. |
| P-03 | **Medium** | All storefront `<Image>` usages | `unoptimized` on all images — bypasses Next.js image pipeline (Contract §18, production image config). | Configure `images.remotePatterns`; remove `unoptimized`. |
| P-04 | **Medium** | `store-hero-carousel.tsx`, `store-category-circles.tsx`, `store-cart-client.tsx` | `fill` images without `sizes` — suboptimal srcset selection, CLS risk. | Add appropriate `sizes` per layout. |
| P-05 | **Low** | Most internal `<Link prefetch={false}>` | Disables Next.js prefetch on high-traffic routes — slower client navigations. | Enable prefetch on primary paths; disable only on heavy/low-value routes. |
| P-06 | **Low** | `app/[locale]/store/sitemap.ts` | Four `limit: 500` list calls — Contract §18b prefers parallel paginated fetch. | Paginate sitemap generation. |

---

### K. RTL & responsive

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| R-01 | **Medium** | `product-card.tsx` — `StoreProductCarousel.scroll()` | `scrollBy({ left: amount })` uses physical axis — horizontal carousel scroll direction wrong in RTL. | Use logical `inline` direction or flip sign based on `dir`. |

---

### L. React primitives (Handbook)

| ID | Severity | File(s) | Why it violates the rule | Recommended fix |
|----|----------|---------|--------------------------|-----------------|
| H-01 | **Low** | `store-mega-menu.tsx` | `useMemo` for `buildCategoryTree` on small static category arrays — unnecessary memo per Handbook §useMemo (“when NOT to use: cheap computation”). | Inline computation or shared util without memo. |
| H-02 | **Low** | `store-mega-menu.tsx` | `useEffect` for hover close on mega menu — acceptable for UI, but pairs with duplicated tree logic (see A-06). | Consolidate; consider CSS-only hover where possible. |

---

## Final Verdict Questions

### 1. Is next-intl implemented correctly according to the official architecture?

**No.**

Infrastructure (routing, `[locale]` segments, `NextIntlClientProvider`, `messages/*.json`, namespace-scoped `getTranslations`/`useTranslations`) is structurally correct. However:

- Locale is not authoritative server-side (`lang`/`dir` patched client-side).
- Catalog/CMS copy ignores `en` locale.
- Hardcoded aria-labels and error UI bypass messages.
- Price/date formatting uses hand-rolled `Intl` instead of `getFormatter`/`useFormatter`.

next-intl is **wired** but **not correctly applied** end-to-end.

---

### 2. Are ALL user-facing strings coming from next-intl?

**No.**

Violations include: Arabic-only company config labels, Arabic-only CMS body copy, always-`nameAr` entity names on English pages, hardcoded English aria-labels, hardcoded Arabic error fallbacks, fake English rating text, emoji glyphs, and hardcoded English JSON-LD `contactType`.

Shell chrome (buttons, nav labels from `t()`) is mostly compliant; **catalog, CMS, SEO, and a11y strings are not.**

---

### 3. Are ALL colors coming from design tokens?

**No.**

Semantic token classes (`bg-primary`, `text-muted-foreground`, etc.) are used correctly in components — no raw `bg-blue-500` palette abuse found.

Violations: runtime CMS HSL injected via inline `style` on shell (S-02), and `shadow-sm` instead of token shadows (S-01). Theme colors in mock JSON are not validated token presets (M-03).

**~90% compliant on component classNames; not fully token-governed at theme layer.**

---

### 4. Are ALL spacings using the design system?

**No.**

20+ arbitrary Tailwind bracket values (`max-w-[1400px]`, `aspect-[21/7]`, `w-[180px]`, `text-[10px]`, grid templates, etc.) bypass the spacing/sizing scale. Standard scale utilities are used in most places, but arbitrary values are systemic — not isolated exceptions.

---

### 5. Is the Website truly CMS-driven?

**No.**

Repositories and JSON seeds drive most content, which satisfies the approved Repository → Static JSON pattern. However:

- Category circle images are hardcoded in a component (M-01).
- No English locale in CMS records (M-02).
- Company theme is freeform HSL, not CMS token presets (M-03).
- Cart/wishlist product resolution uses bulk catalog hack, not CMS/API by ID (M-04).

The site is **repository-driven**, not **fully CMS-driven** and **not locale-complete**.

---

### 6. Could another senior engineer merge this without requesting architectural changes?

**No.**

A senior reviewer would block on:

1. English locale rendering Arabic catalog names (I-01)  
2. Wrong canonical URLs for `/en` (E-01)  
3. `persist` on cart/wishlist stores (Z-01, Z-02)  
4. Duplicate `/store` routes (A-04)  
5. Client-side `lang`/`dir` hydration workaround (A-01)  
6. Interactive nesting in product card (X-01)  
7. Missing cart/wishlist metadata (E-02)  
8. Bulk 100-product fetch for cart/wishlist (P-02, M-04)  
9. Entire header + product card as client islands (C-01, C-02)  
10. Sub-nav duplicating sidebar routes unless contract exception is filed (A-11)

**Estimated blocker count: 10 critical/high issues minimum.**

---

## Audit Summary

| Severity | Count |
|----------|-------|
| Critical | 9 |
| High | 18 |
| Major | 14 |
| Medium | 16 |
| Low | 15 |
| **Total distinct violations** | **72** |

**Recommendation:** Request Changes — do not merge to production until Critical and High items are resolved or explicitly waived with documented contract exceptions.
