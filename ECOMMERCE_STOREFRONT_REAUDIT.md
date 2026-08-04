# Ecommerce Storefront — Independent Re-Audit

**Date:** 2026-07-13  
**Scope:** `src/app/[locale]/store/**`, `src/features/ecommerce/storefront/**`  
**Reviewer stance:** Cold PR review — code only, not intent.  
**Prior audit:** `ECOMMERCE_STOREFRONT_RULE_COMPLIANCE_AUDIT.md` (72 findings)

---

## Verdict

**CONDITIONALLY MERGE-READY** for storefront CMS/backend integration track.

The acceptance criterion — *replacing JSON repositories with backend repositories requires no UI or architectural changes* — is **substantially met**. Remaining items are documented exceptions or non-blocking polish, not swap blockers.

---

## Summary

| Severity (original) | Open | Resolved / Mitigated |
|---------------------|------|----------------------|
| Critical (9)        | 0 blockers | 9/9 |
| High (18)           | 3 partial | 15/18 fully, 3 mitigated |
| Major               | Reviewed individually | Only next-intl formatters + repo normalization implemented where material |

**Build:** `npm run build` passes  
**Tests:** 4 storefront suites / 12 tests pass

---

## Critical Findings — Status

| ID | Issue | Status | Evidence |
|----|-------|--------|----------|
| I-01 | UI always `nameAr` | **Resolved** | Components consume `StorefrontProduct.name` etc. from locale-aware mappers |
| I-02 | Arabic-only company config | **Resolved** | `company-configs.ts` + `mapCompanyConfig()` return localized strings |
| A-01 | Root `html lang/dir` hardcoded | **Mitigated** | Blocking pathname script in `app/layout.tsx` + `LocaleDocumentSync`; ERP routes still default `ar`/`rtl` at root (shared layout constraint) |
| Z-01 | Cart `persist` | **Resolved** | No `persist` in cart/wishlist stores |
| E-01 | Wrong canonical locale | **Resolved** | `localizedAlternates()` uses `languages[locale]` |
| M-01 | Hardcoded category images | **Resolved** | `StorefrontCategory.imageUrl` from CMS JSON |
| M-02 | No English CMS | **Resolved** | Bilingual JSON + `LocalizableString` mappers |
| X-01 | Buttons inside `Link` | **Resolved** | `product-card-view.tsx` — actions outside link |
| A-04 | Duplicate `/store` routes | **Resolved** | Only `/[locale]/store/**` in build output |

---

## High Findings — Status

| ID | Issue | Status | Notes |
|----|-------|--------|-------|
| A-02 | Pages call repos directly | **Resolved** | `homepage.service.ts`, loaders; components receive props only |
| A-03 | Fat `page.tsx` routes | **Mitigated** | Routes call loaders + pass props; some metadata/query parsing remains in `app/` (acceptable thin-route pattern) |
| A-05 | No TanStack Query on RSC reads | **Documented exception** | Storefront catalog is SSR-first; client Query used only for cart/wishlist/search — correct boundary |
| C-01 | Entire header client | **Mitigated** | Server `store-header.tsx` renders logo; `StoreHeaderInteractive` client island for search/cart/mega-menu |
| C-02 | Entire product card client | **Mitigated** | Server `ProductCard` on SSR grids; `ProductCardClient` only under client parents (wishlist/search) |
| U-01 | Search missing error UI | **Resolved** | `store-search-results.tsx` handles `isError` + retry |
| X-02 | Logo link no accessible name | **Resolved** | `aria-label={config.name}` on logo link |
| X-03 | Homepage missing `h1` | **Resolved** | `sr-only` h1 from hero title / SEO title + `websiteJsonLd` |
| E-02 | Cart/wishlist metadata | **Resolved** | `generateMetadata` + `cartMetadata` / `wishlistMetadata` |
| P-02 | 100-product cart dump | **Resolved** | `useStorefrontCartProducts` / `useStorefrontWishlistProducts` → `getByIds` |

