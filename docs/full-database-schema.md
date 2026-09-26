Full Database Schema — HR System (UI-driven)

Purpose: definitive schema mapping for backend developers. Each table lists columns, suggested Postgres types, nullability, and a short description explaining why the field exists (mapped from UI, TS types, and runtime code). This covers the data required by the frontend pages in this repository. 
ok
Notes:
- This is a recommended starting schema derived from UI and TypeScript sources. Backend may normalize, split, or change types as desired.
- JSONB columns are used where frontend stores dynamic or arbitrary field sets (e.g., request field_values, approval snapshots).
- Timestamps use timestamptz (TIMESTAMP WITH TIME ZONE).

Contents:
- Employees
- Branches
- Departments
- Job title templates
- External contacts
- Roles & permissions
- Contracts, contract templates & contract articles
- Employee advances
- Payroll (periods, lines, inputs, circular states)
- Payslips
- Requests & templates (general, table, dynamic `[department]/[requestType]`, attendance corrections, unified leave management route, approval-assignment, request-types settings)
- Attendance (shift templates, periods, assignments, events, summaries, checkpoints)
- Leaves (types, public holidays, unified requests, **per-employee leave balances**, balance credit requests)
- Discipline (violation types, cases, notices, circulars, investigations, deductions, appeals, penalties, discipline audit log)
- Notifications
- Employee audit log
- Allowance catalog, attachments metadata, Rose forms (persisted artefacts)
- Workforce directory extension (HR directory row parallel to canonical employee row)
- Users (authentication; UI login only today)

---

## Schema coverage audit (frontend stores vs this document)

Persisted/feature stores audited: contracts (employment, templates, articles, allowance types, advances), payroll periods and salary circular approvals, HR configuration (departments, request templates, request types), request submissions and approval-assignment templates (requests + discipline — two localStorage slices, one logical table), attendance (templates, assignments, events, checkpoints, summaries), leaves (catalog, unified management, **balance rows per employee**, balance credit requests), discipline (violations, notices, circulars, investigations, penalties, payroll deductions list, appeals, discipline audit log), notifications, employee directory, external contacts, job title templates, employee audit log and Rose Trading forms UI.

**App Router checkpoints:** every persisted page under `src/app/(app)/hr/**/page.tsx` maps to § above — notably `/hr/contracts/reports`, `/period/[periodId]/compensation` (derived from `payroll_*` snapshots), `/hr/leaves/analytics` (aggregates/mock today; derive from `leave_requests` + `employees`), `/login` (**`users`** + session policy not in SPA). Root `/hr/requests` redirects to `general`; no separate schema.

If a table appears below **and** marked optional — backend can omit it initially but the UI expectation is documented.

---

## employees
Primary profile for each person in the system.

Columns (suggested Postgres types):
- id UUID PRIMARY KEY NOT NULL
- employee_code TEXT NOT NULL UNIQUE
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- email TEXT NULL
- phone TEXT NULL
- national_id TEXT NULL
- nationality TEXT NULL
- avatar TEXT NULL
- avatar_hue INTEGER NULL -- optional visual seed used by some analytics/avatars
- position TEXT NULL
- department_id UUID NULL REFERENCES departments(id)
- branch_id UUID NULL REFERENCES branches(id)
- manager_id UUID NULL REFERENCES employees(id)
- contract_type TEXT NULL -- enum candidate (permanent|temporary|part-time|contract)
- contract_status TEXT NULL -- enum candidate (active|suspended|ended)
- start_date DATE NULL
- end_date DATE NULL
- base_salary NUMERIC(12,2) DEFAULT 0
- housing_allowance NUMERIC(12,2) DEFAULT 0
- transport_allowance NUMERIC(12,2) DEFAULT 0
- other_allowances NUMERIC(12,2) DEFAULT 0
- gosi NUMERIC(12,2) DEFAULT 0
- bank_account TEXT NULL
- iban TEXT NULL
- address TEXT NULL
- open_stream TEXT NULL
- village TEXT NULL
- district TEXT NULL
- city TEXT NULL
- emergency_contact TEXT NULL
- gender TEXT NULL -- (male|female)
- birth_date DATE NULL
- marital_status TEXT NULL -- (single|married)
- role TEXT NULL -- legacy code
- assigned_role_id UUID NULL REFERENCES roles(id)
- meta JSONB NULL -- optional for extensions
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

