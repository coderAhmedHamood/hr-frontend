# HR System Frontend — Complete Technical Reference

## Project Overview

**rose-hr (روز)** — A production-grade, Arabic-first enterprise HR management platform.

- **Framework:** Next.js 16.2.4 (App Router)
- **Language:** Arabic (RTL), with English support
- **Direction:** Right-to-Left (RTL) throughout
- **Backend:** Connects to NestJS REST API at `/api-backend`
- **Auth:** JWT Bearer tokens (stored in cookies)
- **Repository:** https://github.com/HailBahafi/HR-Managment.git

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| UI Library | React | 19.2.5 |
| Language | TypeScript (strict) | 6.0.3 |
| Styling | Tailwind CSS | 4.2.4 |
| Components | shadcn/ui (Radix-based) | — |
| State (client) | Zustand | 5.0.12 |
| State (server) | TanStack Query | 5.99.2 |
| Forms | React Hook Form + Zod | 7.73.1 / 4.3.6 |
| Tables | TanStack Table | 8.21.3 |
| Charts | Recharts | 3.8.1 |
| Animations | Framer Motion | 12.38.0 |
| Maps | Leaflet + react-leaflet + HERE Maps API | 1.9.4 / 5.0.0 |
| Icons | Lucide React | 1.8.0 |
| Toasts | Sonner | 2.0.7 |
| PDF Export | html2pdf.js | 0.10.2 |
| Excel Export | XLSX | 0.18.5 |
| QR Codes | QRCode | 1.5.4 |
| Date Utils | date-fns | 4.1.0 |
| Body font | IBM Plex Sans Arabic | — |
| Display font | Rubik | — |

---

## Environment Variables

Create a `.env` file in the project root:

```env
NEXT_PUBLIC_API_URL=/api-backend
NEXT_PUBLIC_HERE_API_KEY=_wp5c7RJh-glowTGxHT5SmnpQ_KeShK5_Nqze8g7XvI
BACKEND_URL=http://localhost:3000
```

- `NEXT_PUBLIC_API_URL` — Base path for all API calls (rewritten to backend via Next.js rewrite)
- `NEXT_PUBLIC_HERE_API_KEY` — HERE Maps API key for geolocation features
- `BACKEND_URL` — Server-side backend URL (used in Next.js rewrites; not exposed to browser)

---

## How to Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev                  # http://localhost:3001 (or next available port)

# Production build
npm run build
npm start

