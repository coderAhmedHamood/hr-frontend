# HR System Frontend — Best Practices Audit

## File & Folder Structure

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (RTL, IBM Plex Sans Arabic)
│   │   ├── globals.css               # Design tokens (HSL CSS variables)
│   │   ├── page.tsx                  # Root redirect
│   │   ├── login/page.tsx
│   │   ├── apply/[formId]/page.tsx
│   │   ├── f/[jobSlug]/page.tsx
│   │   └── (app)/                    # Authenticated route group
│   │       ├── layout.tsx            # Shell: Sidebar + Topbar + FilterPanel
│   │       └── hr/
│   │           ├── dashboard/
│   │           ├── organization/
│   │           │   ├── employees/    [id]/
│   │           │   ├── departments/
│   │           │   ├── branches/
│   │           │   ├── job-titles/
│   │           │   ├── contacts/
│   │           │   ├── chart/
│   │           │   └── companies/
│   │           ├── attendance/       [section]/
│   │           ├── leaves/           [section]/  analytics/  balance-credit/
│   │           ├── contracts/        (employment, articles, allowance-types,
│   │           │                      templates, payroll-periods, reports …)
│   │           ├── payroll/          (mirrors contracts payroll routes)
│   │           ├── requests/         [department]/[requestType]/
│   │           ├── discipline/       [section]/
│   │           ├── recruitment/      ats/  ats-admin/  ats-applicants/  ats-pipeline/
│   │           ├── permissions/      roles/  catalog/
│   │           ├── notifications/admin/
│   │           └── settings/
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui + custom primitives (~35 files)
│   │   ├── layouts/                  # Shell & 5 React Contexts
│   │   ├── pdf/                      # PDF/print templates + export lib
│   │   ├── here-map/                 # HERE Maps integration
│   │   ├── shared/                   # Cross-cutting: PermissionGate, StatusBadge …
│   │   └── requests/
│   │
│   ├── features/
│   │   ├── auth/                     # components/ hooks/ lib/api/ stores/ types/
│   │   └── hr/
│   │       ├── lib/api/              # client.ts, types.ts, global-error-handler.ts
│   │       ├── dashboard/
│   │       ├── organization/         # employees/ departments/ branches/ …
│   │       ├── attendance/
│   │       ├── leaves/
│   │       ├── contracts/
│   │       ├── payroll/
│   │       ├── requests/
│   │       ├── discipline/
│   │       ├── recruitment/
│   │       ├── permissions/
│   │       └── notifications/
│   │          (each: components/ hooks/ stores/ lib/api/ types/)
│   │
│   ├── shared/
│   │   ├── config/index.ts           # publicConfig (apiUrl, hereApiKey …)
│   │   ├── utils.ts                  # cn(), formatDate(), toWesternDigits() …
│   │   └── export/download-xlsx.ts
│   │
│   └── types/
│
├── public/
│   ├── logo.{png,svg,webp}
│   ├── fonts/                        # Cairo Arabic fonts
│   └── firebase-messaging-sw.js
│
├── docs/                             # DB schema markdown files
├── .env                              # API key + URL
├── package.json
├── tsconfig.json                     # strict: true, ES2022
├── next.config.mjs
├── tailwind.config.js
├── eslint.config.mjs
├── jest.config.ts / jest.setup.ts
├── README.md
└── SYSTEM_REFERENCE_AR.md
```

---

## Review by Category

---

### 1. Security — 3 / 10

#### [CRITICAL] Hardcoded demo credentials in source code

`src/features/auth/components/login-page.tsx` pre-fills `admin@test.com / Admin123!` directly in the component. This ships to production, exposes credentials in the JS bundle, and can be scraped.

```tsx
// BAD
defaultValues: { email: 'admin@test.com', password: 'Admin123!' }