Indexes: employee_code (unique), department_id, branch_id, national_id

Purpose: contains all fields the UI reads/writes across personal, employment and financial panes. Optional location fields are present for search and integration flows.

---

## employee_workforce_extensions

Optional **1:1** extension for `HREmployeeDirectoryRow` data used by org chart, approver pickers, and «new employee» tabs — where the SPA keeps fields not always present on the legacy `Employee` mock row.

Columns:
- employee_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE
- bridge_id TEXT NULL -- display / HR bridge number in directory UI
- job_title_ar TEXT NULL
- job_title_en TEXT NULL
- hire_date DATE NULL -- may mirror `employees.start_date`; keep if directory uses different semantics
- employment_status TEXT NULL -- active|probation|suspended (`HREmployeeStatus`)
- hierarchy_role TEXT NULL -- ceo|executive|gm|dept_head|supervisor|staff
- reports_to_id UUID NULL REFERENCES employees(id)
- national_id TEXT NULL -- directory copy when profile row is split
- department_id UUID NULL REFERENCES departments(id) -- directory copy / override
- home_branch_id UUID NULL REFERENCES branches(id) -- `UnifiedEmployee.homeBranchId` (unified leave / analytics filters)
- branch_postings JSONB NULL -- `BranchPosting[]` (temporary postings per branch spanning `from`/`to` dates)
- email TEXT NULL -- directory copy (optional if same as employees.email)
- mobile TEXT NULL
- internal_notes TEXT NULL -- maps `HREmployeeDirectoryRow.notes`
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: consolidates directory vs profile if you split concerns in the API; **nullable** if you collapse into a single `employees` table in Phase 1.

---

## branches

Columns:
- id UUID PRIMARY KEY
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- city TEXT NULL
- manager TEXT NULL
- employees_count INTEGER DEFAULT 0
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: org-level branches used by UI lists and employee lookups.

---

## departments

Columns:
- id UUID PRIMARY KEY
- parent_id UUID NULL REFERENCES departments(id)
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- slug TEXT NULL UNIQUE
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: organization tree. Used by Department UI and request scoping.

---

## job_title_templates

Columns:
- id UUID PRIMARY KEY
- title_ar TEXT NOT NULL
- description_ar TEXT NULL
- default_department_id UUID NULL REFERENCES departments(id)
- sort_order INTEGER DEFAULT 0
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: job title choices and templates shown on job title page and employee creation.

---

## external_parties

Columns:
- id UUID PRIMARY KEY
- kind TEXT NOT NULL -- customer|visitor|supplier|partner|sales_lead|other
- name_ar TEXT NOT NULL
- phone TEXT NULL
- email TEXT NULL
- organization_ar TEXT NULL
- notes TEXT NULL
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: contacts directory.

---

## roles

Columns:
- id UUID PRIMARY KEY
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- description TEXT NULL
- users_count INTEGER DEFAULT 0
- color TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()

## role_permissions

Columns:
- id UUID PRIMARY KEY
- role_id UUID NOT NULL REFERENCES roles(id)
- permission_key TEXT NOT NULL -- e.g. "employees.view"

Purpose: permission matrix used by permissions UI.

---

## contract_templates

Employment contract **wizard presets** (distinct from legal `contract_articles`). Powers `EmploymentContractsClient` presets in `contract-templates-store`.

Frontend note: that store is **in-memory seeded** today (no `persist` middleware) — the table still matches what the wizard needs once the backend owns templates.

Columns:
- id UUID PRIMARY KEY NOT NULL
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- description_ar TEXT NULL
- default_contract_nature TEXT NOT NULL -- HRContractNature
- default_work_arrangement TEXT NOT NULL -- flexible|full_time|part_time
- default_probation_days INTEGER NULL
- suggested_base_salary NUMERIC(12,2) DEFAULT 0
- currency TEXT DEFAULT 'SAR'
- duration_months INTEGER NULL
- allowance_type_ids TEXT[] NULL -- logical FK to allowance_types.id
- allowances_hint TEXT NULL
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true
- updated_at TIMESTAMPTZ DEFAULT now()