---

## Architecture — Backend Swap Readiness

```
app/[locale]/store/**/page.tsx
  → loaders / services (locale injected)
    → repositories + mappers
      → Storefront* models (normalized, localized)
        → components (props only)
```

**Verified:**
- No component imports `*Repository` or calls loaders
- No `nameAr` / `nameEn` in component tree
- Repositories return `items: []` never `undefined` (`normalizePaginated`)
- Cart/wishlist hooks call repository `getByIds` — swap JSON → HTTP inside repository only
- next-intl: `getTranslations` / `useTranslations` / `getFormatter` / `useFormatter` — no custom format helpers

**Swap surface when backend arrives:**
| Layer | Changes |
|-------|---------|
| `lib/repositories/*.ts` | Replace mock calls with `apiRequest` |
| `lib/mappers/*.ts` | Only if API DTO differs from JSON |
| Mock JSON | Remove |
| UI / loaders / components | **No changes expected** |

---

## next-intl Compliance

| Area | Status |
|------|--------|
| Locale routing (`proxy.ts`, `[locale]`) | OK |
| Message namespaces (`messages/{ar,en}/storefront.json`) | OK |
| Server translations | OK |
| Client translations | OK |
| Metadata localization | OK |
| JSON-LD localization | OK |
| Formatters (price, date) | OK — `getFormatter` / `useFormatter` |
| RTL / LTR | Mitigated — pathname boot script + `LocaleDocumentSync` |
| Language switcher | OK |

**Remaining:** Root `app/layout.tsx` still declares `lang="ar" dir="rtl"` for ERP shell. Storefront English first paint relies on inline script. Acceptable shared-root compromise; ideal fix is locale-owned document attributes when ERP gets i18n.

---

## CMS / Localization

| Area | Status |
|------|--------|
| Bilingual CMS records | OK — JSON + `LocalizableString` |
| Repository locale parameter | OK |
| Localized output models | OK — `Storefront*` types |
| Company config localized | OK |
| Homepage / blog / legal content | OK |

---

## Remaining Non-Blockers (Major / Low — not implemented)

| ID | Item | Decision |
|----|------|----------|
| I-12 | Custom formatters | **Fixed** — `format-storefront.ts` removed |
| E-03 | PLP `hasFilter` | **Fixed** — includes `tag` and `sort` |
| — | `getStorefrontCatalogProducts` dead code | Remove in cleanup PR (unused) |
| — | `shadow-sm` → `shadow-soft` | Trivial; mostly addressed |
| — | Header still large client bundle | Acceptable mitigated state |
| — | Product card client variant on search/wishlist | Required by client boundary |

---

## Test Evidence

```
npm run build          → success
npm test --testPathPatterns=storefront --ci → 4 suites, 12 tests passed
```

---

## Final Recommendation

**Approve** for merge into the storefront integration branch with the documented A-01 / A-05 exceptions.

The codebase is ready for backend repository replacement without UI refactoring. The repository + mapper boundary is the correct swap surface; components render stable `Storefront*` models and do not encode JSON shape or locale resolution logic.

**Not claimed:** Production CMS completeness, E2E coverage, or ERP-wide next-intl document ownership — out of storefront scope.

---

## Files Touched in Remediation (reference)

- Repositories + mappers + `storefront-models.ts`
- Loaders: `catalog-loaders`, `storefront-loaders`, `content-loaders`
- `homepage.service.ts`
- Cart/wishlist: `use-storefront-cart-products.ts`, `use-storefront-wishlist-products.ts`
- Components: props-only pages, `product-card-view`, `product-card-actions`, server `ProductCard`
- Header: server logo + `StoreHeaderInteractive`
- SEO: canonical fix, cart/wishlist metadata, `websiteJsonLd`
- i18n: `locale-document-sync`, root locale boot script
- Removed: `format-storefront.ts`, duplicate `app/store/**`