// FIX: gate behind NODE_ENV
defaultValues: {
  email: process.env.NODE_ENV === 'development' ? 'admin@test.com' : '',
  password: process.env.NODE_ENV === 'development' ? 'Admin123!' : '',
}
```

#### [HIGH] `.env` committed instead of `.env.local`

The HERE Maps API key and backend URL are in `.env` (tracked by git by default) instead of `.env.local` (git-ignored by Next.js). Anyone cloning the repo gets your live API key.

```bash
# FIX: rename .env → .env.local, commit a template instead
# .env.example (commit this):
NEXT_PUBLIC_HERE_API_KEY=your_here_api_key_here
NEXT_PUBLIC_API_URL=/api-backend
```

#### [HIGH] No environment variable validation

`publicConfig` exposes raw `process.env` values that are `string | undefined`. Missing vars cause silent runtime failures deep in the app.

```ts
// FIX: validate at startup with Zod
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1),
  NEXT_PUBLIC_HERE_API_KEY: z.string().min(1),
})

export const publicConfig = envSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_HERE_API_KEY: process.env.NEXT_PUBLIC_HERE_API_KEY,
})
```

#### [MEDIUM] No HTTP security headers

`next.config.mjs` has no `headers()` export. Missing: `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`.

```js
// FIX: add to next.config.mjs
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
    ],
  }]
}
```

---

### 2. Performance — 4 / 10

#### [CRITICAL] Fetching all employees with `limit: 500`

`useEmployees.ts` fires a single query for 500 records on every page load, blocking hydration and consuming server memory. This will break as headcount grows.

```ts
// BAD
queryFn: () => employeesApi.getAll({ companyId, limit: 500 })

// FIX: server-side pagination
export function useEmployees(page = 1, pageSize = 25) {
  return useQuery({
    queryKey: ['employees', companyId, page, pageSize],
    queryFn: () => employeesApi.getAll({ companyId, page, pageSize }),
  })
}
```

#### [HIGH] No dynamic imports for heavy libraries

`html2pdf.js`, `XLSX`, `Leaflet`, and `HERE Maps` are all bundled eagerly. These are only needed for specific user actions (export, map pick) and should be loaded on demand.

```ts
// FIX: dynamic import on demand
async function handleExportPdf() {
  const { default: html2pdf } = await import('html2pdf.js')
  // use html2pdf...
}

// FIX: lazy-load map picker
const MapPicker = dynamic(() => import('@/components/ui/map-picker'), { ssr: false })
```

#### [HIGH] Both Leaflet AND HERE Maps included

Two competing map libraries are in the bundle simultaneously. Pick one and remove the other entirely.

#### [MEDIUM] `queryClient` created at module scope

```ts
// BAD — src/components/layouts/providers.tsx
const queryClient = new QueryClient({ ... }) // module-level, shared across SSR requests

// FIX: create inside component
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
    })
  )
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

#### [MEDIUM] No list virtualization

Large attendance logs, employee tables, and payroll records render all rows into the DOM at once. Use `@tanstack/react-virtual` for any list likely to exceed 100 rows.

```bash
npm install @tanstack/react-virtual
```

---

### 3. Testing — 2 / 10

#### [CRITICAL] Near-zero test coverage

200+ source files, 1 test file (`login-page.test.tsx`). All API functions, hooks, stores, and business logic are untested.

**Fix — priority order:**

```
1. Unit test the API client (client.ts)
   → mock fetch, verify auth headers, assert 401 triggers redirect

2. Unit test critical hooks (useEmployees, useCanI)
   → mock TanStack Query with renderHook()

3. Unit test Zod DTO schemas
   → validate parse/safeParse on edge-case payloads

4. Integration test auth flow
   → login → store populated → redirect happens

5. Add a coverage floor to jest.config.ts:
   coverageThreshold: { global: { lines: 60 } }
```

---

### 4. Next.js Best Practices — 5 / 10

#### [HIGH] No React Server Components — everything is `'use client'`

Every page and feature component uses `'use client'`, which disables RSC, forces all JS to ship to the browser, and removes streaming. Static shell parts should be server components.

```tsx
// FIX: app/(app)/layout.tsx — no 'use client' needed at the layout level
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />           {/* server component — static nav */}
      <ClientProviders>     {/* 'use client' only for context providers */}
        <main>{children}</main>
      </ClientProviders>
    </div>
  )
}
```

#### [HIGH] Missing `loading.tsx` and `error.tsx` route segments