---

## contracts

Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- contract_number TEXT NOT NULL
- contract_type TEXT NULL -- fixed_term|indefinite|task_based|temporary|seasonal
- work_arrangement TEXT NULL -- flexible|full_time|part_time
- start_date DATE NULL
- end_date DATE NULL
- probation_days INTEGER NULL
- annual_leave_days INTEGER NULL
- base_salary NUMERIC(12,2) DEFAULT 0
- currency TEXT DEFAULT 'SAR'
- status TEXT NULL -- draft|active|expired|terminated|archived
- template_id UUID NULL REFERENCES contract_templates(id)
- allowances_note TEXT NULL
- deductions_note TEXT NULL
- amends_contract_id UUID NULL REFERENCES contracts(id)
- superseded_by_contract_id UUID NULL REFERENCES contracts(id)
- early_termination_reason TEXT NULL
- article_ids TEXT[] NULL
- updated_at TIMESTAMPTZ DEFAULT now()

## contract_allowance_lines

Columns:
- id UUID PRIMARY KEY
- contract_id UUID NOT NULL REFERENCES contracts(id)
- allowance_type_id TEXT
- amount NUMERIC(12,2) DEFAULT 0

## contract_articles

Columns:
- id UUID PRIMARY KEY
- code TEXT NOT NULL
- title TEXT NOT NULL
- body TEXT
- is_basic BOOLEAN DEFAULT false
- is_active BOOLEAN DEFAULT true
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: employment contracts and linked articles / allowances.

---

## employee_advances

Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- amount NUMERIC(12,2) NOT NULL
- currency TEXT DEFAULT 'SAR'
- advance_date DATE NOT NULL
- note TEXT NULL
- status TEXT NOT NULL -- outstanding|repaid|cancelled
- advance_kind TEXT NULL -- housing|personal|urgent|violation
- repayment_mode TEXT NULL -- by_months|by_monthly_amount
- repayment_months INTEGER NULL
- monthly_installment_amount NUMERIC(12,2) NULL
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: employee loans/advances.

---

## payroll_periods

Columns:
- id UUID PRIMARY KEY
- code TEXT
- name_ar TEXT
- name_en TEXT
- period_start DATE
- period_end DATE
- status TEXT -- draft|open|closed
- compensation_review_status TEXT -- draft|first_review|second_review|approved
- snapshot_contract_ids TEXT[] NULL
- employment_lines_count INTEGER DEFAULT 0
- lines_materialized_at TIMESTAMPTZ NULL -- when employment snapshot lines were materialized (`linesMaterializedAt` in frontend store)
- employment_line_monthly_inputs_json JSONB NULL -- optional denormalized
- notes TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

## payroll_employment_lines

Columns:
- id UUID PRIMARY KEY
- period_id UUID NOT NULL REFERENCES payroll_periods(id)
- sort_order INTEGER NOT NULL DEFAULT 0 -- UI ordering (`HRPayrollEmploymentLine.sortOrder`)
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT
- department_snapshot TEXT
- job_title_ar_snapshot TEXT
- base_salary_snapshot NUMERIC(12,2)
- contract_currency TEXT NULL -- e.g. SAR; required for compensation preview (`HRPayrollEmploymentLine.contractCurrency`)
- contract_id UUID NULL
- contract_number TEXT NULL
- captured_at TIMESTAMPTZ NULL

## payroll_monthly_inputs

Columns:
- id UUID PRIMARY KEY
- employment_line_id UUID NOT NULL REFERENCES payroll_employment_lines(id)
- kind TEXT NOT NULL -- absence_days|late_minutes|overtime_hours|deduction_amount|allowance_amount|advance_recovery|other
- value NUMERIC(12,2) NOT NULL
- note TEXT NULL

## payroll_salary_circular_states

Columns:
- period_id UUID NOT NULL
- employment_line_id UUID NOT NULL
- send_status TEXT NOT NULL -- not_sent|sent
- sent_at TIMESTAMPTZ NULL
- read_status TEXT NOT NULL -- not_read|read
- read_at TIMESTAMPTZ NULL
- approval_status TEXT NOT NULL -- pending|approved|rejected|ignored
- responded_at TIMESTAMPTZ NULL
- PRIMARY KEY (period_id, employment_line_id)

