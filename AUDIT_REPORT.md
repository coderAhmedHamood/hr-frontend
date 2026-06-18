# HR System Frontend — Complete Codebase Audit Report

> **Audited by:** Senior Software Architect / Staff Engineer  
> **Date:** 2026-06-18  
> **Codebase:** `rose-hr` — Arabic-first enterprise HR management platform  
> **Stack:** Next.js 16 · React 19 · TypeScript 6 · Tailwind 4 · Zustand 5 · TanStack Query 5  
> **Total source files:** 623 TypeScript/TSX files

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Folder & File Structure](#2-folder--file-structure)
3. [Code Quality](#3-code-quality)
4. [Scalability Review](#4-scalability-review)
5. [Security Review](#5-security-review)
6. [Performance Review](#6-performance-review)
7. [Error Handling](#7-error-handling)
8. [Testing](#8-testing)
9. [Dependency Review](#9-dependency-review)
10. [Developer Experience](#10-developer-experience)
11. [Production Readiness Assessment](#11-production-readiness-assessment)
12. [Refactoring Opportunities](#12-refactoring-opportunities)
13. [Technical Debt Report](#13-technical-debt-report)
14. [Executive Summary](#14-executive-summary)

---

## 1. Project Architecture

### Overview

The project follows a **Feature-Sliced Design (FSD)** pattern layered on top of Next.js App Router. The top-level decomposition is clean:

```
src/
├── app/           # Next.js routing shell (thin wrappers only)
├── components/    # Shared UI components (shadcn/ui + layouts)
├── features/      # Domain feature slices (auth + hr sub-domains)
└── shared/        # Cross-cutting utilities (config, utils, export)
```

The domain separation into `features/hr/{domain}` is a genuine strength. Each feature has its own `components/`, `hooks/`, `lib/api/`, `services/`, and `types/` sub-folders — giving good local cohesion.

### Architecture Score: **6 / 10**

### Key Strengths

- **Page = thin shell** convention is well-enforced. App Router pages are one-liners that delegate to feature components.
- **Custom HTTP client** (`client.ts`) is a clean abstraction — handles envelope unwrapping, error shape normalisation, and the dev/prod URL switch.
- **Shared API error handler** (`global-error-handler.ts`) centralises error display and 401 redirect logic.
- **Zod + React Hook Form** is a mature combination for form validation with type-safe schemas.
- **Bilingual DTOs** (`nameAr` / `nameEn`) are consistently applied across all entities.

### Critical Weaknesses

#### 1. Dual Routing for Payroll (Architectural Confusion)

Payroll pages exist under **two separate route trees**:
- `/hr/contracts/payroll-periods` → redirects to → `/hr/payroll/payroll-periods`
- `/hr/contracts/period/[periodId]/compensation` → still live under contracts path

The README documents contracts as the canonical path, while the actual feature code lives under `features/hr/payroll/`. The `contracts` route group has become a legacy-redirect zone, but this is not documented and confuses future developers.

#### 2. Zustand Stores Acting as Data-Fetching Layers (Violates SRP)

The pattern used across 20+ stores (`payroll-periods-store.ts` at 630 lines, `contracts-store.ts` at 348 lines) is:

```typescript
// Anti-pattern: store mixing state ownership + data fetching + business logic
const useHRPayrollPeriodsStore = create((set, get) => ({
  periods: [],
  isLoading: false,
  error: null,
  
  loadPeriods: async () => {  // ← This belongs in TanStack Query
    set({ isLoading: true });
    const data = await payrollPeriodsApi.getAll();
    set({ periods: data, isLoading: false });
  },
  
  buildAdminDirectInputNote: (note) => { ... }  // ← Business logic in store
}));
```

This duplicates what TanStack Query already does for server-state (caching, invalidation, loading/error states), removes the benefits of automatic cache invalidation, and creates a "manual refresh" problem. The codebase inconsistently uses TanStack Query (correctly in `useEmployees.ts`) and Zustand stores (incorrectly in most other places) for the same purpose.

#### 3. No i18n System

Every Arabic string is hardcoded inline throughout 623 files:
```typescript
// In violation-cases-client.tsx
const STATUS_LABELS: Record<ViolationRecordStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  // ...
};

// In unified-management-client.tsx (same strings, redefined)
const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  // ...
};
```

This makes any future English-language support require touching 600+ files.

#### 4. Store Explosion (26+ Zustand Stores)

There are 26+ separate Zustand stores, each with identical loading/error patterns. This creates high maintenance overhead for what is essentially repetitive boilerplate.

### Suggested Architectural Improvements

1. **Migrate server-state stores to TanStack Query** — use Zustand exclusively for client UI state (sidebar open/closed, selected tab, active filters).
2. **Introduce an i18n layer** — even a simple `const t = useTranslation()` shim that maps keys to Arabic strings would centralise all labels.
3. **Consolidate the contracts/payroll route overlap** — either fully migrate or fully deprecate; document the decision.
4. **Extract a `query-keys.ts` per feature** — centralise React Query cache keys to prevent cache inconsistencies.

---

## 2. Folder & File Structure

### Current Structure Assessment

The structure is generally well-organised but has several inconsistencies.

**What works well:**
- `features/hr/{domain}/lib/api/` for API modules
- `features/hr/{domain}/components/` for UI
- `features/hr/{domain}/hooks/` for custom hooks
- `features/hr/{domain}/services/` for pure business logic functions
- `features/hr/{domain}/types/` for TypeScript types

**Problems:**

#### Problem 1: `shared-ui.tsx` in the Wrong Feature

`src/features/hr/requests/components/shared-ui.tsx` is imported by **30 different modules** including `discipline/`, `attendance/`, and `organization/` features. It is not a "requests" component — it is a global shared component barrel.

```
// Current (wrong):
import { ConfirmationModal, SearchableDropdown } from '@/features/hr/requests/components/shared-ui';
// Used in: discipline/, attendance/, organization/, leaves/ etc.

// Correct:
import { ConfirmationModal, SearchableDropdown } from '@/components/ui/shared-dialogs';
```

#### Problem 2: `DateRangePicker.tsx` Naming Inconsistency

All UI components follow `kebab-case.tsx` naming, except `DateRangePicker.tsx` (PascalCase filename). Minor but breaks the convention.

#### Problem 3: Tests Inside Feature Folders Without Clear Convention

Tests live in `__tests__/` subdirectories inside feature folders, which is fine, but there is no top-level test infrastructure folder. Integration tests, if added, would have no clear home.

#### Problem 4: Missing `types/` in Several Features

`attendance/`, `leaves/`, `requests/`, `discipline/` all define types inline inside `lib/` or `hooks/` files rather than in a dedicated `types/` folder. Contrast with `organization/employees/types/` which has the correct pattern.

### Proposed Improved Structure

```
src/
├── app/
│   ├── (app)/
│   │   └── hr/
│   │       └── {domain}/         # Same as today
│   └── (public)/                 # New: group public routes
│       ├── login/
│       ├── f/[jobSlug]/
│       └── apply/[formId]/
│
├── components/
│   ├── layouts/                  # App shell (sidebar, topbar, filter panel)
│   ├── ui/                       # shadcn + custom base components
│   │   ├── primitives/           # Purely presentational (Button, Input, Badge…)
│   │   ├── compound/             # Higher-order UI (DataTable, EmployeePicker…)
│   │   └── shared-dialogs/       # ← Move shared-ui.tsx here
│   │       ├── confirmation-modal.tsx
│   │       ├── searchable-dropdown.tsx
│   │       └── hr-settings-form-drawer.tsx
│   ├── pdf/
│   └── here-map/
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── hr/
│       ├── _shared/              # New: cross-HR shared constants, hooks, types
│       │   ├── hooks/
│       │   │   └── use-company-context.ts
│       │   ├── lib/
│       │   │   ├── api/          # client.ts, types.ts, global-error-handler.ts
│       │   │   └── query-keys.ts # centralised cache keys
│       │   └── types/
│       ├── {domain}/             # e.g., organization, attendance, payroll…
│       │   ├── components/
│       │   ├── hooks/            # React Query hooks only (useEmployees, etc.)
│       │   ├── lib/
│       │   │   ├── api/          # API modules
│       │   │   └── store.ts      # Zustand for UI-only state
│       │   ├── services/         # Pure business logic functions
│       │   ├── types/
│       │   └── __tests__/
│
├── shared/
│   ├── config/
│   ├── export/
│   ├── i18n/                     # New: all Arabic strings
│   │   ├── ar.ts
│   │   └── use-t.ts
│   └── utils.ts
│
└── test/                         # New: integration + E2E test scaffolding
    ├── fixtures/
    ├── mocks/
    └── helpers/
```

---

## 3. Code Quality

### Readability: 7/10

Most code is well-formatted with consistent use of section divider comments (`// ── Section name ────`). However, the largest files are extremely hard to navigate.

### Critical Code Quality Issues

#### Issue 1: God Components (1,000–1,200 Line Files)

The following components violate the Single Responsibility Principle and should be split:

| File | Lines | What it does |
|------|-------|--------------|
| `compensation-report-panel.tsx` | 1,172 | Data fetching + table + inline edit + dialogs + PDF + Excel export |
| `unified-management-client.tsx` | 1,090 | Leave list + create form + approve/reject + filters + pagination |
| `violation-cases-client.tsx` | 1,079 | CRUD + status workflow + two dialogs + filter toolbar + export |
| `daily-one-day-view.tsx` | 987 | Timeline + event CRUD + search + dialog |
| `employment-client.tsx` | 828 | Contract table + form dialog + multiple actions |

**Why it's problematic:** These files are impossible to review, test, or modify safely. Any change requires understanding 1,000+ lines of interconnected state.

**Example fix for `compensation-report-panel.tsx`:**
```
compensation/
├── components/
│   ├── compensation-report-panel.tsx     # Orchestrator only (~100 lines)
│   ├── compensation-table.tsx            # Table rendering
│   ├── compensation-inline-edit-cell.tsx # Inline edit logic
│   ├── compensation-export-actions.tsx   # PDF + Excel buttons
│   └── compensation-push-dialogs/        # 3 push dialogs
```

#### Issue 2: Duplicated Status/Label Maps

The same status labels are redefined in multiple files with no shared source:

```typescript
// In unified-management-client.tsx line 70:
const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  cancelled: 'ملغاة',
};

// In violation-cases-client.tsx line 69:
const STATUS_LABELS: Record<ViolationRecordStatus, string> = {
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  rejected: 'مرفوض',
  needs_edit: 'يحتاج تعديل',
};
```

The 'pending' → 'قيد الانتظار' mapping is redefined in at least 8 different files.

**Fix:** Centralise in `shared/i18n/ar.ts`:
```typescript
export const AR_STATUS = {
  pending: 'قيد الانتظار',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  cancelled: 'ملغاة',
} as const;
```

#### Issue 3: ESLint Dependency Suppression Pattern

There are 11 instances of `// eslint-disable-next-line react-hooks/exhaustive-deps` across the codebase. Each one is a potential stale-closure bug or missing re-render. These should be fixed rather than suppressed.

```typescript
// src/components/here-map/components/useDrawing.ts line 676:
// eslint-disable-next-line react-hooks/exhaustive-deps

// src/features/hr/organization/employees/hooks/useEmployeeProfilePersonal.ts line 27:
}, [employee.id]); // eslint-disable-line react-hooks/exhaustive-deps
```

#### Issue 4: Direct `window.location.href` for Navigation

```typescript
// src/features/hr/lib/api/global-error-handler.ts line 60:
if (status === 401 && typeof window !== 'undefined') {
  window.location.href = '/login';
}
```

This bypasses Next.js App Router, causes a full-page reload on session expiry, loses any unsaved state, and cannot be intercepted or tested. It should use Next.js `redirect()` or the router.

#### Issue 5: `useDefaultCompanyId` Reads `localStorage` on Every Render

```typescript
export function useDefaultCompanyId(): string | null {
  const profileCompanyId = useAuthStore(s => s.accessProfile?.defaultCompanyId);
  const activeCompanyId = useAuthStore(s => s.activeCompanyId);

  return React.useMemo(() => {
    if (profileCompanyId) return profileCompanyId;
    if (typeof window !== 'undefined') {
      const fromStorage = localStorage.getItem(DEFAULT_COMPANY_ID_STORAGE_KEY); // ← reads on every memo
      if (fromStorage) return fromStorage;
    }
    return activeCompanyId;
  }, [profileCompanyId, activeCompanyId]);
}
```

`localStorage.getItem` inside `useMemo` is not reactive — if `localStorage` changes externally, the hook won't re-run. The company ID is also stored in the Zustand auth store, making this fallback redundant and confusing.

#### Issue 6: Mixed Token Extraction Methods

Auth token is read from `document.cookie` by string-splitting (brittle):
```typescript
// client.ts line 135:
const token = typeof document !== 'undefined'
  ? document.cookie.split('; ').find(r => r.startsWith('access_token='))?.slice('access_token='.length) ?? null
  : null;
```

This is fragile — it breaks if any cookie value contains the substring `access_token=`. Use `document.cookie.match()` with a proper regex, or better, set `credentials: 'include'` (already done) and let the browser manage the token cookie server-side without reading it in JS at all (relies on HttpOnly cookies).

---

## 4. Scalability Review

### Score: 5 / 10

### Bottlenecks

#### 1. `fetchAllPaginatedItems` is Sequential, Not Parallel

```typescript
// src/features/hr/lib/api/client.ts
export async function fetchAllPaginatedItems<T>(fetchPage, limit = 200) {
  const first = await fetchPage(1, limit);
  // ...
  for (let page = 2; page <= totalPages; page += 1) {
    const next = await fetchPage(page, limit); // ← Sequential — each page waits for previous
    items.push(...next.items);
  }
}
```

For a dataset with 5 pages (1,000 items at 200/page), this takes 5× the latency of a single request. With known `totalPages`, all pages can be fetched in parallel:

```typescript
const pageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
const rest = await Promise.all(pageNumbers.map(p => fetchPage(p, limit)));
```

#### 2. `useEmployees` Fetches Up to 500 Records Client-Side

```typescript
// useEmployees.ts
queryFn: () => employeesApi.getAll({ companyId, limit: 500 }),
```

For a company with 400+ employees, this fetches all of them into the browser on every page that calls `useEmployees()`. As headcount grows, this becomes a performance problem. The employee picker should use server-side search instead.

#### 3. 26+ Zustand Stores with No Shared Invalidation

Each Zustand store manages its own `loadX()` function. There is no way to invalidate multiple stores together when related data changes (e.g., approving a leave request should refresh both the request list and the employee's leave balance). TanStack Query's `queryClient.invalidateQueries` solves this elegantly.

#### 4. God Component Re-renders

`compensation-report-panel.tsx` at 1,172 lines holds all state for the compensation table in one component. Every inline-edit keystroke re-renders the entire 1,172-line component tree. Splitting into subcomponents with `React.memo` and `useCallback` would eliminate this.

#### 5. No Code-Splitting on Feature Routes

All features are bundled together. Next.js does route-level splitting automatically, but the dynamic imports within pages (e.g., `PdfPreviewExportDialog`, `CompensationPrintHtml`) are imported statically, increasing initial bundle size. These should use `next/dynamic`:
```typescript
const CompensationPrintHtml = dynamic(() => import('./compensation-print-html'), { ssr: false });
```

### Future Concerns

- **Multi-company expansion**: The company context is threaded through 26+ stores manually. Adding a true multi-tenancy layer would require touching every store.
- **Real-time updates**: No WebSocket or SSE infrastructure exists. Adding live notifications or real-time attendance tracking would require a significant architectural addition.
- **Offline support**: All data is fetched fresh per session. No service worker or offline-first patterns exist.

---

## 5. Security Review

### 🔴 CRITICAL: API Key Committed to Repository

**Severity: CRITICAL**

```
# .env file (committed to git):
NEXT_PUBLIC_HERE_API_KEY=_wp5c7RJh-glowTGxHT5SmnpQ_KeShK5_Nqze8g7XvI
```

The `.env` file is committed to the repository AND the same API key is published verbatim in `README.md` line 49. This key is now in git history and is publicly accessible to anyone with repository access.

**Impact:** HERE Maps API key abuse, unexpected billing charges, potential account suspension.

**Fix:**
1. Rotate the HERE Maps API key immediately.
2. Delete `.env` from git history: `git filter-branch` or `git-filter-repo`.
3. Create `.env.example` with placeholder values.
4. Verify `.gitignore` excludes `.env` (it does, but the file was committed before the rule).

---

### 🔴 HIGH: Demo Credentials Hardcoded in README and Pre-filled in Login Form

**Severity: HIGH**

```markdown
# README.md line 77:
**Login credentials (demo — requires backend to be seeded):**
- Email: `admin@test.com`
- Password: `Admin123!`
> The login page pre-fills these credentials automatically.
```

If the backend is accidentally deployed with its seed data, admin access is trivially available to anyone who reads the README.

**Fix:** Remove credentials from README. Remove pre-fill from login form for non-development environments.

---

### 🔴 HIGH: Auth Token Read from `document.cookie` in Client-Side JavaScript

**Severity: HIGH**

```typescript
// client.ts line 135:
const token = document.cookie.split('; ').find(r => r.startsWith('access_token='))...
```

If `access_token` is readable from JavaScript, it is vulnerable to XSS cookie theft. The token should be stored as an `HttpOnly` cookie — it would still be sent automatically via `credentials: 'include'` (already set) without being readable by JS.

**Fix:** Coordinate with the backend team to set the cookie as `HttpOnly`. The frontend code reading the token from `document.cookie` can then be removed entirely.

---

### 🟠 HIGH: No CSRF Protection

The API client sends the auth token in `Authorization: Bearer` header, which avoids cookie-based CSRF. However, the client also sets `credentials: 'include'`, meaning session cookies are sent too. If the backend accepts either Bearer token OR session cookie for authentication, CSRF is a risk.

**Fix:** Confirm with the backend team that cookie-based auth is not accepted for state-changing endpoints.

---

### 🟠 MEDIUM: `window.location.href` for 401 Redirect (Potential Open Redirect)

```typescript
if (status === 401 && typeof window !== 'undefined') {
  window.location.href = '/login';
}
```

This is a hardcoded relative path, so it is not an open redirect by itself. However, bypassing the router means the current URL is not preserved as a `returnTo` parameter, locking users out of deep links. More importantly, it fires in SSR context if `typeof window !== 'undefined'` check fails.

---

### 🟡 MEDIUM: No Rate Limiting on API Calls from Frontend

`fetchAllPaginatedItems` makes N sequential API calls with no delay, no retry-with-backoff, and no abort controller for cancellation. A component that remounts quickly can flood the backend.

---

### 🟡 MEDIUM: `sessionStorage` for Auth Store

```typescript
storage: createJSONStorage(() => sessionStorage),
```

Auth state (user, accessProfile, activeCompanyId) is persisted to `sessionStorage`. This means:
1. If a user opens a new tab, they must log in again.
2. The access profile (which contains permission grants) is stored client-side and could be tampered with (though the backend should re-validate).

---

### 🟢 LOW: Image Remote Patterns Include Placeholder Services

```javascript
// next.config.mjs:
remotePatterns: [
  { protocol: 'https', hostname: 'images.unsplash.com' },
  { protocol: 'https', hostname: 'i.pravatar.cc' },
]
```

`pravatar.cc` is a placeholder avatar service. In production, employee avatars should come from the application's own storage, not a third-party service. The pravatar allowance should be removed.

---

### Security Findings Summary

| Finding | Severity | Status |
|---------|----------|--------|
| HERE Maps API key committed to git + README | CRITICAL | Open |
| Demo admin credentials in README + pre-filled in form | HIGH | Open |
| Auth token readable from JavaScript (non-HttpOnly cookie) | HIGH | Open |
| No CSRF audit against session cookies | HIGH | Open |
| `window.location.href` redirect bypasses router | MEDIUM | Open |
| No API request rate limiting / abort on unmount | MEDIUM | Open |
| Auth state in sessionStorage (not HttpOnly) | MEDIUM | Open |
| Third-party image domain (pravatar.cc) in production config | Low | Open |

---

## 6. Performance Review

### Score: 6 / 10

### Issues

#### 1. Sequential Paginated Fetching (All Features)

As described in §4, `fetchAllPaginatedItems` fetches pages one at a time. This affects every store that calls it:
- `useHRContractsStore.loadContracts()` 
- `useHRViolationCasesStore.loadCases()`
- All other stores that use the helper

**Estimated impact:** 3–5× slower load times for any dataset over 200 items.

#### 2. `useEmployees(limit: 500)` — No Virtualisation

500 employee records are fetched and rendered in a flat list with no virtual scrolling. For large organisations (200+ employees), the grid/table renders hundreds of DOM nodes simultaneously.

**Fix:** Use `react-virtual` or TanStack Virtual for the employee grid. Alternatively, use server-side pagination (the API supports it).

#### 3. No `React.memo` on Table Row Components

`DataTable` from TanStack Table renders row components but none of the row renderers use `React.memo`. With 200+ rows, every state change (filter text input, sort change) re-renders all rows.

#### 4. Framer Motion on Every Route

`framer-motion` is imported as a production dependency (12.38.0, ~65KB gzipped). It is used primarily for `animate-fade-in` — a simple CSS animation that does not require the full Framer Motion runtime. The custom CSS animation defined in `globals.css` already achieves the same effect:
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Fix:** Remove `framer-motion` and use the existing CSS animation class.

#### 5. PDF Components Imported Statically

`CompensationPrintHtml`, `ViolationCasesRegisterPrintHtml`, and other print templates are statically imported at the top of their respective client components. These are heavy components (they include full print stylesheets) and should be lazy-loaded:
```typescript
const CompensationPrintHtml = dynamic(
  () => import('@/features/hr/payroll/compensation/components/compensation-print-html'),
  { ssr: false }
);
```

#### 6. `xlsx` Bundle Size

`xlsx` (SheetJS) is ~800KB unminified. It is imported in several components for Excel export. It should always be dynamically imported only when the user triggers an export:
```typescript
const downloadExcel = async () => {
  const { downloadXlsxFromAoA } = await import('@/shared/export/download-xlsx');
  downloadXlsxFromAoA(filename, headers, rows);
};
```

---

## 7. Error Handling

### Score: 7 / 10

### Strengths

- `global-error-handler.ts` is a clean, centralised pattern. All API errors flow through `handleApiError()`.
- `ApiError` class preserves the full backend envelope for debugging.
- 403 and 500 errors automatically show Arabic toast messages.
- Dev-only debug payload is correctly gated behind `isDevEnv()`.

### Weaknesses

#### 1. No Error Boundaries

There are zero React Error Boundaries in the codebase. A single uncaught JavaScript error in any client component will crash the entire page with React's default blank screen. At minimum, the app shell layout should wrap child content in an `ErrorBoundary`.

```tsx
// Should exist in src/app/(app)/layout.tsx:
<ErrorBoundary fallback={<PageErrorFallback />}>
  {children}
</ErrorBoundary>
```

#### 2. 401 Redirect Has No Return URL

```typescript
if (status === 401 && typeof window !== 'undefined') {
  window.location.href = '/login';
}
```

The user's current URL is lost. They should be redirected back after re-authentication:
```typescript
window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
```

#### 3. No Retry Logic for Transient Failures

TanStack Query has built-in retry logic (3 retries by default), but the Zustand stores that call API functions directly have no retry mechanism. A single network hiccup causes a permanent error state until the user manually refreshes.

#### 4. Empty Catch Blocks for Non-`ApiError` Errors

Several components catch errors and display them using `handleApiError`, but `handleApiError` for non-`ApiError` instances (e.g., a TypeError from `JSON.parse` failing) simply calls `console.error` and returns the raw error message — which could expose internal stack traces to users.

#### 5. No Logging Service

`console.error` is used throughout production code (9 console usages found). There is no error logging service (Sentry, Datadog, etc.) to capture production errors and alert the team.

---

## 8. Testing

### Testing Maturity Score: 2 / 10

### Current State

| Metric | Value |
|--------|-------|
| Total source files | 623 |
| Test files | 14 |
| Test-to-source ratio | ~2.2% |
| Unit tests | Yes (service functions) |
| Component tests | 2 files |
| Integration tests | 0 |
| E2E tests | 0 |
| API mock pattern | jest.mock() — complete isolation |

### What's Being Tested

- `permissions/` — Comprehensive: 5 test files covering matrix building, service layer, and UI
- `employees/` — 5 test files covering services + basic component smoke test
- `auth/` — 1 login page smoke test
- `lib/api/types` — 1 file testing type guards

### Critical Coverage Gaps

1. **Zero payroll tests** — The most financially sensitive domain in an HR system has no tests. Compensation calculations, period management, and approval workflows are untested.
2. **Zero discipline tests** — Violation recording, investigation outcomes, and appeals are untested.
3. **Zero attendance tests** — Shift assignment, day summary calculations, overtime rules are untested.
4. **Zero leave tests** — Balance credits, approval flows, and leave type rules are untested.
5. **Zero contract tests** — Employment contract creation and advancement logic are untested.
6. **No E2E tests** — The full user journey (login → create employee → assign contract → run payroll) is never verified.

### Recommended Testing Strategy

**Phase 1 — Unit Tests (Immediate)**
- All functions in `services/` directories (pure business logic)
- Zod schema validators
- Utility functions in `shared/utils.ts`
- Store action functions (mock API, test state transitions)

**Phase 2 — Component Tests (Short-term)**
- Every form dialog (submit, validation error, server error states)
- Data tables (sorting, filtering, empty state, error state)
- All permission guards (`useCanI` gating)

**Phase 3 — E2E Tests (Medium-term)**
- Playwright for critical paths: login, create employee, approve leave, run payroll

**Phase 4 — Integration Tests (Long-term)**
- API contract tests using MSW (Mock Service Worker) to catch backend API changes

---

## 9. Dependency Review

### Major Concerns

#### 1. `xlsx` (SheetJS) — License and Security Risk

`xlsx@0.18.5` is pinned to a very old version (current is 0.20.x). SheetJS had a significant security incident in 2023 where malicious code was injected into the npm package. The community fork (`@xlsx-js/xlsx`) is safer.

Additionally, `xlsx` under `0.18.x` uses a licensing model that may require a commercial license for SaaS use. **Verify the license compatibility** before production deployment.

#### 2. `html2pdf.js` — Unmaintained

`html2pdf.js@0.10.2` has not had a meaningful release in 3+ years. It depends on `html2canvas` which has known issues with RTL text rendering. For an Arabic-first application, this is a significant risk. Consider migrating to `react-pdf` or server-side PDF generation (Puppeteer on the backend).

#### 3. `framer-motion` — Over-sized for Usage

`framer-motion@12.38.0` (~65KB gzipped) is used for simple fade-in animations that could be replaced by native CSS. This adds unnecessary weight to every page.

#### 4. Dependency Version Status

| Package | Current | Concern |
|---------|---------|---------|
| `next` | 16.2.4 | Very new — limited community LTS support |
| `react` | 19.2.5 | Very new — ecosystem catching up |
| `typescript` | 6.0.3 | Very new — potential tooling gaps |
| `xlsx` | 0.18.5 | Old — security + license risk |
| `html2pdf.js` | 0.10.2 | Unmaintained |
| `leaflet` | 1.9.4 | Stable |
| `framer-motion` | 12.38.0 | Oversized for use case |

#### 5. `react-is` Listed as Runtime Dependency

`react-is` is a peer dependency of testing libraries and should be a `devDependency`, not a production dependency. It adds unnecessary bytes to the production bundle.

#### 6. Duplicate Date Handling

Both `date-fns` (v4) and `react-day-picker` (v9) are included. `react-day-picker` v9 uses date-fns internally, so there is no conflict — but both are very new versions with potential API instability.

---

## 10. Developer Experience

### Score: 5 / 10

### Strengths

- The `README.md` is exceptionally thorough — it covers the entire stack, all routes, state management architecture, all components, and key conventions. This is the best part of the developer experience.
- The `CLAUDE.md` / `SYSTEM_REFERENCE_AR.md` files suggest the team invests in AI-assisted development tooling.
- TypeScript strict mode is on (verified in `tsconfig.json`).
- `jest.config.ts` is properly configured with path aliases matching `tsconfig`.

### Weaknesses

#### 1. No `.env.example` File

The `.gitignore` comments say:
```
# Env (keep .env.example if you add one)
.env
.env.*
!.env.example
```

But `.env.example` does not exist. New developers must read the README to know what environment variables to set — and the README helpfully provides the actual production API key, which is a security problem.

**Fix:** Create `.env.example`:
```env
NEXT_PUBLIC_API_URL=/api-backend
NEXT_PUBLIC_HERE_API_KEY=your_here_maps_api_key_here
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development
```

#### 2. No CI/CD Configuration Found

No `.github/workflows/`, no `Jenkinsfile`, no `Dockerfile`, no `docker-compose.yml`. There is no automated build, lint, or test pipeline. Every developer relies on manual `npm run lint` and `npm test`.

**Impact:** Broken code can reach `main` without detection. The `dev` branch currently has a modified file (`violation-cases-client.tsx`) that has never been validated by CI.

#### 3. Demo Credentials Pre-Filled in Login Form

```typescript
// README line 80:
> The login page pre-fills these credentials automatically.
```

This is a development convenience that must be removed before production. A conditional using `publicConfig.appEnv === 'development'` should gate this.

#### 4. No Storybook or Component Documentation

With 30+ custom UI components (`entity-action-card`, `paged-list`, `entity-filter-toolbar`, `slide-panel`, etc.), there is no component playground. New developers must read source code to understand how to use `DirectoryPagedViews` or `EntityActionCard`.

#### 5. Linting Not Enforced (ESLint Config Minimal)

```javascript
// eslint.config.mjs
import nextPlugin from '@next/eslint-plugin-next';
// Only Next.js defaults — no strict custom rules
```

No rule banning `console.log` in production, no `no-explicit-any`, no import ordering rules. The `any` suppressions and `eslint-disable` comments that exist could be caught by a stricter ruleset.

---

## 11. Production Readiness Assessment

### Production Readiness Score: 3 / 10

| Dimension | Score | Notes |
|-----------|-------|-------|
| Build process | 6 | `next build` works; no optimisation pipeline |
| Deployment artifacts | 2 | No Dockerfile, no CI/CD pipeline |
| Environment management | 2 | API key committed; no `.env.example` |
| Error monitoring | 1 | No Sentry / Datadog / any service |
| Logging | 2 | `console.error` only; no structured log |
| Performance monitoring | 1 | No APM, no bundle analysis |
| Security posture | 3 | Critical API key exposure; JS-readable JWT |
| Test coverage | 2 | 2.2% coverage, 0 E2E tests |
| Documentation | 8 | README is excellent |
| Rollback strategy | 1 | No versioning, no blue-green, no rollback |

### Missing Before Production

1. **Rotate all secrets** (HERE Maps API key is compromised).
2. **Add a Dockerfile** for containerised deployment.
3. **Set up CI/CD** (GitHub Actions minimum: lint + test + build on every PR).
4. **Integrate error monitoring** (Sentry is straightforward to add to Next.js).
5. **Remove demo credential pre-fill** from login form.
6. **Add at least one smoke E2E test** (login + dashboard renders).
7. **Set up `next/bundle-analyzer`** to understand and reduce bundle size.
8. **Enable `next.js` output mode** for standalone deployment (`output: 'standalone'` in `next.config.mjs`).
9. **Define a health check endpoint** (`/api/health`) for load balancer probes.

---

## 12. Refactoring Opportunities

### High Impact

#### 1. Migrate Zustand Stores to TanStack Query
**Expected benefit:** Removes 2,000+ lines of boilerplate, automatic cache invalidation, automatic loading/error states, background refresh.  
**Estimated effort:** 3–4 weeks (incremental, store by store).  
**Priority:** P1

#### 2. Split God Components (Top 5 files)
**Expected benefit:** Each file becomes independently testable. Component tests become feasible. Re-render scope shrinks dramatically.  
**Estimated effort:** 1 week per component × 5 = ~5 weeks.  
**Priority:** P1

#### 3. Centralise Arabic Strings (Pre-i18n)
**Expected benefit:** Single source of truth for all labels. Prerequisite for any future multilingual support.  
**Estimated effort:** 2 weeks.  
**Priority:** P2

### Medium Impact

#### 4. Move `shared-ui.tsx` to `components/ui/`
**Expected benefit:** Eliminates a cross-feature dependency that violates feature isolation.  
**Estimated effort:** 2 days.  
**Priority:** P2

#### 5. Replace `framer-motion` with CSS Animations
**Expected benefit:** Removes ~65KB from the production bundle.  
**Estimated effort:** 1 day.  
**Priority:** P2

#### 6. Dynamic Import for PDF/Excel Libraries
**Expected benefit:** Reduces initial page load for all pages that include print components.  
**Estimated effort:** 1 day.  
**Priority:** P2

#### 7. Parallelise `fetchAllPaginatedItems`
**Expected benefit:** 3–5× faster load for datasets over 200 items.  
**Estimated effort:** 2 hours.  
**Priority:** P1

### Low Priority

#### 8. Fix `DateRangePicker.tsx` Naming Convention
**Estimated effort:** 5 minutes.

#### 9. Add `types/` to Features Missing It
**Estimated effort:** 1–2 days.

#### 10. Remove `react-is` from Production Dependencies
**Estimated effort:** 5 minutes.

---

## 13. Technical Debt Report

| # | Issue | Severity | Business Impact | Engineering Impact | Recommended Fix | Priority |
|---|-------|----------|----------------|-------------------|-----------------|----------|
| 1 | HERE Maps API key committed to git + README | CRITICAL | API key abuse, billing, service suspension | Security incident | Rotate key, purge from git history, add `.env.example` | Immediate |
| 2 | Demo admin credentials in README + login form | HIGH | Trivial unauthorised admin access if backend is seeded | Reputational + access risk | Remove from README, gate pre-fill behind dev env | Immediate |
| 3 | Auth token in JS-readable cookie | HIGH | XSS vulnerability – token theft | All sessions at risk | Switch to HttpOnly cookies with backend coordination | Sprint 1 |
| 4 | No CI/CD pipeline | HIGH | Broken code reaches main silently | Developer confidence, deployment risk | GitHub Actions: lint + test + build | Sprint 1 |
| 5 | Zustand stores as data-fetch layers (26+ stores) | HIGH | Manual refresh UX, stale data, 2,000+ lines of boilerplate | High maintenance burden, cache bugs | Migrate to TanStack Query per store | Sprint 2–3 |
| 6 | God components (5× 1,000+ line files) | HIGH | Critical features cannot be unit-tested | Extremely hard to review/change safely | Split into sub-components | Sprint 2 |
| 7 | No error boundaries | HIGH | Single JS error blanks the entire app for users | User trust, production incidents | Add ErrorBoundary in app shell layout | Sprint 1 |
| 8 | No E2E tests | HIGH | Regressions undetected until users report | Release anxiety, manual QA burden | Playwright: login, employee, payroll flows | Sprint 2 |
| 9 | `xlsx` old version (license + security risk) | HIGH | Potential license violation in SaaS | Security and legal risk | Upgrade or migrate to `@xlsx-js/xlsx` | Sprint 1 |
| 10 | Sequential `fetchAllPaginatedItems` | MEDIUM | Slow load for large datasets | O(N pages) latency instead of O(1) | Parallelise with `Promise.all` | Sprint 1 |
| 11 | Arabic strings hardcoded across 600+ files | MEDIUM | No path to multilingual support | Every UI text change requires a grep | Centralise in `shared/i18n/ar.ts` | Sprint 2 |
| 12 | `framer-motion` over-used for CSS animations | MEDIUM | +65KB bundle weight | None | Replace with existing CSS animation | Sprint 2 |
| 13 | `window.location.href` for 401 redirect | MEDIUM | Users lose deep-link context on session expiry | Hard to test, bypasses Next.js router | Use Next.js router with `returnTo` param | Sprint 1 |
| 14 | `shared-ui.tsx` in `requests/` (used by 30 modules) | MEDIUM | Cross-feature coupling violates isolation | Changes to shared-ui ripple unpredictably | Move to `components/ui/` | Sprint 2 |
| 15 | `html2pdf.js` unmaintained with RTL issues | MEDIUM | PDF export may render Arabic incorrectly | No upstream fixes for RTL bugs | Evaluate server-side PDF or `react-pdf` | Sprint 3 |
| 16 | No error monitoring service | MEDIUM | Production errors are invisible to the team | Cannot triage incidents | Add Sentry | Sprint 1 |
| 17 | No health check endpoint | LOW | Load balancers cannot detect unhealthy instances | Deployment reliability | Add `/api/health` route | Sprint 2 |
| 18 | Demo credentials pre-filled unconditionally | LOW | Risky if deployed without clearing seed data | Minor | Gate behind `process.env.NODE_ENV === 'development'` | Sprint 1 |
| 19 | `react-is` in production dependencies | LOW | Unnecessary bundle bytes | Trivial | Move to devDependencies | Sprint 1 |
| 20 | No Storybook / component docs | LOW | New developers struggle with custom UI components | Onboarding friction | Add Storybook incrementally | Sprint 3 |

---

## 14. Executive Summary

### Overall Project Score

| Category | Score | Notes |
|----------|-------|-------|
| Architecture | 6/10 | Good FSD structure; Zustand/TanStack misuse |
| Folder & File Structure | 6/10 | Mostly clean; shared-ui misplaced; missing types/ |
| Code Quality | 6/10 | Consistent style; god components; string duplication |
| Scalability | 5/10 | Sequential fetching; no virtualisation; store explosion |
| Security | 3/10 | API key in git is a critical blocker |
| Performance | 6/10 | Solid foundations; several easy wins available |
| Error Handling | 7/10 | Good API error layer; missing error boundaries |
| Testing | 2/10 | 2.2% coverage; zero E2E tests |
| Dependencies | 5/10 | xlsx security/license risk; html2pdf.js unmaintained |
| Developer Experience | 5/10 | Excellent README; no CI/CD; no .env.example |
| Production Readiness | 3/10 | Not ready — critical security + monitoring gaps |
| **Overall** | **4.9/10** | |

---

### Top 10 Most Important Improvements (Highest → Lowest Impact)

| Rank | Improvement | Why |
|------|-------------|-----|
| 1 | **Rotate HERE Maps API key + purge from git history** | The key is already compromised. Every minute it stays valid is a risk. |
| 2 | **Remove demo credentials from README and login form** | Trivial access to admin account if backend has seed data. |
| 3 | **Add GitHub Actions CI/CD pipeline** (lint + test + build) | The codebase has no automated safety net. Regressions reach production silently. |
| 4 | **Add React Error Boundaries** | A single component error currently blanks the entire application for users. |
| 5 | **Add Sentry error monitoring** | Production errors are currently invisible. There is no alert, no trace, no replay. |
| 6 | **Parallelise `fetchAllPaginatedItems`** | 3–5× performance improvement for every paginated data load; 2-hour fix. |
| 7 | **Migrate Zustand data-fetch stores to TanStack Query** | Eliminates 2,000+ boilerplate lines; fixes stale-data bugs; enables cache invalidation. |
| 8 | **Split the 5 god components** | 1,000+ line components cannot be tested, reviewed, or maintained safely. |
| 9 | **Centralise Arabic strings** | Prerequisite for maintainability; 300+ duplicate string definitions today. |
| 10 | **Write Playwright E2E tests for critical flows** | Payroll and discipline modules have zero test coverage. A regression in compensation calculations is undetectable. |

---

### Suggested Roadmap

#### Phase 1 — Critical (Blocks Production Deployment) — 2–3 Weeks

- [ ] Rotate HERE Maps API key, purge `.env` from git history, create `.env.example`
- [ ] Remove demo credentials from README and login form pre-fill
- [ ] Set up GitHub Actions: `lint → test → build` on every PR
- [ ] Add React Error Boundaries to app shell layout
- [ ] Integrate Sentry (5 lines of code in `layout.tsx`)
- [ ] Parallelise `fetchAllPaginatedItems`
- [ ] Fix `window.location.href` → Next.js router redirect with `returnTo`
- [ ] Move `react-is` to devDependencies; audit xlsx license
- [ ] Coordinate HttpOnly cookie migration with backend team

#### Phase 2 — Important (Stability & Maintainability) — 4–6 Weeks

- [ ] Split top 5 god components into sub-components
- [ ] Migrate Zustand data-fetch stores to TanStack Query (start with `payroll-periods-store`)
- [ ] Move `shared-ui.tsx` to `components/ui/shared-dialogs/`
- [ ] Centralise Arabic strings into `shared/i18n/ar.ts`
- [ ] Replace `framer-motion` with CSS animation classes
- [ ] Dynamic import for PDF and xlsx libraries
- [ ] Add unit tests for all `services/` functions (especially payroll calculation)
- [ ] Add Playwright E2E tests for: login, create employee, approve leave, complete payroll period
- [ ] Add `types/` folders to features missing them
- [ ] Create `.env.example` with placeholder values

#### Phase 3 — Nice to Have (Developer Experience & Future Proofing) — Ongoing

- [ ] Evaluate `html2pdf.js` → server-side PDF or `react-pdf` migration
- [ ] Add Storybook for custom UI components
- [ ] Add `next/bundle-analyzer` to CI pipeline
- [ ] Design i18n architecture for future English-language support
- [ ] Add virtual scrolling to employee picker and large data tables
- [ ] Set up `output: 'standalone'` in Next.js config for optimised Docker images
- [ ] Add a health check API route (`/api/health`)
- [ ] Document architecture decisions in `docs/adr/` (Architecture Decision Records)

---

### Ideal Future Structure

If starting fresh while preserving current functionality:

```
src/
├── app/
│   ├── (authenticated)/           # Protected routes group
│   │   ├── layout.tsx             # Auth guard + app shell
│   │   └── hr/
│   │       ├── dashboard/
│   │       ├── organization/
│   │       ├── attendance/
│   │       ├── leaves/
│   │       ├── payroll/           # Clean single path (no contracts duplicate)
│   │       ├── requests/
│   │       ├── discipline/
│   │       ├── recruitment/
│   │       ├── notifications/
│   │       └── permissions/
│   │
│   ├── (public)/                  # Unauthenticated routes
│   │   ├── login/
│   │   ├── f/[jobSlug]/
│   │   └── apply/[formId]/
│   │
│   ├── layout.tsx                 # Root layout (fonts, metadata, error boundary)
│   └── globals.css
│
├── components/
│   ├── layouts/                   # App shell (sidebar, topbar)
│   ├── ui/
│   │   ├── primitives/            # Button, Input, Badge, Card…
│   │   ├── compound/              # DataTable, EmployeePicker, MapPicker…
│   │   └── shared-dialogs/        # ConfirmationModal, SearchableDropdown…
│   ├── pdf/
│   ├── here-map/
│   └── error-boundary.tsx         # NEW: global error boundary
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/                 # React Query hooks
│   │   ├── lib/
│   │   │   ├── auth-store.ts      # Zustand: UI-only (user display name, active company)
│   │   │   └── api/
│   │   └── types/
│   │
│   └── hr/
│       ├── _shared/               # Cross-HR cross-cutting concerns
│       │   ├── hooks/
│       │   │   └── use-company-context.ts
│       │   ├── lib/
│       │   │   ├── api/
│       │   │   │   ├── client.ts
│       │   │   │   ├── types.ts
│       │   │   │   └── error-handler.ts
│       │   │   └── query-keys.ts  # All React Query keys in one place
│       │   └── types/
│       │
│       ├── organization/
│       │   ├── employees/
│       │   │   ├── components/
│       │   │   ├── hooks/         # useEmployees (React Query)
│       │   │   ├── lib/api/
│       │   │   ├── services/      # Pure business logic
│       │   │   ├── types/
│       │   │   └── __tests__/
│       │   ├── departments/       # Same pattern
│       │   ├── branches/
│       │   └── job-titles/
│       │
│       ├── attendance/            # Same pattern
│       ├── leaves/                # Same pattern
│       ├── payroll/               # Same pattern (no duplicate under contracts)
│       ├── requests/              # Same pattern
│       ├── discipline/            # Same pattern
│       ├── recruitment/           # Same pattern
│       ├── permissions/           # Same pattern
│       └── notifications/         # Same pattern
│
├── shared/
│   ├── config/
│   │   └── index.ts
│   ├── export/
│   │   └── download-xlsx.ts
│   ├── i18n/                      # NEW: all Arabic UI strings
│   │   ├── ar.ts
│   │   └── use-t.ts
│   └── utils.ts
│
└── test/                          # NEW: test infrastructure
    ├── e2e/                       # Playwright tests
    │   ├── auth.spec.ts
    │   ├── employees.spec.ts
    │   └── payroll.spec.ts
    ├── fixtures/                  # Shared test data
    └── mocks/                     # MSW handlers
        └── handlers.ts
```

---

*Audit completed: 2026-06-18 | Auditor: Claude Sonnet 4.6*
