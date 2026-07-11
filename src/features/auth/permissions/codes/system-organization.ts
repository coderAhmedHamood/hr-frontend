/**
 * Organization permission codes — mirrored from the backend RBAC catalog
 * (`system-organization-permissions.definition.ts`).
 *
 * Best practice:
 * - Codes are static strings that must match backend `@RequirePermissions(...)`.
 * - Whether the signed-in user holds a code is resolved dynamically from
 *   `accessProfile` at login (`usePageAccess` / `useCan`).
 * - Import from here instead of duplicating strings across features.
 */
export const SYSTEM_ORGANIZATION_PERMISSIONS = {
  companies: {
    read: 'system.organization.companies.read',
    create: 'system.organization.companies.create',
    update: 'system.organization.companies.update',
    delete: 'system.organization.companies.delete',
  },
  branches: {
    read: 'system.organization.branches.read',
    create: 'system.organization.branches.create',
    update: 'system.organization.branches.update',
    delete: 'system.organization.branches.delete',
  },
  departments: {
    read: 'system.organization.departments.read',
    create: 'system.organization.departments.create',
    update: 'system.organization.departments.update',
    delete: 'system.organization.departments.delete',
  },
  jobTitles: {
    read: 'system.organization.job-titles.read',
    create: 'system.organization.job-titles.create',
    update: 'system.organization.job-titles.update',
    delete: 'system.organization.job-titles.delete',
  },
} as const;