Purpose: payroll period capture and per-line monthly inputs and circular state tracking.

---

## payslips

Columns:
- id UUID PRIMARY KEY
- payroll_period_id UUID NULL REFERENCES payroll_periods(id) -- link historical slip to payroll run when generating from `/hr/contracts/payroll-periods` flows
- employee_id UUID NOT NULL REFERENCES employees(id)
- month TEXT NOT NULL -- YYYY-MM
- year INTEGER NOT NULL
- base_salary NUMERIC(12,2)
- housing NUMERIC(12,2)
- transport NUMERIC(12,2)
- other_allowances NUMERIC(12,2)
- overtime NUMERIC(12,2)
- gosi NUMERIC(12,2)
- absence_deduction NUMERIC(12,2)
- lateness_deduction NUMERIC(12,2)
- loan_deduction NUMERIC(12,2)
- other_deductions NUMERIC(12,2)
- gross NUMERIC(12,2)
- net NUMERIC(12,2)
- working_days INTEGER
- present_days INTEGER
- absent_days INTEGER
- late_days INTEGER
- created_at TIMESTAMPTZ DEFAULT now()

Purpose: payslip storage for employee pay details and PDF generation.

---

## approval_assignment_templates

Single table for **both** `/hr/requests/approval-assignment` and `/hr/discipline/approval-assignment` (`HRApprovalAssignmentTemplate`). Documented **before** `request_types` because types reference templates.

Columns:
- id UUID PRIMARY KEY
- name_ar TEXT NOT NULL
- description TEXT NULL
- is_active BOOLEAN DEFAULT true
- stages JSONB NOT NULL -- `HRApprovalTemplateStage[]`
- assignment_link_kind TEXT NULL -- violation|request
- assignment_linked_ids TEXT[] NULL
- hr_request_assignment_linked_ids TEXT[] NULL
- violation_type_id UUID NULL -- deprecated (compat)
- module_scope TEXT NULL -- optional discriminator when splitting seeds: `hr_requests` | `hr_discipline` (SPA keeps two persisted stores today)
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: approval chain definitions; submissions store frozen `HRSubmissionApprovalSnapshot` in `request_submissions`.

---

## request_templates

Columns:
- id UUID PRIMARY KEY
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- slug TEXT NULL
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true
- form_fields JSONB NOT NULL -- `HRRequestFieldDefinition[]`
- is_universal_default BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: reusable field builders for `/hr/requests/general` (`HRRequestTemplateEntity`).

---

## request_types

Columns:
- id UUID PRIMARY KEY
- department_id UUID NULL REFERENCES departments(id) -- may use app-level sentinel for «all departments»
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- slug TEXT NOT NULL
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true
- request_category TEXT NULL -- leaves|attendance|advances
- approval_assignment_template_id UUID NULL REFERENCES approval_assignment_templates(id)
- approval_stages JSONB NULL -- optional embedded `HRApprovalStage[]`
- subtypes JSONB NULL -- optional `HRRequestSubtype[]` (equipment sub-types)

Purpose: `/hr/requests/request-types` and `[department]/[requestType]` routes.

---

## request_submissions

Columns:
- id UUID PRIMARY KEY
- created_at TIMESTAMPTZ DEFAULT now()
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- employee_name_en TEXT NULL -- bilingual cards (`HRRequestSubmissionRecord`)
- request_type_id UUID NOT NULL REFERENCES request_types(id)
- request_type_name_ar TEXT NULL
- request_type_name_en TEXT NULL
- department_id UUID NULL
- department_name_ar TEXT NULL
- department_name_en TEXT NULL
- template_id UUID NULL REFERENCES request_templates(id)
- field_values JSONB NOT NULL
- approval_snapshot JSONB NULL
- status TEXT NULL
- attachments JSONB NULL -- migrate to `attachments` table long-term

---

## attendance_correction_requests

