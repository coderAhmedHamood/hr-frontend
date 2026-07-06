import { useMemo } from 'react';
import { useCan } from '@/features/auth/hooks/use-can';
import { usePageAccess } from '@/features/auth/permissions/use-page-access';
import type { PagePermissionDefs, PagePermissions } from '@/features/auth/permissions/types';

/**
 * Resolves boolean flags from a page's permission definitions.
 * Import codes from the feature's local `permissions.ts` file.
 *
 * `canRead` gates the page itself, so it uses `usePageAccess` (company-wide /
 * any-branch, ignores `activeBranchId`) — a user must not get locked out of a
 * page just because the topbar branch switched. The action flags
 * (create/update/delete/...) stay branch-scoped via `useCan()` since they
 * apply to records in the currently active branch.
 */
export function usePagePermissions(defs: PagePermissionDefs): PagePermissions {
  const can = useCan();
  const canReadPage = usePageAccess(defs.read);

  return useMemo(
    () => ({
      codes: defs,
      canRead: canReadPage,
      canCreate: defs.create != null && can(defs.create),
      canUpdate: defs.update != null && can(defs.update),
      canDelete: defs.delete != null && can(defs.delete),
      canApprove: defs.approve != null && can(defs.approve),
      canExport: defs.export != null && can(defs.export),
    }),
    [
      can,
      canReadPage,
      defs,
      defs.create,
      defs.update,
      defs.delete,
      defs.approve,
      defs.export,
    ],
  );
}