None of the ~50 route segments have a `loading.tsx` (streaming skeleton) or `error.tsx` (error boundary). An unhandled error crashes the entire page tree.

```
# FIX: add to every major route segment
app/(app)/hr/organization/employees/
  ├── page.tsx
  ├── loading.tsx    ← skeleton UI while data loads
  └── error.tsx      ← catch and display errors gracefully
```

```tsx
// error.tsx
'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>Something went wrong: {error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

#### [MEDIUM] No per-page metadata

Only the root `layout.tsx` defines metadata. All sub-pages share the same browser tab title.

```ts
// FIX: add to each page.tsx
export const metadata: Metadata = {
  title: 'Employees | Rose HR',
  description: 'Manage your organization employees',
}

// or dynamic:
export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: `Employee ${params.id} | Rose HR` }
}
```

#### [LOW] `next-env.d.ts` is modified (appears in git diff)

This file is auto-generated by Next.js and must never be manually edited or committed with changes.

```bash
# FIX:
git checkout next-env.d.ts
```

---

### 5. State Management — 6 / 10

#### [HIGH] Provider hell — 5 nested React Contexts in one layout

`app/(app)/layout.tsx` wraps children in `SidebarProvider`, `PageTitleProvider`, `FilterPanelProvider`, `EntityFilterSlotProvider`, and `PageHeaderActionsProvider`. This creates 5 re-render boundaries.

```ts
// FIX: consolidate into one Zustand layout store
import { create } from 'zustand'

interface LayoutState {
  sidebarOpen: boolean
  pageTitle: string
  filterPanelOpen: boolean
  headerActions: React.ReactNode | null
  setSidebarOpen: (v: boolean) => void
  setPageTitle: (title: string) => void
  setFilterPanelOpen: (v: boolean) => void
  setHeaderActions: (actions: React.ReactNode | null) => void
}

export const useLayoutStore = create<LayoutState>()((set) => ({
  sidebarOpen: true,
  pageTitle: '',
  filterPanelOpen: false,
  headerActions: null,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setPageTitle: (title) => set({ pageTitle: title }),
  setFilterPanelOpen: (v) => set({ filterPanelOpen: v }),
  setHeaderActions: (actions) => set({ headerActions: actions }),
}))
```

#### [MEDIUM] Inconsistent store naming convention

Some stores are named `useHRViolationCasesStore.ts`, `useCircularsStore.ts` (looks like React hooks). Others: `auth-store.ts` (no `use` prefix). Zustand stores are not hooks — the `use` prefix misleads readers.

```
# FIX: rename store files to drop the "use" prefix
useHRViolationCasesStore.ts  → violation-cases-store.ts
useCircularsStore.ts         → circulars-store.ts
useNotificationsStore.ts     → notifications-store.ts

# Export the store and a derived hook separately:
export const violationCasesStore = create<ViolationCasesState>()(...)
export const useViolationCases = () => violationCasesStore((s) => s)
```

---

### 6. Code Organization & Conventions — 6 / 10

#### [MEDIUM] Inconsistent file naming

Same folders mix PascalCase and kebab-case. The README mandates kebab-case for all files.

```
# BAD — src/components/here-map/components/
MapOverlays.tsx   ← PascalCase
SidePanel.tsx     ← PascalCase
ToolButton.tsx    ← PascalCase
here-loader.ts    ← kebab-case (correct)
cursors.ts        ← kebab-case (correct)

# FIX: rename to kebab-case
MapOverlays.tsx  → map-overlays.tsx
SidePanel.tsx    → side-panel.tsx
ToolButton.tsx   → tool-button.tsx