`/hr/requests/attendance-corrections` (`AttendanceCorrectionRequest`).

Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- department_id UUID NULL REFERENCES departments(id)
- approver_id UUID NOT NULL REFERENCES employees(id)
- approver_name_ar TEXT NULL
- work_date DATE NOT NULL
- previous_check_in TEXT NULL -- store as TEXT if frontend keeps HH:mm without TZ
- previous_check_out TEXT NULL
- corrected_check_in TEXT NULL
- corrected_check_out TEXT NULL
- previous_status_ar TEXT NULL
- reason_ar TEXT NULL
- status TEXT NOT NULL -- pending|approved|rejected
- created_at TIMESTAMPTZ DEFAULT now()
- decided_at TIMESTAMPTZ NULL

---

## attendance: shift templates, assignments, events, summaries, checkpoints

### shift_templates
Columns:
- id UUID PRIMARY KEY
- name_ar TEXT
- name_en TEXT
- color_hex TEXT
- effective_from DATE NULL
- is_active BOOLEAN DEFAULT true
- week_days JSONB -- full `ShiftTemplate.weekDays` from frontend (nested periods + windows). **Source of truth for current UI.**

Implementation note: **`shift_periods` (below) is an optional normalized extract** — do not duplicate the same data in both JSONB and rows unless you enforce sync in app code.

### shift_periods
Columns:
- id UUID PRIMARY KEY
- template_id UUID NOT NULL REFERENCES shift_templates(id)
- start_time TIME
- end_time TIME
- break_enabled BOOLEAN DEFAULT false
- break_start TIME NULL
- break_end TIME NULL
- flexibility_enabled BOOLEAN DEFAULT false
- flexibility_minutes INTEGER NULL
- check_in_window JSONB NULL -- beforeStartMinutes, graceMinutes, afterStartMinutes
- check_out_window JSONB NULL -- beforeEndMinutes, allowedShortageMinutes, afterEndMinutes
- strict_mode BOOLEAN DEFAULT false
- check_out_not_required BOOLEAN DEFAULT false -- `ShiftPeriod.checkOutNotRequired`
- auto_overtime BOOLEAN DEFAULT false -- `ShiftPeriod.autoOvertime`
- strict_penalty_warning BOOLEAN DEFAULT false -- `ShiftPeriod.strictPenaltyWarning`
- strict_penalty_balance_enabled BOOLEAN DEFAULT false
- strict_penalty_balance_days NUMERIC(6,2) NULL
- strict_penalty_vacation_enabled BOOLEAN DEFAULT false

Implementation note: if you keep **`week_days` JSONB** as the sole source on `shift_templates`, it must embed the fields above inside each nested period (`ShiftPeriod` in `src/lib/attendance/types.ts`); **`shift_periods` rows duplicate them only when you normalize**.

### shift_assignments
Columns:
- id UUID PRIMARY KEY
- template_id UUID NOT NULL REFERENCES shift_templates(id)
- open_shift_hours INTEGER NULL
- target_type TEXT NOT NULL -- employee|department|location
- target_id UUID NOT NULL -- points to employees.id or departments.id etc
- target_label TEXT NULL -- snapshot label
- effective_from DATE NULL
- batch_id TEXT NULL

### attendance_events
Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- date DATE NOT NULL
- type TEXT NOT NULL -- check_in|check_out
- at TIMESTAMPTZ NOT NULL
- source TEXT NULL -- device|manual|gps
- geo_point_id UUID NULL REFERENCES check_in_points(id)
- notes TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()

### attendance_day_summaries
Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- date DATE NOT NULL
- template_id UUID NULL
- status TEXT NULL -- present|late|absent|early_leave|holiday|incomplete|overtime
- late_minutes INTEGER DEFAULT 0
- early_leave_minutes INTEGER DEFAULT 0
- overtime_minutes INTEGER DEFAULT 0
- worked_minutes INTEGER DEFAULT 0
- notes TEXT NULL

### check_in_points
Columns:
- id UUID PRIMARY KEY
- name_ar TEXT
- name_en TEXT
- latitude NUMERIC(10,6)
- longitude NUMERIC(10,6)
- radius_meters INTEGER
- is_active BOOLEAN DEFAULT true
- created_at TIMESTAMPTZ DEFAULT now()

