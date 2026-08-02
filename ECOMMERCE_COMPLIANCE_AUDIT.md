# Ecommerce Module — Engineering Compliance Audit

> **Scope:** the ecommerce admin CRUD (`src/features/ecommerce/admin/products/**`) and public storefront (`src/features/ecommerce/storefront/**`, `src/app/store/**`) built this session.
> **Audited against:** `.cursor/frontend doc rules.md` v3.0 ("Decision Engine").
>
> **Important scope note:** this v3.0 contract was not authored in the conversation that produced this report — it appeared on disk with substantially new requirements (query-key factories, `usePermission()`, `next-intl`, TanStack Table, Sentry, Vitest/Playwright, HttpOnly-cookie auth/theme) beyond an earlier v2.0 trim. Several v3.0 rules are aspirational relative to the actual, pre-existing codebase (e.g. no query key anywhere in the app — including code that predates ecommerce — is `companyId`-prefixed; the app has zero i18n; auth/theme state already lives in `localStorage`). Findings below distinguish "real gap in this work" from "the contract describes a state the whole app hasn't reached yet."

---

## Part 1 — Original Contract Compliance Audit

| # | Contract | Verdict | Evidence |
|---|---|---|---|
| 1 | Rendering Contract | ✅ PASS | Storefront 100% Server Components, `revalidate=60` (ISR) on all 4 routes, zero `'use server'`, mutations via `useMutation` only. |
| 2 | State Management Contract | ❌ FAIL | Query key factory inline in hook file, no leading `companyId` (`['ecommerce','products']`); no `queryClient.clear()` on company switch; admin search/page state in local `useState` instead of URL params. |
| 3 | Data Fetching Contract | ⚠ PARTIAL | Admin 4-layer model respected end-to-end. Storefront Server Components call `*Api` directly with no Hook layer — the contract defines "Hook" as TanStack-Query-only (client-side), with no row for Server Components. |
| 4 | API Consumption Contract | N/A | No real backend exists yet to test against (mock repository only). |
| 5 | Component Architecture Contract | ⚠ PARTIAL | `product-form-dialog.tsx` at 238 lines (over 200-preferred, under 400-max). `ProductAvailability` label map duplicated in 3 places. |
| 6 | Theme & Design Tokens Contract | ✅ PASS (ecommerce) / ❌ FAIL (repo-wide, pre-existing) | Zero hex/`dark:`/arbitrary values in ecommerce code. Root layout's theme boot script reads `localStorage` client-side pre-hydration — violates the contract's cookie-only rule, but predates ecommerce and is app-wide. |
| 7 | Linting & Tooling Contract | ❌ FAIL (repo-wide) | `eslint-plugin-tailwindcss`, `@tanstack/eslint-plugin-query`, `eslint-plugin-sonarjs` not installed anywhere in the repo. |
| 8 | Folder Architecture Contract | ❌ FAIL | `*Api` modules live at `lib/api/<resource>.ts` not `api/<resource>-api.ts`; no `query-keys.ts` file existed anywhere in ecommerce. |
| 9 | Forms Contract | ⚠ PARTIAL | RHF+Zod correct, loading/disabled states correct. Mutation errors surfaced only via `toast.error`, never `setError()` on the specific field. |
| 10 | Tables Contract | ❌ FAIL | `products-list-page.tsx` uses a Card grid, not TanStack Table + shared `data-table` wrapper. |
| 11 | Permissions Contract | ❌ FAIL | Zero use of the app's real `useCan()`/`PermissionGate` mechanism anywhere in ecommerce admin. Any authenticated user can create/edit/delete products. |
| 12 | Security Contract | ❌ **FAIL — Critical** | All JSON-LD `dangerouslySetInnerHTML` usages built their body via raw `JSON.stringify()` with no `</script>` escaping — a real stored-XSS path from admin-entered product text through to the public storefront. |
| 13 | Testing Contract | ❌ FAIL (ecommerce-specific) | Zero test files anywhere under `src/features/ecommerce/` or `src/app/store/`, despite the repo having a real, practiced Jest testing convention elsewhere (21 test files in HR/System/auth). |
| 14 | Observability Contract | ❌ FAIL | Sentry integration is a `// TODO` comment repo-wide. No feature-level `error.tsx` for ecommerce admin or `/store`. Zero analytics/event tracking in the storefront. |
| 15 | Internationalization Contract | ❌ FAIL (repo-wide, not ecommerce-specific) | Zero `next-intl`/i18n usage anywhere in the entire app — every page hardcodes Arabic strings, including all pre-existing HR/System pages. |
| 16 | Naming Convention | ✅ PASS | kebab-case files, PascalCase components, `use`-prefixed hooks, all correct. |
| 17 | TypeScript Contract | ✅ PASS | Zero `any`/`as any`/`@ts-ignore`. Fresh `tsc --noEmit`: clean. |
| 18 | Dashboard UX Contract | ⚠ PARTIAL | Search/pagination/loading/empty present. Bulk actions, export, import, and permission checks all absent. |
| 19 | Accessibility Contract | ⚠ PARTIAL | Images have alt text, icon buttons have `aria-label`, dialogs correctly focus-trap via Radix. Two `Select` fields (Availability, Category) had no `htmlFor`/`id`/`aria-label`. No axe-core CI exists anywhere in the repo, so "WCAG AA" was an assertion, not a verified fact. |
| 20 | Error Contract | ⚠ PARTIAL | No loading state / Suspense boundary on storefront Server Component pages; no feature-level error boundary. |
| 21 | AI Agent Rules | ⚠ PARTIAL (self-assessed) | Did not build the missing query-key-factory layer when first touching the feature (Rule #2/#6) — this audit is the correction of that. |
| 22 | Forbidden Patterns | — | See Part 2. |
| 23 | Pull Request Checklist | — | See Part 2/5. |

## Part 2 — Original Forbidden Pattern Audit

| Pattern | Result |
|---|---|
| Direct `fetch(` calls | 0 matches |
| `console.log/error/warn` | 0 matches |
| `eslint-disable` | 0 matches |
| API data inside Zustand | 0 matches |
| `localStorage` (ecommerce/storefront code) | 0 matches |
| **`localStorage` (auth store, repo-wide)** | **Present** — `auth-store.ts:95`, persists `user`/`accessProfile`/`activeCompanyId`/`activeBranchId` |
| **`localStorage` (theme boot script, repo-wide)** | **Present** — `src/app/layout.tsx:9` |
| Inline role/permission checks | 0 matches — because no permission check of any kind exists, not because the correct pattern was used |
| Duplicated API layers | 0 found |
| Raw DTO usage bypassing mapping layer | 0 found |
| Query key missing `companyId` / no factory file | **Present** |
| Missing error boundaries | **Present** — neither `/store` nor `(app)/(ecommerce)` had one |
| `any`/`as any`/`@ts-ignore` | 0 matches |
| `Math.random()` for mock ID generation | Present, flagged (not collision-safe) |
| **Stored-XSS via unescaped JSON-LD** | **Present — most severe finding** |
| Bare toast instead of `setError()` | Present |
| Triplicated `ProductAvailability` label map | Present |
| `dark:` utility classes | 0 matches |
| Arbitrary Tailwind bracket values | 1 minor (duplicated dialog max-height constant) |
| Unlabeled form controls | 2 found (Availability, Category selects) |

## Part 3 — Original Dynamic Company Audit

Only the company id itself (`getStorefrontCompanyId()` → `'demo-company'`) was correctly isolated. Everything else — brand name, logo, favicon, SEO metadata, OpenGraph, Organization JSON-LD, contact info, social links, theme/brand colors, navigation — was either a hardcoded string literal, wired to the wrong (auth-session-based) data source, or missing entirely. Migrating to real multi-company would have required touching `storefront-company.ts`, `seo.ts`, and `storefront-shell.tsx`, plus building net-new Organization JSON-LD/contact/social/logo/per-company-theme wiring.

## Part 4 — Original Architecture Audit

No unnecessary client components; storefront 100% Server Components; admin correctly client-heavy. React Query usage was structurally correct (mutations invalidate on success) but the query-key shape itself was non-compliant and search/pagination state wasn't URL-backed. No duplicated state or API layers. No hydration-mismatch risk introduced by ecommerce code (the pre-existing root-layout theme boot script has this risk, inherited, not introduced).

## Part 5 — Original Production Readiness (before fixes)

| Dimension | Score /100 |
|---|---|
| Architecture | 55 |
| Maintainability | 60 |
| Scalability | 45 |
| Performance | 65 |
| SEO | 60 |
| Accessibility | 55 |
| AI Compliance | 50 |
| Code Quality | 75 |
| Enterprise Readiness | 35 |

**Critical issues:** stored-XSS via JSON-LD; zero permission checks on ecommerce admin CRUD; query keys with no `companyId` isolation.

---

## Classification (Contract Issue vs. Implementation Issue vs. Future Enhancement)

| # | Finding | Class | Reasoning |
|---|---|---|---|
| 1 | Query key: no `companyId` prefix, not in dedicated file | Contract Issue + Implementation Issue | v3.0's exact path (`api/query-keys.ts`, mandatory leading `companyId`) contradicts the codebase's own real convention (`system/permissions/hooks/query-keys.ts`, no `companyId` prefix anywhere in the app). Still fixed for products/categories since it's cheap and a genuine tenant-safety improvement — done via the real house convention (`hooks/query-keys.ts`), not v3.0's untested path. |
| 2 | No `queryClient.clear()` on company switch | Contract Issue | Redundant once keys are `companyId`-prefixed (different company → different cache entry). Wiring it touches global auth-store/QueryClient plumbing used by the whole app — disproportionate blast radius for a redundant safety net. Not done. |
| 3 | Admin search/page state not in URL params | Implementation Issue | Real UX gap, independent of backend readiness, cheap to fix. **Fixed.** |
| 4 | Storefront RSC calls `*Api` directly, no Hook layer | Contract Issue | The contract's Hook-layer definition is Client-Component-only; it has no Server Component row. Code is the only sensible option. Proposing a contract addition, not touching code. |
| 5 | API Consumption Contract unverifiable | Future Enhancement | No real backend exists yet to test against. |
| 6 | `product-form-dialog.tsx` over preferred size | Implementation Issue (light) | Cheap to split. **Fixed.** |
| 7 | Triplicated `ProductAvailability` label map | Implementation Issue | Textbook duplicate-logic risk. **Fixed.** |
| 8 | Theme `localStorage` boot script (root layout, repo-wide) | Future Enhancement | Pre-existing, app-wide, huge blast radius. Out of scope. |
| 9 | Missing 3 ESLint plugins | Future Enhancement | Repo-wide tooling initiative; installing + triaging new lint noise across the whole app is a separate project. |
| 10 | Folder/API path naming (`lib/api/` vs `api/`) | Contract Issue | Cosmetic nesting difference; actual layering (Component→Hook→Api→Domain) is respected. Not worth a repo-wide rename for a naming preference. |
| 11 | Bare toast instead of `setError()` | Future Enhancement | The mock repository never returns field-level validation errors — nothing real to map to a field yet. |
| 12 | Card grid instead of TanStack Table | Contract Issue | A visual, thumbnail-driven product catalog is a legitimate case for a card grid; TanStack Table solves tabular-data ergonomics that don't apply here. Recommending an explicit contract exception for media-heavy entities. |
| 13 | No permission checks in ecommerce admin | Future Enhancement | `useCan()` fails closed. Ecommerce permission codes don't exist in the real backend's permission catalog yet — wiring this today would silently disable create/edit/delete for every user, worse than the current state. Needs real backend permission entries first. |
| 14 | Stored XSS via unescaped JSON-LD | **Implementation Issue — Critical** | Real, exploitable, no valid reason to defer. **Fixed immediately.** |
| 15 | Zero tests on business logic added this session | Implementation Issue | Real gap, cheap to close with the existing Jest convention. **Fixed.** |
| 16 | Contract mandates Vitest+Playwright; repo has Jest only | Contract Issue | Stack mismatch predates this work. Tests written using the actual installed runner (Jest). |
| 17 | Sentry is a TODO comment (repo-wide) | Future Enhancement | Needs a real Sentry account/DSN and app-wide wiring. |
| 18 | Missing `error.tsx` for `/store` | Implementation Issue | Top-level segment with no ancestor error boundary (unlike ecommerce admin). **Fixed** — matches `careers`/`jobs`/`login`'s exact `PublicSegmentError` convention. |
| 19 | Missing `error.tsx` for `(app)/(ecommerce)` | Contract Issue | `(app)/error.tsx` already exists as an ancestor boundary and Next.js error boundaries bubble up automatically. No other HR/System sub-feature has its own `error.tsx` either. Not a real gap. |
| 20 | No i18n anywhere in the app | Future Enhancement | Repo-wide initiative (`next-intl` + wrapping every string in the entire app). |
| 21 | Auth token/session in `localStorage` (repo-wide) | Future Enhancement | Pre-existing, app-wide auth architecture change. |
| 22 | 2 unlabeled Select fields | Implementation Issue | Cheap, real accessibility gap. **Fixed.** |
| 23 | Duplicated dialog max-height class | Implementation Issue (trivial) | One-line fix. **Fixed.** |
| 24 | No loading state / Suspense on storefront | Implementation Issue | Cheap, standard Next.js `loading.tsx`. **Fixed.** |
| 25 | Bulk actions / export / import missing | Future Enhancement | Not meaningful at 2-product mock scale. |
| 26 | **Dynamic Company Audit — everything except companyId** | **Implementation Issue — the explicit ask** | **Fixed** — full Company Config system built. |

---

## Fixes Implemented

### 1. Dynamic Company System (core deliverable)
- `src/features/ecommerce/storefront/domain/company-config.ts` — `CompanyConfig` type covering name, logo, favicon, SEO defaults, contact, social, theme colors, navigation, footer, locale, currency, timezone.
- `src/features/ecommerce/storefront/lib/mock/company-configs.ts` — mock config keyed by `companyId` (mirrors the existing mock-repository pattern).
- `src/features/ecommerce/storefront/lib/api/company-config-api.ts` — `companyConfigApi.getByCompanyId()`, swappable for a real endpoint later.
- `src/features/ecommerce/storefront/lib/get-storefront-company-config.ts` — the single resolver seam, wrapped in React's `cache()` for per-request dedup, calls `notFound()` if a company has no config.
- `storefront-company.ts` now exports **only** `getStorefrontCompanyId()` — the one allowed hardcoded value.
- `storefront-shell.tsx`, `seo.ts` (added `organizationJsonLd()`, converted every metadata builder to take `CompanyConfig`), `store-home-page.tsx`, and all 5 `src/app/store/**` route files rewired to read exclusively from `CompanyConfig`.
- **Verified live**: temporarily changed the mock company name, confirmed the rendered page changed with zero component edits, then reverted.

### 2. Security — Stored XSS fix
- `src/features/ecommerce/storefront/components/json-ld.tsx` — the one sanctioned way to render JSON-LD; escapes `<` before `dangerouslySetInnerHTML`. All 5 call sites converted. Regression test added.

### 3. Query key factories (products, categories)
- `hooks/query-keys.ts` added for both, `companyId` leading every key, matching the real pre-existing house convention (`system/permissions/hooks/query-keys.ts`) rather than v3.0's untested `api/query-keys.ts` path.

### 4. Admin UX
- `products-list-page.tsx`: search/page/pageSize now URL-backed via `useSearchParams`/`router.replace` (ref pattern used to satisfy `exhaustive-deps` correctly, no `eslint-disable`).

### 5. Component architecture
- `product-form-dialog.tsx` split (238→149 lines) into `product-inventory-fields.tsx` (107 lines).
- Single source of truth for `ProductAvailability` labels: `domain/constants/product-availability.ts`.
- Duplicated dialog max-height class extracted to `dialogMaxHeightClass` in `components/ui/dialog.tsx`.

### 6. Accessibility
- Availability and Category `Select` fields now have `htmlFor`/`id`/`aria-label`.

### 7. Error/loading boundaries
- `src/app/store/error.tsx` (matches the `PublicSegmentError` convention used by `careers`/`jobs`/`login`), `src/app/store/loading.tsx` (real skeleton grid).

### 8. Tests
- `product-form-mapping.test.ts`, `format-price.test.ts`, `json-ld.test.tsx` (the XSS regression test) — using the actual installed Jest runner. 3 suites, 12 tests, all passing.

---

## Re-Audit After Fixes

Every item below was re-verified by independent research agents plus direct manual checks — fresh `tsc`, fresh `eslint`, fresh `jest`, a fresh production `build`, and a live edit-and-revert of the mock company config to prove genuine dynamism.

| Area | Result |
|---|---|
| Query Key Contract (products/categories) | ✅ PASS — `companyId` leads every key, dedicated factory files, all mutations invalidate correctly |
| URL-backed admin filter state | ✅ PASS — no `eslint-disable` used |
| Component size | ✅ PASS — 149 / 107 lines |
| Rendering Contract | ✅ PASS — still 100% Server Components, `loading.tsx`/`error.tsx` now present |
| JSON-LD XSS fix | ✅ PASS — exactly one sanctioned `dangerouslySetInnerHTML` remains, all 5 render sites converted, regression test passes |
| No new `eslint-disable`/`console.log` | ✅ PASS — zero, confirmed via fresh grep |
| Error/loading boundaries | ✅ PASS — matches house convention exactly |
| `Math.random()` ID gen | Confirmed still present, classification honored (Future Enhancement, not silently regressed) |
| Accessibility (Select labels) | ✅ PASS — both fields properly labeled |
| Duplicate `ProductAvailability` map | ✅ PASS — single source of truth, 3 consumers updated |
| Theme tokens | ✅ PASS — zero hex/`dark:`/arbitrary values in all new/changed files |
| TypeScript | ✅ PASS — zero `any`, fresh `tsc --noEmit` clean |
| Folder architecture (`query-keys.ts` placement) | ✅ PASS — documented deliberate deviation from v3.0 text, matches real repo precedent |
| Tests | ✅ PASS — 3 suites, 12/12 passing, fresh run |
| **Dynamic Company system (17-point check)** | ✅ **PASS on all 17 items** — verified directly: name/logo/favicon/SEO/OG/Twitter/Organization JSON-LD/contact/social/address/theme/nav/footer/copyright genuinely config-sourced; locale actively used; currency/timezone modeled for future use with explanatory comments; per-product currency display unaffected/still correct |
| ESLint (full touched scope) | ✅ PASS — zero output |
| Production build | ✅ PASS — succeeds, `/store` + all 3 sub-routes present, no errors |

**Overall verdict: migrating the storefront to real multi-company requires changing only `getStorefrontCompanyId()` and/or the mock config's data source — no other storefront file needs to change.**

## Updated Production Readiness Scores

| Dimension | Before | After | Why it moved |
|---|---|---|---|
| Architecture | 55 | **72** | Query-key tenant-isolation fixed for products/categories; clean single-resolver Company Config seam. Capped by: customers/orders admin hooks not yet brought up to the same standard; the Server-Component data-fetching contract ambiguity remains a documentation gap. |
| Maintainability | 60 | **75** | Duplicate logic eliminated, oversized component split, new tests document expected behavior. |
| Scalability | 45 | **78** | The storefront is now genuinely architected as if multi-tenant — the explicit blocker from the original audit is resolved. |
| Performance | 65 | **70** | `loading.tsx`/Suspense added; `cache()` dedupes per-request company-config fetches. No Lighthouse run has actually happened. |
| SEO | 60 | **75** | Organization JSON-LD added and rendered site-wide; JSON-LD pipeline is now provably safe; OG locale/siteName are real. Still missing: sitemap.xml, robots.txt. |
| Accessibility | 55 | **68** | Both unlabeled fields fixed. Still capped: no axe-core CI exists anywhere in the repo. |
| AI Compliance | 50 | **70** | Missing query-key-factory layer was built (per Rule #2), tests added (per Testing Contract), findings classified explicitly (per Rule #7). |
| Code Quality | 75 | **82** | Already strongest; now backed by real tests and less duplication. |
| Enterprise Readiness | 35 | **42** | Modest move — critical XSS fix and observability boundaries help, but no real backend, no i18n, no Sentry, no real permission gating remain, correctly deferred as repo-wide Future Enhancement work. |

## Still Open (by design, not oversight)

**Contract Issues (proposed doc amendments, not code changes):**
- `api/query-keys.ts` path vs. the real established `hooks/query-keys.ts` convention.
- Mandatory `queryClient.clear()` on company switch — redundant once keys are `companyId`-prefixed.
- No Decision Matrix row for "Server Component needs data" in the Data Fetching Contract.
- TanStack Table mandated for "any list/table page" — should have an exception for visual/media-heavy entities.
- Contract mandates Vitest/Playwright; repo has Jest only.
- "One error boundary per feature" wording, when ancestor boundaries already cover most nested segments app-wide.

**Future Enhancements (deliberately deferred):**
- `setError()` field-mapping on mutation failure (nothing real to map against until a real backend returns field errors).
- Permission checks in ecommerce admin (`useCan()` fails closed; no real permission catalog entries exist for ecommerce actions yet — wiring it now would silently break the feature for everyone).
- Sentry integration, i18n (`next-intl`), and the auth/theme `localStorage` architecture — all repo-wide initiatives, not ecommerce-specific.
- Bulk actions / export / import — not meaningful at 2-product mock scale.
- `Math.random()` mock ID generation — fine until a real backend exists.
