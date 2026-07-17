/**
 * Mobile employee app (`hr-app-new`) permission mapping.
 * Matches API `resource` + `action` fields from GET /permissions.
 *
 * Keep in sync with Dio calls under `hr-app-new/lib` (auth, profile,
 * attendance, leaves, requests, payroll, notifications, discipline).
 */

/** Explicit overrides (e.g. codes without resource on GROUP nodes). */
export const MOBILE_PERMISSION_CODES = new Set<string>([
  'hr.employees.read',
  'hr.employees.update',
  'hr.employees.profile.read',
  'hr.employees.profile.update',
  /** Change password via PATCH /users/:id */
  'system.users.update',
]);

/**
 * Employee self-service: which actions on each API `resource` the mobile app uses.
 * Admin-only actions (create/delete/export/approve on config modules) are excluded.
 */
const MOBILE_EMPLOYEE_RESOURCE_ACTIONS: Readonly<Record<string, readonly string[]>> = {
  users: ['update'],
  employees: ['read', 'update'],
  'employee-profile': ['read', 'update'],
  'attendance-events': ['read', 'create'],
  'shift-assignments': ['read'],
  'shift-templates': ['read'],
  'check-in-points': ['read'],
  'check-in-point-links': ['read'],
  'attendance-day-summaries': ['read'],
  'leave-requests': ['read', 'create', 'update'],
  'attendance-correction-requests': ['read', 'create', 'update'],
  'overtime-requests': ['read', 'create'],
  'employee-advances': ['read', 'create', 'update'],
  'request-types': ['read'],
  notifications: ['read', 'update'],
  'discipline-notices': ['read'],
  'discipline-circulars': ['read'],
  'discipline-appeals': ['read'],
  'discipline-investigations': ['read'],
  'violation-records': ['read'],
  'public-holidays': ['read'],
  'leave-types': ['read'],
  'balance-credit-requests': ['read', 'create'],
  'employee-leave-balances': ['read'],
  'payroll-periods': ['read'],
  'monthly-inputs': ['read'],
  'allowance-types': ['read'],
  /** View payslips + employee accept/reject (`POST .../employee-decision`) */
  payslips: ['read', 'approve'],
  /** View contracts + employee sign/reject (`POST .../employee-decision`) */
  'employee-contracts': ['read', 'approve'],
};

export function isMobilePermission(
  code: string,
  resource?: string | null,
  action?: string | null,
): boolean {
  if (MOBILE_PERMISSION_CODES.has(code)) return true;
  if (!resource || !action) return false;
  const allowed = MOBILE_EMPLOYEE_RESOURCE_ACTIONS[resource];
  return allowed?.includes(action) ?? false;
}