### check_in_point_links
Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- check_in_point_id UUID NOT NULL REFERENCES check_in_points(id)
- batch_id TEXT NULL
- effective_from DATE NULL
- link_active BOOLEAN DEFAULT true

Purpose: attendance module supporting templates, per-employee assignments, event capture and daily summaries. Use indexes on (employee_id,date) and geospatial indices if needed.

---

## leaves

Unified leave UX (`/hr/requests/unified-management`, **`/hr/leaves/analytics`**, **`/hr/leaves/balance-credit`**) reads **`leave_requests`**, **`employee_leave_balances`**, and **`employee_workforce_extensions`** (home branch / postings) in addition to core org tables.

### leave_types
Columns:
- id UUID PRIMARY KEY
- code TEXT
- name_ar TEXT
- name_en TEXT NULL
- paid BOOLEAN DEFAULT true
- deducts_from_balance BOOLEAN DEFAULT false
- requires_approval BOOLEAN DEFAULT true
- max_days_per_request INTEGER NULL
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true
- updated_at TIMESTAMPTZ DEFAULT now()

### public_holidays
Columns:
- id UUID PRIMARY KEY
- code TEXT
- name_ar TEXT
- name_en TEXT NULL
- date TEXT -- MM-DD
- recurring BOOLEAN DEFAULT false
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true

### leave_requests (unified)
Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- type TEXT NOT NULL -- unified type e.g. annual,sick,maternity
- status TEXT -- pending|approved|rejected|cancelled
- start DATE
- end DATE
- request_branch_id UUID NULL
- working_days INTEGER
- note_ar TEXT NULL
- note_en TEXT NULL
- approval_chain JSONB NULL -- `LeaveApprovalStep[]` (`id`, `nameAr`, `roleAr`, `status`, `decidedAt`, …)
- created_at TIMESTAMPTZ DEFAULT now()

### leave_balance_credit_requests
Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- days_added INTEGER NOT NULL
- reason_ar TEXT
- status TEXT -- pending|approved|rejected
- created_at TIMESTAMPTZ DEFAULT now()
- decided_at TIMESTAMPTZ NULL

### employee_leave_balances

Matches persisted **`balances`** in `leave-balance-credit-store.ts` (`Record<employeeId, EmployeeLeaveBalanceRow>`). Needed for **`/hr/leaves/balance-credit`** beyond the approval queue (`leave_balance_credit_requests`).

Columns:
- employee_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE
- buckets JSONB NOT NULL
  -- shape mirrors `EmployeeLeaveBalanceRow`: `{ annual:{used,total}, sick:{used,cap semantics as total}, unpaid, maternity, emergency }`
  -- backend may flatten into typed columns instead of JSONB
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: authoritative per-type used/total caps that credit approvals mutate; unify with payroll/HRIS later if balances become ledger-based.

---

## discipline

### violation_types
Columns:
- id UUID PRIMARY KEY
- code TEXT
- name_ar TEXT
- name_en TEXT NULL
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true
- has_deduction BOOLEAN DEFAULT false
- deduction_kind TEXT NULL -- none|amount|hours|day
- deduction_value NUMERIC(12,2) NULL
- needs_warning BOOLEAN DEFAULT false
- needs_investigation BOOLEAN DEFAULT false
- needs_approval BOOLEAN DEFAULT false
- approval_template_id UUID NULL REFERENCES approval_assignment_templates(id)
- updated_at TIMESTAMPTZ DEFAULT now()

### violation_cases

Matches **`HRViolationCaseRecord`** (`src/lib/hr-discipline/types.ts`).

Columns:
- id UUID PRIMARY KEY
- case_number TEXT UNIQUE NOT NULL
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- employee_name_en TEXT NULL
- date DATE NULL
- description TEXT NULL
- notes TEXT NULL
- attachments_note TEXT NULL
- violation_type_id UUID NULL REFERENCES violation_types(id)
- type_code TEXT NULL
- type_name_ar TEXT NULL
- type_has_deduction BOOLEAN DEFAULT false
- type_deduction_kind TEXT NULL
- type_deduction_value NUMERIC(12,2) NULL
- type_needs_warning BOOLEAN DEFAULT false
- type_needs_investigation BOOLEAN DEFAULT false
- type_needs_approval BOOLEAN DEFAULT false
- approval_template_id UUID NULL REFERENCES approval_assignment_templates(id)
- status TEXT NULL
- required_approvers TEXT[] NULL -- enum labels: manager|hr|executive
- current_approval_index INTEGER DEFAULT 0
- approval_log JSONB NULL -- `{ role, action, note?, at }[]`
- posted_to_payroll BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