# Lint
npm run lint
```

**Login credentials (demo — requires backend to be seeded):**
- Email: `admin@test.com`
- Password: `Admin123!`

> The login page pre-fills these credentials automatically.

---

## Design System

### Color Palette (HSL CSS Variables)

All colors are defined as CSS custom properties in `src/app/globals.css`.

#### Light Mode
| Token | HSL Value | Usage |
|-------|----------|-------|
| `--primary` | `hsl(175 55% 18%)` | Deep forest teal — buttons, links, active states |
| `--primary-50` | `hsl(175 40% 96%)` | Lightest teal tint |
| `--primary-100` | `hsl(175 38% 90%)` | Light teal surface |
| `--primary-200` | `hsl(175 35% 80%)` | Teal mid-light |
| `--primary-500` | `hsl(175 50% 30%)` | Teal mid |
| `--primary-700` | `hsl(175 55% 22%)` | Darker teal |
| `--primary-900` | `hsl(175 60% 12%)` | Deepest teal |
| `--gold` | `hsl(38 62% 52%)` | Warm burnished gold — accent, badges |
| `--background` | `hsl(38 30% 97%)` | Ivory parchment — page background |
| `--foreground` | `hsl(180 25% 10%)` | Deep forest ink — body text |
| `--secondary` | `hsl(38 20% 92%)` | Warm off-white |
| `--muted` | `hsl(38 15% 94%)` | Subtle surface |
| `--sidebar` | `hsl(175 55% 12%)` | Dark teal sidebar |
| `--sidebar-foreground` | `hsl(38 30% 92%)` | Ivory sidebar text |
| `--success` | `hsl(152 55% 32%)` | Green |
| `--warning` | `hsl(32 90% 50%)` | Amber/orange |
| `--destructive` | `hsl(6 72% 48%)` | Red |

#### Dark Mode
- Primary swaps to gold accent
- Background → `hsl(180 25% 7%)` (very dark teal)
- Foreground → Ivory
- High contrast adjustments throughout

### Typography

| Font | Usage | Weights |
|------|-------|---------|
| IBM Plex Sans Arabic | Body, UI, labels, inputs | 300, 400, 500, 600, 700 |
| Rubik | Headlines, display text | 400, 500, 600, 700, 800, 900 |

### Shadows

```css
--shadow-soft:     0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)
--shadow-elevated: 0 4px 24px -4px rgba(0,0,0,0.08)
--shadow-luxe:     0 20px 48px -12px rgba(0,0,0,0.15)
```

### Border Radius

```css
--radius-lg: 0.75rem   (default)
--radius-md: 0.5rem
--radius-sm: 0.25rem
```

### Custom CSS Classes

| Class | Description |
|-------|-------------|
| `.font-arabic-display` | Rubik font with Arabic kerning |
| `.glass-card` | Glassmorphism (backdrop blur + gradient) |
| `.luxe-card` | Editorial luxury card styling |
| `.dotted-bg` | Subtle dotted background pattern |

### Animations

- `fade-in` — Opacity + translateY
- `pulse-soft` — Gentle breathing pulse
- `shimmer` — Loading skeleton shimmer
- Radix UI `enter`/`exit` — CSS variable-driven state transitions

---

## Folder Structure

```
src/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (fonts, metadata, Providers)
│   ├── globals.css                   # Design tokens (CSS variables) + @layer
│   ├── page.tsx                      # Root redirect
│   │
│   ├── login/
│   │   └── page.tsx                  # Login page
│   │
│   ├── apply/[formId]/
│   │   └── page.tsx                  # Public job application form
│   │
│   ├── f/[jobSlug]/
│   │   └── page.tsx                  # Public job listing page
│   │
│   └── (app)/                        # Authenticated shell
│       ├── layout.tsx                # AppLayout (Sidebar + Topbar + FilterPanel)
│       └── hr/                       # HR module root
│           ├── dashboard/            # KPI dashboard
│           ├── organization/
│           │   ├── employees/        # Employee list + [id] profile
│           │   ├── departments/
│           │   ├── branches/
│           │   ├── job-titles/
│           │   ├── contacts/
│           │   └── chart/            # Org chart
│           ├── attendance/
│           │   └── [section]/
│           ├── leaves/
│           │   ├── [section]/
│           │   ├── analytics/
│           │   └── balance-credit/
│           ├── contracts/
│           │   ├── employment/
│           │   ├── articles/
│           │   ├── employee-advances/
│           │   ├── payroll-periods/
│           │   ├── payroll-salary-approvals/
│           │   ├── period/[periodId]/compensation/
│           │   └── reports/
│           ├── requests/
│           │   ├── unified-management/
│           │   ├── attendance-corrections/
│           │   ├── approval-assignment/
│           │   ├── request-types/
│           │   └── [department]/[requestType]/
│           ├── discipline/
│           │   └── [section]/
│           ├── recruitment/
│           │   ├── ats/
│           │   ├── ats-admin/jobs/
│           │   ├── ats-applicants/
│           │   └── ats-pipeline/
│           ├── notifications/
│           ├── permissions/
│           └── settings/
│               ├── departments/
│               └── request-types/
│
├── components/
│   ├── layouts/                      # App shell components
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   ├── filter-panel.tsx
│   │   ├── providers.tsx             # TanStack Query setup
│   │   ├── sidebar-context.tsx
│   │   ├── page-title-context.tsx
│   │   ├── filter-panel-context.tsx
│   │   └── authenticated-shell.tsx
│   │
│   ├── ui/                           # shadcn/ui components
│   │   ├── button.tsx, input.tsx, label.tsx
│   │   ├── avatar.tsx, badge.tsx, card.tsx
│   │   ├── dialog.tsx, dropdown-menu.tsx
│   │   ├── select.tsx, calendar.tsx, popover.tsx
│   │   ├── tabs.tsx, toast.tsx, tooltip.tsx
│   │   ├── data-table.tsx            # Generic TanStack table
│   │   ├── multi-select.tsx
│   │   ├── employee-picker.tsx       # Employee selection modal
│   │   ├── map-picker.tsx            # HERE Maps integration
│   │   └── directory-table.tsx
│   │
│   ├── pdf/
│   │   ├── pdf-preview-export-dialog.tsx
│   │   └── print/                    # Print templates (attendance, discipline, etc.)
│   │
│   └── here-map/                     # HERE Maps wrapper + overlays
│
├── features/
│   ├── auth/
│   │   ├── components/login-page.tsx
│   │   ├── lib/
│   │   │   ├── auth-store.ts         # Zustand: user, accessProfile, activeCompanyId, activeBranchId
│   │   │   └── api/auth.ts           # login, logout, access-profile APIs
│   │   ├── hooks/
│   │   │   ├── use-auth-session.ts
│   │   │   ├── use-access-profile.ts
│   │   │   ├── use-can.ts            # Permission check hook
│   │   │   └── use-logout.ts
│   │   └── types/access-profile.ts
│   │
│   └── hr/
│       ├── lib/api/
│       │   ├── client.ts             # Core HTTP client (apiRequest)
│       │   ├── types.ts              # ApiSuccessEnvelope, ApiErrorEnvelope, PaginatedResult
│       │   └── global-error-handler.ts
│       │
│       ├── dashboard/
│       ├── organization/
│       │   ├── employees/            # List, detail, forms, hooks, audit log, rose forms
│       │   ├── departments/
│       │   ├── branches/
│       │   ├── job-titles/
│       │   ├── contacts/
│       │   └── chart/
│       ├── attendance/               # Shifts, assignments, daily, checkpoints, events, summaries
│       ├── leaves/                   # Leave types, requests, balances, public holidays, analytics
│       ├── contracts/                # Contracts, allowances, payroll periods, payslips, advances
│       ├── requests/                 # Unified requests, corrections, approval assignment, types
│       ├── discipline/               # Violations, notices, circulars, investigations, appeals
│       ├── recruitment/              # ATS, applicants, pipeline, job postings
│       ├── permissions/              # RBAC management UI
│       ├── notifications/            # Notification inbox
│       └── payroll/                  # Payroll features
│
└── shared/
    ├── config/index.ts               # publicConfig (apiUrl, hereApiKey, appName)
    ├── utils.ts                      # cn, toWesternDigits, formatCurrency, formatDate, getInitials
    └── export/download-xlsx.ts       # Excel export utilities
