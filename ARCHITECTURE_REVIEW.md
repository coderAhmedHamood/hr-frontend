# Architecture Review — Rose HR (Frontend)

**Reviewer stance:** Principal Software Architect, read-only audit. No code was changed to produce this document. Every claim below is backed by a specific file path (and line number where relevant) — this is not a review of the `.cursor/rules/engineering-architecture-FrontendDeveloper.mdc` contract, it is a review of **what the code actually does relative to that contract**. The two disagree in several load-bearing places, and that gap is the most important finding in this document.

**Scope note:** this workspace contains the **Next.js frontend only**. The NestJS backend (controllers, services, database schema, guards) is not in this repository and was not inspected. Anywhere this document describes backend behavior (§3, §4 error flow, §6 authorization), it is inferred from the HTTP contract observed on the frontend (envelope shape, status codes, headers) — not from backend source.

---

## 1. High-Level Architecture

**Style:** Feature-first / vertical-slice, layered on top of Next.js App Router, with a client-heavy rendering model. It is **not** Clean Architecture (no inversion-of-control boundaries, no ports/adapters) and it is **not** a Modular Monolith in the backend sense (there's no enforced module boundary — see §6). It's closest to what the rules document calls it: **"page capsule"** vertical slices, where `app/` is routing-only and `features/{app}/{segment}/...` mirrors the URL 1:1 and owns everything for that page.

**Why this was chosen:** it's the correct default for a single Next.js app with one frontend team, dozens of largely-independent CRUD screens (branches, departments, job titles, leave types, discipline cases, payroll periods...), and Arabic RTL enterprise UI. Vertical slices let one page's code be read, changed, and deleted without touching siblings — valuable when the catalog of pages (60+ routes under `(app)/hr/`) is this large.

**Fit assessment:**

| Concern | Fit | Why |
|---|---|---|
| Large ERP surface | **Good** | Page-capsule mirroring keeps 60+ routes navigable; you always know where `/hr/organization/branches` lives. |
| Multi-team development | **Weak, as implemented** | The pattern gives each *feature* a boundary, but nothing enforces it — see §6. Zero lint rule, zero CI check blocks a feature from reaching into another feature's internals. Two teams working in adjacent features will collide the moment either takes a "just import it" shortcut, and the codebase already shows that shortcut taken repeatedly (§6). |
| Long-term maintainability | **Mixed** | The *shape* (thin route → feature page → hooks → api) is maintainable. The *substance* inside that shape is inconsistent: some features follow the full contract (`payroll/compensation` has real TanStack Query + `query-keys.ts`), most do not (§3/§7 below) — so "maintainability" depends entirely on which feature you land in. |
| AI-assisted development | **Poor today, good on paper** | The `.mdc` rule file is genuinely excellent AI-generation guidance — specific, example-driven, with forbidden-pattern call-outs. But an AI agent onboarding by reading 5 existing features will learn the **actual, non-compliant** pattern (manual `useState`+`useEffect`, Zustand-does-everything) far more often than the compliant one, because that's what's numerically dominant in the codebase (§3, §7). Rules-as-markdown only work if the code teaches the same lesson. |
| Future microservices extraction | **Neutral-to-good** | Because features are path-mirrored and mostly (not entirely — see §6) self-contained, splitting `payroll/` or `discipline/` into a separately-deployed micro-frontend later is plausible. The backend split is a separate, unassessed question (not in this repo). |

---

## 2. Reconstructed Mental Model

### Application Boundary

- **`app/(app)/...`** — routing only. In practice this is respected well: every `page.tsx` I sampled (`hr/organization/departments/page.tsx`, `hr/permissions/catalog/page.tsx`, etc.) is a 3–6 line wrapper that imports one component from `features/` and renders it. This is the one rule in the whole document that's near-universally followed.
- **`features/{app}/{segment}/...`** — the actual page. Owns its own `components/`, `hooks/`, `lib/api/`, `dialogs/`, `constants/`, `types/`, `services/` (when triggered). Mirrors the route path (`features/hr/organization/branches/` for `/hr/organization/branches`).
- **`shared/`** — genuinely app-agnostic: `shared/config/index.ts` (env), `shared/utils.ts` (`cn()`), `shared/i18n/`, `shared/app-paths.ts` (route-family predicates like `isHrAppPath`), `shared/api-base-url.ts`. No feature-specific logic found leaking in here.
- **`components/`** — split as intended: `components/ui/*` is presentation-only (Radix wrappers, `DataTable`, `Dialog` primitives), `components/layouts/*` is app-shell (Topbar, Sidebar, page-title context), `components/shared/*` is business-aware-but-cross-feature (`Can` permission gate, `duration-minutes-display`, `forbidden-state`).

### Domain Boundary

- **`services/`** exists in a minority of features (e.g. `payroll/compensation`, some `discipline` sub-features) and is skipped everywhere else — largely *correctly* skipped per the doc's own §0 Simplicity Override, since most CRUD pages here really have no transformation logic beyond mapping a DTO to a display row.
- **`lib/api/*.ts`** is the one domain layer that's **universally present and universally correct**. Every feature I opened — `permissions/lib/api/permissions.ts`, `attendance/lib/api/attendance-events.ts`, `organization/branches` (now moved, see note below) — is a flat object of typed functions calling `apiRequest()`. No `fetch()`, no `axios`, no raw envelope handling leaking into components. This is the strongest layer in the codebase.
- **`types/`** is inconsistently co-located — some features define DTOs inline in the `lib/api/*.ts` file (e.g. `PermissionResponseDto` in `permissions.ts` itself) rather than a separate `types/`. Acceptable under §0 Simplicity Override; not a violation.
- **`constants/`** correctly holds route helpers (`hrOrganizationRoutes`, `hrPermissionsCatalogHref()`) and nav group definitions consumed by `Topbar`/`Sidebar`.

### Data Boundary

- **This is the biggest gap between doc and code.** The doc mandates TanStack Query for "any API-backed resource" (§11 table). In reality: only **~26 files** in the entire `src/` tree call `useQuery`/`useMutation`, concentrated in `auth/`, `payroll/compensation`, `recruitment`, `contracts` (partially), and the newly-reviewed `permissions`/`organization settings` features. Meanwhile **attendance, requests (leave/overtime/attendance-corrections), discipline, most of organization (branches/departments/job-titles/contacts/companies), leaves, and notifications** — the majority of the app by page count — fetch via `React.useState` + `React.useEffect` + manual try/catch, exactly the pattern the doc calls out under §9 and §25 as **"Absolute Rules (no exceptions)"** and forbidden.
- **Cache keys**: exactly **one** `query-keys.ts` exists in the whole repo (`payroll/compensation/hooks/query-keys.ts`). Every other TanStack Query consumer either inlines keys or — more commonly — doesn't use TanStack Query at all, so the concept doesn't apply.
- **The API client** (`features/hr/lib/api/client.ts`) is a real, single, well-built HTTP layer — see §8 below. It is the actual source of truth for "how does data get from browser to backend," independent of whether the calling hook uses React Query or `useEffect`.

### UI Boundary

- **Page components**, **section components**, **dialogs** are separated as prescribed — one dialog per file is respected almost everywhere I looked (`role-form-panel.tsx`, `delete-role-dialog.tsx`, `assign-users-dialog.tsx`, `branch-detail-dialog.tsx`, etc.).
- **Zustand stores**: 30 stores exist. A **majority of the non-trivial ones fetch data themselves** — this is the second-biggest gap (see §7). `useHREmployeeDirectoryStore.fetch()` (`features/hr/requests/lib/employee-directory-store.ts:65-75`) calls `employeesApi.list({ companyId, limit: 500 })` directly inside the store action. At least 15 stores follow this shape (`contracts-store.ts`, `violation-cases-store.ts`, `payroll-periods-store.ts`, `attendance-correction-store.ts`, `configuration-store.ts`, and ten more). The doc's own forbidden-patterns list literally names this exact shape as violation #1 under §11 and even references *"god Zustand stores (26+ stores each doing data fetch)"* — meaning this was already flagged once, at a smaller count, and has since grown to 30.

---

## 3. Complete Request Lifecycle — `/hr/organization/branches` *(as the code actually behaves, not as the doc prescribes)*

> Note: at the time of this review, `branches` was mid-migration from `features/hr/organization/branches` to `features/system/organization/branches` as part of a separate, in-progress task (see the paused refactor in this session's history) — the trace below describes the pattern, which is identical regardless of which top-level segment (`hr` or `system`) currently owns the folder.

1. Browser requests `GET /hr/organization/branches`.
2. Next.js App Router resolves `app/(app)/hr/organization/branches/page.tsx` — a Server Component, 3–5 lines, `export default function Page() { return <BranchesPage />; }`.
3. `BranchesPage` (imported from `features/.../branches/components/branches-page.tsx`) is a **Client Component** (`'use client'`) — required immediately because it uses hooks and interactive UI (dialogs, filters).
4. Inside `BranchesPage`, a directory-model hook (pattern: `useBranchesDirectoryModel()`, mirroring the same shape as `useOvertimeRequestsDirectoryModel` and `useJobTitlesDirectoryModel` that were opened directly in this session) is called. **This hook does not use `useQuery`.** It composes `React.useState` for filters/pagination plus a shared `useServerDirectoryPagination()` utility hook that itself wraps a manual `loadPage(page, pageSize)` callback in a `useEffect`.
5. `loadPage` calls `branchesApi.list(query)` — a typed wrapper in `lib/api/branches.ts`.
6. `branchesApi.list` calls `apiRequest<PaginatedResult<Branch>>('/branches', { query })` (from `features/hr/lib/api/client.ts`).
7. `apiRequest` builds the URL via `buildUrl()`: `resolveApiBaseUrl(publicConfig.apiUrl)` — on `localhost` this resolves to the value of `NEXT_PUBLIC_API_URL`; on a non-localhost host where that env var still points at `localhost`, it silently rewrites to `/api-backend` (relative), which `next.config.mjs`'s `rewrites()` proxies to `${BACKEND_URL}/:path*` server-side.
8. `apiRequest` reads the access token via `getAccessTokenFromCookie()` — **a plain, JS-readable `document.cookie` read, not an HttpOnly cookie** (see §15 flag below) — and sets `Authorization: Bearer <token>` manually, **in addition to** `credentials: 'include'`. Both mechanisms are present simultaneously, which is itself a smell: the code is defending against two different session models (bearer-in-header vs. cookie-in-browser) at once.
9. `fetch()` hits the NestJS backend (out of repo). Presumed flow there: controller → service → repository/ORM → Postgres (or whatever the backend uses) → the documented envelope shape.
10. Backend responds `{ status: 200, message, data: { items, pagination }, error: null }` (confirmed shape from `ApiSuccessEnvelope`/`isApiSuccessEnvelope` in `features/hr/lib/api/types.ts`, and from the live `daily-breakdown` response seen earlier in this session).
11. `apiRequest` checks `response.ok`; on success calls `unwrapEnvelope<T>(payload)`, which returns `payload.data` directly — so every caller of `apiRequest` gets `{items, pagination}`, never the outer envelope.
12. Back in the directory-model hook: the unwrapped result is pushed into local component/hook state (`React.useState`), **not** a `queryClient` cache.
13. `BranchesPage` re-renders directly off that local state — no cache layer, no automatic background refetch, no cross-component cache sharing. If a dialog on the same page also needs the branches list, it either re-fetches independently or the list is threaded down as props — TanStack Query's main value proposition (shared, deduped, auto-invalidated cache) is unrealized here.

**Compare to the one feature that actually follows the documented pattern** (`payroll/compensation`): steps 4–13 there instead go through `useQuery({ queryKey: PAYROLL_KEYS.summary(periodId), queryFn: () => payrollApi... })`, giving automatic caching, refetch-on-window-focus, and `invalidateQueries` after mutations. This is the "gold copy" the rest of the app should be measured against — and isn't.

---

## 4. Sequence Diagrams

### Read Flow (as implemented in most features — manual fetch, not TanStack Query)

```
Browser          AppRouter        FeaturePage        Hook (useState+useEffect)   API module        apiRequest        NestJS
  |  GET /route      |                 |                       |                     |                 |               |
  |----------------->|                 |                       |                     |                 |               |
  |                  |--render page.tsx>|                       |                     |                 |               |
  |                  |                 |--mount, call hook----->|                     |                 |               |
  |                  |                 |                       |--useEffect fires---->|                 |               |
  |                  |                 |                       |                       |--xApi.getAll()->|               |
  |                  |                 |                       |                       |                 |--fetch()----->|
  |                  |                 |                       |                       |                 |               |--controller/service/db-->|
  |                  |                 |                       |                       |                 |<--envelope----|               |
  |                  |                 |                       |                       |<--unwrap(data)--|               |
  |                  |                 |                       |<--setState(data)------|                 |               |
  |                  |                 |<--re-render with data-|                       |                 |               |
  |<-----------------|-----------------|-----------------------|                       |                 |               |
```

No cache node exists in this diagram — every remount/refocus re-runs the full chain. That's the structural cost of the `useEffect` pattern vs. TanStack Query.

### Mutation Flow — "Create Branch" (as implemented, not via `useMutation`)

```
User          Dialog/Form        Directory-model hook        branchesApi          apiRequest        NestJS
 |  click Save    |                    |                          |                   |               |
 |--------------->|                    |                          |                   |               |
 |                |--call handleCreate->|                          |                   |               |
 |                |                    |--branchesApi.create(dto)->|                   |               |
 |                |                    |                          |--apiRequest POST->|               |
 |                |                    |                          |                   |--fetch------->|
 |                |                    |                          |                   |<--envelope-----|
 |                |                    |<--unwrapped result--------|                   |               |
 |                |                    |--await reloadList()  ← manual re-fetch of full list, no invalidateQueries
 |                |                    |--toast.success('...')  ← hardcoded Arabic, not getTranslations()
 |                |<--setDrawerOpen(false)                        |                   |               |
 |<---------------|--re-render---------|                          |                   |               |
```

The "cache invalidation" step in the doc's canonical mutation flow doesn't exist here — it's replaced by an explicit `await reloadList()` call that re-runs the same manual fetch. Functionally similar outcome, structurally a hand-rolled reimplementation of what a `queryClient.invalidateQueries()` call gets for free (dedup, background refetch, stale-while-revalidate).

### Error Flow — 401 / 403 / 5xx

```
NestJS            apiRequest                          Hook/caller                    handleApiError            UI
  |--401/403/5xx--->|                                    |                               |                      |
  |                 |--!response.ok, parse envelope------>|                               |                      |
  |                 |--throw new ApiError(envelope, ...) ->|                               |                      |
  |                 |                                    |--catch(err)------------------->|                      |
  |                 |                                    |                               |--handleApiError(err)-->|
  |                 |                                    |                               |                       |--toast.error(displayMessage)
```

- **Interception point**: purely at the call-site `try/catch` in each hook/handler — there is **no** global `fetch` interceptor, no axios-interceptor-equivalent, and no React Query `onError`/global `QueryCache` error handler (consistent with §3's finding that most features don't use React Query). Every one of the ~100+ mutation handlers in the codebase repeats its own `try { ... } catch (err) { const { displayMessage } = handleApiError(err, 'context-tag'); toast.error(displayMessage); }` block.
- **401 redirect**: the doc mandates `401 → redirect to /login?returnTo=...`. I did not find this redirect wired centrally in `apiRequest` or in a shared interceptor — `apiRequest` only throws `ApiError`; whether a 401 actually redirects depends on whatever the specific caller's catch block does, which is inconsistent by construction (100+ independent catch blocks = 100+ chances to forget the redirect).
- **Toasts**: `handleApiError()` (`features/hr/lib/api/global-error-handler.ts`) is consistently used — this part of the contract *is* followed almost everywhere.
- **Error boundaries**: **none exist.** No `components/error-boundary.tsx`, no `error.tsx` under any `app/(app)/...` route, despite §3 and §8a both marking these as **mandatory**. An uncaught render error anywhere in the tree currently produces Next.js's default (unstyled, non-Arabic, non-RTL) error screen, not the Arabic fallback the doc specifies.

---

## 5. Folder Structure — Responsibility Table

| Folder | Ownership | Allowed imports | Forbidden imports | Actual adherence |
|---|---|---|---|---|
| `app/(app)/**/page.tsx` | Routing only | `features/{mirror-path}/components/*Page` | Business logic, `lib/api`, hooks | **High** — near-universal thin wrapper. |
| `features/{app}/{segment}/components/` | Page & section UI | own hooks, own dialogs, `components/ui`, `components/shared` | other features' internal components | **Mostly high**, with confirmed exceptions (§6). |
| `features/{app}/{segment}/hooks/` | Data + UI state for that page | own `lib/api`, own `services`, Zustand (if UI-only) | direct `fetch`/`apiRequest` | **Split personality** — either a clean TanStack Query hook or a `useState`+`useEffect` hook masquerading as one; both "hook" in name only. |
| `features/{app}/{segment}/lib/api/` | REST client for that resource | `features/hr/lib/api/client.ts` only | any other transport | **Excellent, consistent.** |
| `features/{app}/{segment}/services/` | Pure transformation/orchestration | types, own api types | `apiRequest`, React | Present only where triggered — correctly sparse. |
| `features/{app}/{segment}/dialogs/` | One dialog per file | own hooks | — | Well followed. |
| `components/ui/` | Presentation primitives | nothing feature-specific | any `features/*` import | Clean. |
| `components/shared/` | Cross-feature, business-aware | `features/*` allowed here by design | — | Correct usage (`Can`, `forbidden-state`). |
| `shared/` | App-wide, no domain | nothing from `features/*` | domain API calls | Clean. |
| Zustand stores (wherever they live) | UI-only state | — | `apiRequest`/`*Api.*` calls | **Violated in ~15 of 30 stores** (§7). |

---

## 6. Dependency Rules — What Actually Happens vs. What's Declared

**Declared** (§4 of the rules doc): *"Feature A must never import from Feature B's internal components. Cross-feature sharing goes through `components/ui/`, `components/shared/`, or `shared/`."*

**Observed reality:** this rule is **broken by design in at least one structurally significant place**, and the doc's own example tree (§2 of the rules doc) contradicts its own rule:

- The rules doc's reference tree lists `organization/employees/`, `organization/contacts/`, `organization/permissions`-adjacent features as siblings under one `organization/` parent — implying they're peers. In the actual code, `features/hr/organization/employees/hooks/useEmployeeProfilePermissions.ts` and `.../components/sections/employee-permissions-section.tsx` import directly from the sibling `permissions` feature's **internals** (`components/roles-assignment-editor`, `lib/permission-labels`, `hooks/use-user-roles-permissions-model`) — not through `components/shared/` as the rule requires. This was independently confirmed in this session while scoping an unrelated route-migration task.
- This isn't a one-off typo; it's the *only* real cross-feature dependency in the org module, meaning the "sibling features are isolated" claim is already false for the two most important sibling features (employees ↔ permissions).
- No lint rule (e.g. `eslint-plugin-boundaries`, `import/no-restricted-paths`) enforces this anywhere in `.eslintrc`/`eslint.config` — the rule is prose-only, so nothing stops it from happening again, silently, at scale.

**Actual dependency direction observed:**

```
app/ (routing)
  ↓
feature components  ────────┐
  ↓                          │ (leak, unenforced)
hooks (TanStack Query OR manual useState+useEffect — inconsistent)
  ↓                          │
Zustand stores  <────────────┘ (frequently ALSO calls API directly — §7)
  ↓
lib/api modules
  ↓
apiRequest()
```

The double arrow into Zustand is the real deviation from the doc's intended single-direction flow: state that should be a pure sink (UI toggles) is also a data source (fetch results), so two different "current truth" holders exist for the same resource in several features (e.g. `employee-directory-store` vs. any local component state also caching a filtered view of employees).

**Circular dependency prevention:** no tooling enforces this (no `madge`/dependency-cruiser check found in `package.json` scripts). Risk is currently latent, not realized, but nothing prevents it as the codebase grows.

---

## 7. Server State vs. Client State — Why the Split Exists, and Where It's Broken

**Why TanStack Query, in principle:** dedup identical in-flight requests, cache across component remounts, background refetch, declarative loading/error state, automatic invalidation after mutation — all without hand-written `useState`/`useEffect` bookkeeping.

**Why Zustand should be UI-only:** Zustand has no concept of staleness, no request dedup, no cache invalidation semantics — it is a plain mutable-state container. Using it as a data cache means **you** become responsible for everything TanStack Query gives for free, and you will re-derive it inconsistently across 30 different stores (which is exactly what's happened — some stores refetch on every mount, some cache indefinitely with no invalidation at all, some expose a manual `reload()` that callers must remember to invoke).

**Concrete risk already present, not hypothetical:**
- `useHREmployeeDirectoryStore` fetches up to 500 employees into a module-level Zustand store (`employee-directory-store.ts:75`) — this list is then shared, uninvalidated, across every page that imports the store (attendance corrections, overtime requests, leave requests, discipline...). If an employee is created/deactivated on one page, every *other* open tab/page holding this store's data is stale until a manual `fetch()` is triggered again — there is no automatic cross-consumer invalidation, because Zustand has no query-key graph to invalidate.
- The 500-record cap itself violates the doc's own §18a ("never fetch more than 50 records for a dropdown/picker; use server-side search"). At current headcount this is probably fine; it will not be fine at 2,000 employees, and nothing in the code paths would surface that failure until someone hits it in production (silent truncation — no logged warning when `total > 500`).

**Server / Client / Derived / Draft, mapped to this codebase:**
| State kind | Correct home | Actual home (most features) |
|---|---|---|
| Server state (list of branches) | TanStack Query cache | Zustand store *or* local `useState` in a directory-model hook |
| Client state (drawer open, active tab) | Zustand / local `useState` | Correctly local `useState` almost everywhere (good) |
| Derived state (filtered/sorted list) | `useMemo` over query data | `useMemo` over Zustand/local state — mechanically fine, but derived from a state source with no freshness guarantee |
| Draft state (in-progress form) | Zustand (per the doc's explicit exception) or local `useState` | Local `useState` in every form dialog observed — no violation here |

---

## 8. API Architecture

`features/hr/lib/api/client.ts` is the single, well-designed transport layer, and it's the part of this codebase I'd point to as exemplary:

- **Base URL resolution** (`resolveApiBaseUrl` in `shared/api-base-url.ts`): reads `publicConfig.apiUrl` (itself sourced only from `NEXT_PUBLIC_API_URL`, correctly funneled through `shared/config`); if the page is served from a non-localhost host but the configured API URL still points at `localhost`, it falls back to the relative `/api-backend` path instead of hard-failing — a genuinely thoughtful dev/LAN/tunnel-friendly design.
- **`/api-backend` rewrite**: `next.config.mjs`'s `rewrites()` proxies `/api-backend/:path*` → `${BACKEND_URL}/:path*}` server-side, so the browser never needs to know the real backend host in that mode.
- **Auth**: sets `Authorization: Bearer <token>` from `getAccessTokenFromCookie()` **and** `credentials: 'include'` on every request. See §15 for why the *token source* here is the single most serious finding in this review.
- **Envelope**: `unwrapEnvelope<T>()` handles both the canonical `{status, message, data, error}` shape and a legacy `{success: true, data}` shape defensively — resilient, if slightly indicative of a backend contract that has changed shape at least once already.
- **Error handling**: `ApiError` carries the parsed envelope, raw payload, and HTTP status uniformly; every failure path — malformed JSON, structured error body, empty body — degrades to a coherent typed error rather than throwing an unhandled parse exception.

**Why `lib/api/*.ts` files are "just typed wrappers," and why that's correct:** `branchesApi.getAll()` has exactly one job — know the resource's URL and DTO shape. It does not know about React, does not know about the calling component's loading state, does not know about caching. That separation is what makes the frontend URL and the backend URL genuinely unrelated concerns: `/system/organization/branches` (frontend route) and whatever path `branchesApi` calls (e.g. `/branches` or `/hr/branches`, backend route) are two independent strings that happen to both live in this codebase but are resolved by two different systems (Next.js router vs. `apiRequest`'s `buildUrl`). **Moving a page's URL never requires touching its `lib/api/*.ts` file, and vice versa** — this was directly exercised in this session's HR→System page-migration task, where ~100 files moved route folders with zero backend-endpoint changes.

---

## 9. `app/api` Usage

**Current usage — exactly one route, and it's justified:** `src/app/api/public/recruitment/jobs/route.ts`. It exists because the public careers-page job list needs a server-side proxy that (a) can fall back to a service-account bearer token when no user is logged in, and (b) filters `isActive` server-side before any payload reaches an anonymous browser. That's a legitimate BFF (backend-for-frontend) use — unauthenticated aggregation/filtering that shouldn't be reimplemented client-side.

**When `app/api` should exist, generally:**
- BFF endpoints that need a secret the browser must never see (service tokens, third-party API keys).
- Server-side response shaping/filtering for public/unauthenticated consumers.
- Aggregating multiple backend calls into one response to cut client round-trips.
- Signed-URL issuance, webhook receivers, edge caching of otherwise-uncacheable data.

**When it should NOT exist (and correctly doesn't, elsewhere in this repo):**
- Simple authenticated CRUD — the browser already has a valid session cookie/token; proxying through a Next.js route handler only adds a hop, not security.
- Passthrough requests with no transformation — pure latency and maintenance cost.
- Anything that's page-URL-driven rather than data-driven — e.g. moving `/hr/permissions/catalog` to `/system/permissions/catalog` is a routing change with zero bearing on how `permissionsApi.getAll()` talks to the backend; wrapping it in an `app/api` route would be pure ceremony.

**Tradeoff, stated plainly:**

```
Browser → Backend                       Browser → Route Handler → Backend
- 1 network hop                          - 2 network hops (added latency, ~5-50ms typically)
- 1 place to debug                       - 2 places to debug (is it the route handler or the backend?)
- No duplicate envelope-parsing logic     - Risk of a second, subtly different envelope-parsing implementation
- Correct default for authenticated CRUD - Only worth the cost when you need what only a server context can give you
```

This repo gets this tradeoff right today — one justified exception, everything else direct. The risk is purely for the *future*: nothing stops the next engineer from reaching for `app/api` out of habit for a case that doesn't need it (e.g. "let me just proxy this one call too"), since there's no written rule in the `.mdc` doc about when `app/api` is/isn't appropriate — that section doesn't currently exist in the architecture contract.

---

## 10. Scalability Review

| Dimension | Assessment |
|---|---|
| **50+ modules** | Structurally fine — page-capsule pattern scales horizontally by design; adding module #51 doesn't touch module #1–50. |
| **Multiple teams** | **At risk.** No enforced boundary (§6) means two teams *will* eventually take the "just import the internal component" shortcut under deadline pressure, exactly as already happened once (employees ↔ permissions). Without a lint-enforced boundary, this compounds — every unenforced cross-import is a future merge conflict / silent breaking change waiting to happen when either feature refactors. |
| **Turborepo** | Currently a single Next.js app, no monorepo/workspace config, no `turbo.json`. Nothing blocks adopting Turborepo later, but nothing has been done to prepare for it either (e.g. no clean `packages/ui`, `packages/config` extraction) — this would be a from-scratch project. |
| **Microservices extraction** | Frontend-side, plausible per-feature (page capsules are already close to independently deployable slices). Backend-side, unassessed (out of repo). |
| **WebSocket integrations** | No infrastructure found for this today (no socket client, no `useWebSocket`-style hook). Would be a new capability, not an extension of an existing pattern — worth deciding upfront whether it becomes a TanStack Query companion (query invalidation on socket event) or a separate Zustand-driven live-state layer, before multiple features invent their own answer independently. |
| **Background jobs** | Nothing in-repo to assess (frontend has no job-runner surface beyond triggering backend endpoints); this is a backend concern. |
| **Audit logging** | No frontend audit trail construct found (no `useAuditLog`, no interceptor logging mutations). If this is required, it belongs at `apiRequest()` (one place) rather than per-hook — the client layer is the correct single choke point for it, and it's currently the *only* layer good enough to add this to without a rewrite. |
| **AI-assisted development** | The `.mdc` rule file is a real asset — specific, example-driven, includes forbidden-pattern lists. But an AI agent (or new hire) that reads the *code* before the *doc* will learn the dominant, non-compliant pattern. Doc-vs-code drift is the single biggest threat to this working going forward — a rules file only teaches correctly if the codebase reinforces it majority-of-the-time, and right now it's roughly inverted for two of the doc's most emphasized rules (§9/§11 TanStack Query, §11 Zustand-is-UI-only). |
| **Mobile applications** | The API client / envelope contract is transport-agnostic and reusable from a future RN/mobile client with zero backend change — genuinely well-positioned here, since `lib/api/*.ts` files don't know they're being called from a browser. |

**Concrete bottlenecks, ranked by how much they'll hurt as this scales:**

1. **No enforced feature-boundary lint rule** — cheapest to fix, highest leverage; every day without it makes the next violation "the precedent" that's harder to walk back.
2. **Zustand-as-data-cache in 15+ stores** — each one is an independent, hand-rolled reimplementation of what React Query gives for free; as the employee/branch/department counts grow, each of these becomes its own tuning problem (stale data, unbounded lists, no request dedup).
3. **No `error.tsx`/`error-boundary.tsx` anywhere** — currently invisible because nothing has crashed loudly enough in production to notice; the day it does, users see Next's default English error screen in an Arabic RTL enterprise app.
4. **Auth token readable from `document.cookie`** — see §15, this is a security bottleneck, not a scale one, but it caps how seriously this app can be called "production-hardened" regardless of how well everything else scales.

---

## 11. Architecture Assessment

### Executive Summary

The transport layer (`apiRequest`, envelope handling, error typing) and the routing layer (thin `page.tsx` → feature component) are genuinely well-built and consistently applied — these are the two things every future engineer can trust without re-verifying. Everything above those two layers — data fetching (React Query vs. manual `useState`), state ownership (Zustand-as-cache), cross-feature boundaries (unenforced), error resilience (no boundaries), and i18n (hardcoded Arabic strings observed repeatedly across the features touched in this very session — status label maps redefined per file, hardcoded toast strings) — is **specified rigorously in the `.mdc` architecture contract but followed inconsistently in the actual code**, in some cases (React Query adoption, Zustand fetching, error boundaries) not followed at all in the majority of the codebase. This is not "no architecture" — it's "a good architecture on paper, adopted by roughly a third of the codebase, with the other two-thirds pre-dating the doc and never migrated."

### Architectural Style Classification

Feature-first / vertical-slice on Next.js App Router, client-heavy rendering, with a domain layer that's strong (`lib/api/`) and a data layer that's split between a correct pattern (TanStack Query, ~1/3 adoption) and an incorrect legacy pattern (manual fetch + Zustand-as-cache, ~2/3 of the codebase).

### Strengths

- `apiRequest()` / envelope / error-typing — one correct implementation, used everywhere, zero duplication.
- Thin route wrappers — `app/` never carries business logic; verified across every sampled route.
- `lib/api/*.ts` isolation — frontend routes and backend endpoints are provably decoupled (exercised directly in this session's page-migration work).
- `dialogs/` one-file-per-dialog discipline — consistently followed.
- The `.mdc` doc itself — specific, example-driven, forbidden-pattern-annotated. Rare to see an internal architecture doc this concrete.

### Weaknesses

- TanStack Query mandated for "any API-backed resource," actually used in ~26 files while the majority of list/CRUD pages use manual `useState`+`useEffect`.
- Zustand mandated as UI-only with API calls explicitly forbidden inside store actions; **at least 15 of 30 stores violate this directly**, including a 500-record unbounded employee list fetch.
- Only 1 `query-keys.ts` exists despite dozens of features having ≥3 queries once React Query is actually adopted.
- Zero `error-boundary.tsx`, zero `error.tsx` under any route — both explicitly mandatory in the doc, both entirely absent.
- Cross-feature import violation between `employees` and `permissions` — the exact pattern the doc's §4 rule forbids, present in production code today.
- Hardcoded Arabic strings and duplicated status-label maps across multiple `*-client.tsx` files (directly observed in `attendance-correction-requests-client.tsx`, `overtime-requests-client.tsx` earlier this session) — contradicts §16's "no hardcoded strings" mandate, which even names this exact anti-pattern.
- No lint/CI enforcement of any of the above — every rule in the `.mdc` file is prose-only; nothing fails a build or a PR check when violated.

### Risks

- **Security**: auth token stored in a plain, non-`HttpOnly`, JS-readable cookie and manually attached as a bearer header (`auth-cookie.ts` + `client.ts:122-124`) — directly contradicts the architecture doc's own §15b, which explicitly forbids exactly this pattern and explains why (XSS token theft). This is the most serious single finding in this review. `i.pravatar.cc` also remains a permitted image host in `next.config.mjs`, which the doc's own §15e names as a forbidden production pattern.
- **Doc/code drift compounding over time**: every new feature built by copying an existing (non-compliant) feature as a template inherits and re-teaches the wrong pattern. The gap will not self-correct; it will only close via a deliberate migration or a lint gate.
- **Unbounded list fetches** (500-employee cap, no server-side search fallback documented) will degrade silently as headcount grows — no current instrumentation would surface this before a user notices slow page loads.
- **No production error visibility**: no Sentry, no error boundary, no `error.tsx` — a crash in production is currently invisible to the team until a user reports it manually.

### Recommendations (ranked by leverage / cost)

1. **Fix the auth cookie immediately.** Move the access token to a real `HttpOnly` cookie set by the backend; delete `getAccessTokenFromCookie`/`setAccessTokenCookie` client-side manipulation entirely; rely on `credentials: 'include'` alone. This is a security fix, not a refactor — highest priority regardless of anything else in this document.
2. **Add the global error boundary and per-route `error.tsx`.** Small, one-time cost; directly closes a mandatory-but-missing requirement with an existing reference implementation already written in the `.mdc` doc (§8a) — it just needs to be created as an actual file.
3. **Add one `eslint-plugin-boundaries` (or `import/no-restricted-paths`) rule** encoding §4's cross-feature import ban. This is the single highest-leverage change for multi-team scalability — it turns a prose rule into a CI failure, which is the only thing that reliably prevents recurrence.
4. **Stop new features from adding fetch logic to Zustand stores** — enforce via the same lint boundary rule (Zustand files may not import `lib/api/*`). Do not attempt to migrate all 15 existing violators at once; gate new code, migrate existing stores opportunistically as those features are touched anyway.
5. **Pick TanStack Query as the actual default going forward and say so explicitly in one place** — the doc already mandates this; the gap is adoption, not specification. Every *new* list/CRUD hook should use it; existing `useState`+`useEffect` hooks don't need a forced migration sprint, but should migrate whenever that specific hook is touched for other reasons ("boy scout rule").
6. **Add a written `app/api` usage policy to the `.mdc` doc** (this review's §9 is a reasonable starting draft) — currently the doc is silent on when route handlers are appropriate, leaving it to individual judgment call each time.

### Scores

| Dimension | Score | Rationale |
|---|---|---|
| **Scalability** | 6/10 | Structure scales horizontally; state-management inconsistency and unenforced boundaries will cost real time as team/module count grows. |
| **Maintainability** | 5/10 | Excellent in the transport/routing layers; inconsistent everywhere data-fetching and state ownership are decided, which is most of the day-to-day feature work. |
| **Enterprise Readiness** | 4/10 | The security finding (§15, auth token handling) alone caps this; combined with zero error boundaries and zero CI-enforced architecture rules, this is a codebase with a good architecture document sitting next to a codebase that only partially implements it.