### discipline_notices

Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- kind TEXT -- verbal|first|second|final
- reason_ar TEXT NULL
- date DATE NULL
- linked_case_id UUID NULL REFERENCES violation_cases(id)
- attachments_note TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()

### discipline_circulars

Columns:
- id UUID PRIMARY KEY
- date DATE NULL
- title_ar TEXT NOT NULL
- body_ar TEXT NULL
- audience TEXT NOT NULL -- all|employees|branch|department
- target_employee_ids JSONB NULL
- branch_ids UUID[] NULL
- department_ids UUID[] NULL
- branch_names_ar_snapshot TEXT NULL
- department_names_ar_snapshot TEXT NULL
- audience_summary_ar TEXT NULL
- sent_at TIMESTAMPTZ NULL
- created_at TIMESTAMPTZ DEFAULT now()

### discipline_investigations

(`HRDisciplineInvestigationRecord`)

Columns:
- id UUID PRIMARY KEY
- case_id UUID NOT NULL REFERENCES violation_cases(id)
- case_number TEXT NULL
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- investigator_name TEXT NULL
- date DATE NULL
- employee_statement TEXT NULL
- witness_statement TEXT NULL
- result TEXT NULL -- upheld|cancelled|to_warning|to_deduction
- recommendation TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

### discipline_payroll_deductions

(`HRDisciplinePayrollDeductionRecord` — deductions **register** rows, distinct from salaries module).

Columns:
- id UUID PRIMARY KEY
- case_id UUID NULL REFERENCES violation_cases(id)
- case_number TEXT NULL
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- reason_ar TEXT NULL
- deduction_kind TEXT NULL
- amount NUMERIC(12,2) NOT NULL
- month TEXT NOT NULL -- YYYY-MM or label used in UI
- status TEXT NOT NULL -- ready|posted|calculated|cancelled
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

### discipline_penalties

(`HRDisciplinePenaltyRecord`; UI store `penalties-store`.)

Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- case_id UUID NOT NULL REFERENCES violation_cases(id)
- case_number TEXT NULL
- penalty_type TEXT NOT NULL -- reprimand|warning|monetary|suspension|termination_recommendation
- decision_date DATE NULL
- notes TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()

### discipline_appeals

(`HRDisciplineAppealRecord`)

Columns:
- id UUID PRIMARY KEY
- case_id UUID NOT NULL REFERENCES violation_cases(id)
- case_number TEXT NULL
- employee_id UUID NOT NULL REFERENCES employees(id)
- employee_name_ar TEXT NULL
- date DATE NULL
- channel TEXT NULL -- manager|hr|committee
- status TEXT NULL
- grounds TEXT NULL
- response_note TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

### discipline_audit_log_entries

Append-only discipline module audit (`HRDisciplineAuditLogEntry`; `/hr/discipline/audit-log`).

Columns:
- id UUID PRIMARY KEY
- occurred_at TIMESTAMPTZ NOT NULL
- actor_employee_id UUID NULL REFERENCES employees(id) -- nullable if only name captured
- actor_name_ar TEXT NULL
- category TEXT NOT NULL -- violation_case|investigation|appeal
- action_type TEXT NOT NULL -- create|update|delete|submit|approve|reject|request_edit|payroll_posted
- record_id TEXT NOT NULL -- polymorphic reference to underlying row id (string ids in SPA)
- record_ref_ar TEXT NULL
- record_status_after_ar TEXT NULL
- previous_snapshot_ar TEXT NULL
- current_snapshot_ar TEXT NULL

Purpose: disciplinary workflow, penalties register, appeal channel, deductions register, **and** module-level audit distinct from `employee_audit_log`.

---

## notifications