# Also fix in components/ui/:
DateRangePicker.tsx → date-range-picker.tsx
```

#### [MEDIUM] Duplicate routes — `contracts/` and `payroll/`

The payroll sub-routes (`payroll-periods`, `payroll-salary-approvals`, `monthly-inputs`, `period/[periodId]`, `reports`) exist identically under both `app/hr/contracts/` and `app/hr/payroll/`. Two sets of pages to maintain for the same features.

**Fix:** keep payroll routes only under `app/hr/payroll/` and redirect from the contracts paths using Next.js `redirects()` in `next.config.mjs`.

#### [LOW] No barrel exports (`index.ts`)

Every import requires knowing the exact deep file path. Adding barrel files enforces each feature's public API.

```ts
// FIX: src/features/hr/organization/employees/index.ts
export { useEmployees } from './hooks/use-employees'
export { useCurrentEmployee } from './hooks/use-current-employee'
export { employeesApi } from './lib/api/employees'
export type { EmployeeResponseDto, CreateEmployeeDto } from './types'
```

#### [LOW] Database schema docs inside the frontend repo

`docs/full-database-schema.md`, `docs/pages-database-schema.md`, and `docs/pages-db-table-mapping.md` belong in the backend repo or a shared monorepo `docs/` folder — not the frontend.

---

### 7. Architecture & Structure — 7.5 / 10

The overall architecture is solid. Feature-based folder structure, thin page shells delegating to feature components, API module pattern, TanStack Query for server state, and Zustand for client state are all correct choices.

**Minor issues:**

#### [LOW] API client depth inconsistency

Shared HTTP client lives at `features/hr/lib/api/client.ts` (correct). Some domain APIs are deeply nested at `features/hr/organization/employees/lib/api/employees.ts`. Others may be shallower. Barrel exports (above) would hide this inconsistency from callers.

#### [LOW] `here-map` component self-contains its own types and constants

`here-map/types/types.ts` and `here-map/constants/constants.ts` are redundant nesting — a single `types.ts` and `constants.ts` directly inside `here-map/` is cleaner:

```
# BAD
here-map/
  types/types.ts
  constants/constants.ts

# FIX
here-map/
  types.ts
  constants.ts
```

---

### 8. Accessibility — 6.5 / 10

Using Radix UI primitives is the right foundation — dialogs, dropdowns, and selects are accessible by default. RTL layout is correctly implemented with `dir="rtl"`.

#### [MEDIUM] Custom `DataTable` missing ARIA roles

The hand-rolled `DataTable` uses `<div>`-based structure without semantic table roles. Screen readers cannot navigate it.

```tsx
// FIX: use a semantic <table> or add explicit ARIA
<div role="table" aria-label={label}>
  <div role="rowgroup">
    <div role="row">
      <div role="columnheader" aria-sort="ascending">Name</div>
    </div>
  </div>
  <div role="rowgroup">
    {rows.map(row => (
      <div role="row" key={row.id}>
        <div role="cell">{row.name}</div>
      </div>
    ))}
  </div>
</div>
```

#### [LOW] Icon-only buttons missing `aria-label`

Row action buttons that render only an icon have no accessible name.

```tsx
// FIX:
<Button aria-label="Edit employee"><PencilIcon /></Button>
<Button aria-label="Delete employee"><TrashIcon /></Button>
```

---

## Summary Scorecard

| Category | Score | Highest Severity Issue |
|---|---|---|
| Security | **3 / 10** | Hardcoded credentials + committed API key |
| Performance | **4 / 10** | `limit: 500` + no code splitting |
| Testing | **2 / 10** | 1 test for 200+ files |
| Next.js practices | **5 / 10** | No RSC, no error/loading boundaries |
| State management | **6 / 10** | 5 nested context providers |
| Code conventions | **6 / 10** | Mixed file naming, duplicate routes |
| Architecture | **7.5 / 10** | Good structure, minor gaps |
| Accessibility | **6.5 / 10** | Custom table missing ARIA |
| **Overall** | **5 / 10** | |

---

## Top 5 Fixes — Do These First

| Priority | Fix | Effort | Impact |
|---|---|---|---|
| 1 | Remove hardcoded credentials from `login-page.tsx`, move HERE key to `.env.local` | 15 min | Security |
| 2 | Add `loading.tsx` + `error.tsx` to main route segments | 30 min | Reliability |
| 3 | Fix `queryClient` — move instantiation inside `useState` in `providers.tsx` | 5 min | SSR correctness |
| 4 | Replace `limit: 500` in `useEmployees` with real server-side pagination | 2–4 hrs | Performance |
| 5 | Dynamic import `html2pdf.js` and `XLSX` on first use | 1 hr | Bundle size |