```

---

## All Pages & Routes

### Public Routes
| Route | Description |
|-------|-------------|
| `/login` | Login page (pre-filled with admin@test.com / Admin123!) |
| `/f/[jobSlug]` | Public job listing page |
| `/apply/[formId]` | Public job application form |

### Authenticated Routes (`/hr/...`)

#### Dashboard
| Route | Description |
|-------|-------------|
| `/hr/dashboard` | KPIs, charts, recent activity, late employees, quick actions |

#### Organization
| Route | Description |
|-------|-------------|
| `/hr/organization/employees` | Employee list — grid or table view, with filters |
| `/hr/organization/employees/[id]` | Employee profile — personal, employment, attendance, leaves, payslips, requests |
| `/hr/organization/departments` | Department hierarchy management |
| `/hr/organization/branches` | Branch management |
| `/hr/organization/job-titles` | Job title catalog |
| `/hr/organization/contacts` | External contacts directory |
| `/hr/organization/chart` | Interactive org chart |

#### Attendance
| Route | Description |
|-------|-------------|
| `/hr/attendance` | Attendance overview |
| `/hr/attendance/[section]` | Daily attendance, shift templates, checkpoints (section-driven) |
| `/hr/attendance/assignment` | Assign shift templates to employees |

#### Leaves & Time Off
| Route | Description |
|-------|-------------|
| `/hr/leaves` | Leaves overview |
| `/hr/leaves/[section]` | Leave requests management (approve/reject) |
| `/hr/leaves/leave-types` | Configure leave types |
| `/hr/leaves/public-holidays` | Define public holidays |
| `/hr/leaves/analytics` | Leave usage analytics & reports |
| `/hr/leaves/balance-credit` | Add/adjust leave balances |

#### Payroll & Contracts
| Route | Description |
|-------|-------------|
| `/hr/contracts` | Contracts overview |
| `/hr/contracts/employment` | Employee contracts |
| `/hr/contracts/articles` | Contract article templates |
| `/hr/contracts/employee-advances` | Salary advances |
| `/hr/contracts/payroll-periods` | Payroll period definitions |
| `/hr/contracts/payroll-salary-approvals` | Salary approval workflow |
| `/hr/contracts/period/[periodId]` | Specific payroll period detail |
| `/hr/contracts/period/[periodId]/compensation` | Compensation breakdown |
| `/hr/contracts/reports` | Contract analytics |

#### Requests & Approvals
| Route | Description |
|-------|-------------|
| `/hr/requests` | Requests overview |
| `/hr/requests/unified-management` | All leave requests in one view |
| `/hr/requests/attendance-corrections` | Attendance correction requests |
| `/hr/requests/approval-assignment` | Configure approval chains |
| `/hr/requests/request-types` | Define custom request types |
| `/hr/requests/[department]/[requestType]` | Department-specific dynamic request forms |

#### Discipline
| Route | Description |
|-------|-------------|
| `/hr/discipline` | Discipline overview |
| `/hr/discipline/[section]` | Violations, notices, circulars, investigations, appeals, deductions, audit log |

#### Recruitment
| Route | Description |
|-------|-------------|
| `/hr/recruitment/ats` | Applicant Tracking System dashboard |
| `/hr/recruitment/ats-admin` | ATS configuration |
| `/hr/recruitment/ats-admin/jobs` | Job postings management |
| `/hr/recruitment/ats-admin/jobs/create` | Create job posting |
| `/hr/recruitment/ats-applicants` | All applicants |
| `/hr/recruitment/ats-pipeline` | Kanban hiring pipeline |

#### System
| Route | Description |
|-------|-------------|
| `/hr/notifications` | Notification inbox |
| `/hr/permissions` | RBAC role & permission management |
| `/hr/settings` | General settings |
| `/hr/settings/departments` | Department settings |
| `/hr/settings/request-types` | Request type settings |

---

## State Management Architecture

### Auth Store (`features/auth/lib/auth-store.ts`) — Zustand

```typescript
{
  user: User | null
  accessProfile: AccessProfile | null
  activeCompanyId: string | null
  activeBranchId: string | null
  
  setUser(user)
  setAccessProfile(profile)
  setActiveContext(companyId, branchId)
  clear()
}
```

### Layout Contexts (React Context — NOT Zustand)

| Context | State |
|---------|-------|
| `useSidebar` | `isOpen` (sidebar open/closed) |
| `usePageTitle` | `titleAr`, `descriptionAr`, `iconName` |
| `useFilterPanel` | filter visibility + state |
| `useEntityFilterSlot` | dynamic filter slots |
| `usePageHeaderActions` | action buttons in page header |

### HR Feature Stores (Zustand — one per domain)

| Store | Domain |
|-------|--------|
| `useAttendanceStore` | Shifts, assignments, events, summaries, checkpoints |
| `useHRContractsStore` | Contracts |
| `useAllowanceTypesStore` | Allowance types |
| `useContractArticlesStore` | Contract articles |
| `useContractTemplatesStore` | Contract templates |
| `usePayrollPeriodsStore` | Payroll periods |
| `useEmployeeAdvancesStore` | Employee advances |
| `usePayrollSalaryCircularStore` | Salary circular approvals |
| `useHRViolationTypesStore` | Violation types |
| `useHRViolationCasesStore` | Violation cases |
| `useNoticesStore` | Discipline notices |
| `useCircularsStore` | Circulars |
| `useInvestigationsStore` | Investigations |
| `useAppealsStore` | Appeals |
| `useDisciplinePayrollDeductionsStore` | Discipline deductions |
| `useDisciplineApprovalStore` | Approval configuration |
| `useDisciplineAuditLogStore` | Discipline audit trail |
| `useSubmissionsStore` | Request submissions |
| `useApprovalAssignmentStore` | Approval chains |
| `useAttendanceCorrectionStore` | Attendance corrections |
| `useConfigurationStore` | Request type configuration |
| `useEmployeeDirectoryStore` | Employee directory for requests |
| `useRecruitmentStore` | Recruitment |
| `useATSStore` | ATS (jobs, applicants, pipeline) |
| `useNotificationsStore` | Notification inbox |
| `useExternalContactsStore` | External contacts (localStorage-persisted) |
| `useJobTitleTemplatesStore` | Job title templates |

---

## Data Fetching Pattern

### API Client (`src/features/hr/lib/api/client.ts`)

```typescript
async function apiRequest<T>(path: string, options?: RequestInit): Promise<T>
```

- Base URL: `publicConfig.apiUrl` (= `NEXT_PUBLIC_API_URL` = `/api-backend`)
- Auth: `Authorization: Bearer <token>` from `access_token` cookie
- Auto-unwraps backend envelope `{ status, message, data, error }`
- Throws `ApiError` on non-2xx responses
- Next.js rewrites `/api-backend/:path*` → `${BACKEND_URL}/:path*` (server-side proxy)

### TanStack Query

- Default `staleTime: 60_000ms`
- `refetchOnWindowFocus: false`
- Cache keys follow pattern: `['resource', filters...]`

### API Module Pattern

```typescript
// Example: features/hr/organization/employees/lib/api/employees.ts
export const employeesApi = {
  getAll(query?)   → apiRequest<PaginatedResult<Employee>>('/hr/employees', ...)
  getById(id)      → apiRequest<Employee>(`/hr/employees/${id}`)
  create(payload)  → apiRequest<Employee>('/hr/employees', { method: 'POST', ... })
  update(id, data) → apiRequest<Employee>(`/hr/employees/${id}`, { method: 'PATCH', ... })
  remove(id)       → apiRequest<void>(`/hr/employees/${id}`, { method: 'DELETE' })
}
```

---

## Form Handling

**Stack:** React Hook Form + Zod + `@hookform/resolvers`

```typescript
const schema = z.object({
  nameAr: z.string().min(1, 'الاسم مطلوب'),
  email: z.string().email(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { nameAr: '', email: '' },
});

const onSubmit = async (values) => {
  try {
    await employeesApi.create(values);
    toast.success('تم الحفظ بنجاح');
  } catch (err) {
    const { displayMessage } = handleApiError(err, 'create-employee');
    toast.error(displayMessage);
  }
};
```

---

## Key Custom Hooks

### Auth
| Hook | Returns |
|------|---------|
| `useAuthSession()` | Current user session |
| `useAccessProfile()` | Company/branch permission map |
| `useCanI(action)` | `boolean` — permission check |
| `useLogout()` | Logout handler |

### HR
| Hook | Returns |
|------|---------|
| `useActiveCompany()` | Active company context |
| `useEmployees(query)` | Paginated employee list |
| `useCurrentEmployee(id)` | Single employee |
| `useEmployeesListModel()` | View model for grid/table switch |
| `useEmployeeProfileData(id)` | All profile sections |
| `useEmployeeProfilePersonal(id)` | Personal info |
| `useEmployeeProfileAttendance(id)` | Attendance history |
| `useEmployeeProfileLeave(id)` | Leave history |

---

## Arabic Localization & RTL

### RTL Setup
```html
<html lang="ar" dir="rtl">
```
- All Tailwind classes auto-mirror for RTL (e.g., `ml-*` becomes `mr-*`)
- Sonner toasts: `dir="rtl"`

### Utility Functions (`src/shared/utils.ts`)
```typescript
toWesternDigits(str)     // ٠١٢٣ → 0123
formatCurrency(n)        // → "1,234 ر.س"
formatDate(date)         // Arabic locale, Western numerals
formatTime(date)         // "14:30"
getInitials(name)        // "أحمد محمد" → "أم"
```

### Bilingual Properties
- All entity display fields: `nameAr` + `nameEn`
- All labels/notes: `labelAr` + `labelEn`, `noteAr` + `noteEn`

---

## Third-Party Integrations

### HERE Maps
- Configured via `NEXT_PUBLIC_HERE_API_KEY`
- Used in attendance/location features (check-in points)
- Custom overlay components: `MapOverlays.tsx`, `SidePanel.tsx`, `ToolButton.tsx`
- Map picker modal: `src/components/ui/map-picker.tsx`

### PDF Export (html2pdf.js)
- Client-side PDF generation
- Print templates in `src/components/pdf/print/`:
  - `attendance-register-print-html.tsx`
  - `discipline-audit-log-print-html.tsx`
  - Other domain-specific print templates

### Excel Export (XLSX)
```typescript
downloadXlsxFromAoA(filename, headers, rows)
downloadXlsxMultiSheet(filename, sheets)
```

### QR Codes
- `QRCode` library for generating QR codes (employee cards, etc.)

---

## Next.js Configuration (`next.config.mjs`)

```javascript
rewrites: [
  { source: '/api-backend/:path*', destination: `${BACKEND_URL}/:path*` }
]
redirects: [
  { source: '/employees', destination: '/hr/organization/employees', permanent: true },
  // ...other legacy redirects
]
imageRemotePatterns: ['unsplash.com', 'pravatar.cc']
reactStrictMode: true
```

---

## Component Patterns

### Page Component (App Router)
```tsx
// src/app/(app)/hr/organization/employees/page.tsx
export default function Page() {
  return <EmployeesListPage />;  // Thin wrapper — all logic in feature component
}
```

### Feature Page Component
```tsx
// src/features/hr/organization/employees/components/employees-list-page.tsx
'use client'
export function EmployeesListPage() {
  useSetPageTitle({ titleAr: 'الموظفين', iconName: 'Users' });
  const { employees, isLoading } = useEmployees();
  // ... render
}
```

### Permission Guard
```tsx
const canCreate = useCanI('hr.employees.create');
{canCreate && <Button onClick={openCreateDialog}>إضافة موظف</Button>}
```

---

## Data Visualization

### Charts (Recharts)
- Dashboard: Line, Bar, Pie, Radar, Area charts
- Leave analytics: Usage trends
- Custom Arabic tooltips
- All charts responsive via `ResponsiveContainer`

### Tables (TanStack Table + shadcn data-table)
- Column definitions with sort, filter
- Pagination via `PaginatedResult` from backend
- Row selection + bulk actions
- Expandable rows for detail views

---

## Key Conventions

1. **File naming:** `kebab-case.tsx` — exports `PascalCase` component
2. **Store naming:** `use{Feature}Store` (Zustand)
3. **Hook naming:** `use{Feature}` (React convention)
4. **API modules:** `{resource}Api.{method}()` objects
5. **Arabic primary:** All UI labels in Arabic; English as fallback
6. **Colors in HSL:** All theme colors use HSL format for theming
7. **`'use client'` on feature pages:** All interactive pages are client components
8. **Page = thin shell:** Route files (`page.tsx`) just render the feature component
9. **Envelope unwrapping:** API client always unwraps `{ data }` before returning

---

## Important Notes for AI

1. **Arabic-first RTL app** — design, fonts, layout, and text are all Arabic-primary
2. **Next.js App Router** — NOT Pages Router; uses `layout.tsx`, `page.tsx`, `(app)` route groups
3. **Two state layers** — Zustand for client state, TanStack Query for server state (both in use)
4. **API goes through Next.js proxy** — frontend calls `/api-backend/...` which is rewritten to `BACKEND_URL`
5. **JWT in cookies** — auth token stored as `access_token` cookie, not localStorage
6. **`useCanI(action)`** — always use this for permission checks, never hardcode role names
7. **Dynamic route sections** — `/hr/attendance/[section]`, `/hr/discipline/[section]` etc. serve multiple sub-features via the same route file
8. **Two leave systems** — legacy leave requests AND new unified leave request system both exist in UI
9. **HERE Maps** — not Google Maps; uses HERE Maps JavaScript SDK
10. **Bilingual everywhere** — always provide both `*Ar` and `*En` when creating/updating entities
11. **SAR currency, Asia/Riyadh timezone** — Saudi Arabia locale defaults
12. **`toWesternDigits()`** — always use when displaying Arabic-language numbers in UI

---

*Last updated: 2026-05-24 | Stack: Next.js 16 + React 19 + TypeScript 6 + Tailwind 4*