Columns:
- id UUID PRIMARY KEY
- title_ar TEXT NOT NULL
- body_ar TEXT NULL
- recipient_employee_id UUID NOT NULL REFERENCES employees(id)
- created_at TIMESTAMPTZ DEFAULT now()
- read_at TIMESTAMPTZ NULL
- dismissed_at TIMESTAMPTZ NULL

Purpose: user inbox and popup notifications.

---

## employee_audit_log

Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- action TEXT NOT NULL -- update/create/delete
- scope TEXT NULL -- e.g. personal, payroll
- field_key TEXT NULL
- label_ar TEXT NULL
- old_value TEXT NULL
- new_value TEXT NULL
- by_user_id UUID NULL -- correlates with `employees.id` when attributable; SPA also keeps `actorEmployeeId` client-only (`useEmployeeAuditActorStore`)
- at TIMESTAMPTZ DEFAULT now()

Purpose: shallow audit entries created by frontend diff logic (used by appendEmployeeAudit).

--- 

## allowance_types

Columns:
- id UUID PRIMARY KEY
- code TEXT NOT NULL
- name_ar TEXT NOT NULL
- name_en TEXT NULL
- typical_amount NUMERIC(12,2) NULL
- currency TEXT DEFAULT 'SAR'
- sort_order INTEGER DEFAULT 0
- is_active BOOLEAN DEFAULT true
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: canonical allowance type lookup used by contracts, compensation previews and payroll calculations. Matches `src/lib/contracts/allowance-types-store.ts`.

---

## attachments

Columns:
- id UUID PRIMARY KEY
- owner_table TEXT NOT NULL -- e.g. 'request_submissions','violation_cases'
- owner_id UUID NOT NULL
- filename TEXT NOT NULL
- url TEXT NOT NULL
- content_type TEXT NULL
- size INTEGER NULL
- uploaded_by UUID NULL REFERENCES employees(id)
- created_at TIMESTAMPTZ DEFAULT now()

Purpose: central storage for file metadata referenced by requests, cases, notices, payslips, etc.

---

## employee_rose_forms

Columns:
- id UUID PRIMARY KEY
- employee_id UUID NOT NULL REFERENCES employees(id)
- kind TEXT NOT NULL -- resignation|clearance|settlement|experience
- payload JSONB NOT NULL -- saved form values
- generated_pdf_url TEXT NULL
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()

Purpose: persist ROSE trading HR form submissions (used by employee rose forms UI; optional if forms remain client-only but recommended for audit and record-keeping).

---

## Authentication: users

`/login` is client-only demo auth today (`email`, `password` validated in form — no persisted session schema in-repo). Backend must introduce **users** linking sign-in principals to workforce rows where applicable.

Columns:
- id UUID PRIMARY KEY
- email TEXT NOT NULL UNIQUE
- password_hash TEXT NULL -- omit if SSO / external IdP only
- employee_id UUID NULL UNIQUE REFERENCES employees(id) -- nullable for service accounts / cross-tenant admins
- locale TEXT DEFAULT 'ar'
- created_at TIMESTAMPTZ DEFAULT now()
- last_login_at TIMESTAMPTZ NULL

Purpose: authoritative identity distinct from **`employees`** (HR profile row). Frontend role checks still map through `employees.assigned_role_id` ↔ **`roles`** until product defines app-level IAM.

Session transport (JWT, opaque session ids, **`user_sessions`** table, Redis, etc.) is **not modeled in-repo** beyond the **`/login`** stub.

---

Final notes & recommendations
- Use JSONB for flexible, UI-driven content: `request_templates.form_fields`, `request_submissions.field_values`, `approval_snapshot`, `payroll.employment_line_monthly_inputs` if needed.
- Enforce uniqueness where UI expects it: employee_code, contract_number, case_number.
- Add appropriate indexes for common queries: employees(employee_code), employees(national_id), attendance_events(employee_id, date), payroll_periods(period_start, period_end).
- Sensitive fields (national_id, bank_account, iban) should be stored securely and have access control at API layer.
- **`attachments`** (documented § above) replaces inline JSON on submissions long-term — wire FKs gradually.
- **Company display name:** payroll PDFs (`/hr/contracts/reports`) read `lib/data.company` (name Arabic/English). If you persist branding, use a **`tenant_company_profile`** singleton or settings row keyed by tenant — optional until exports move server-side.

