import { useMemo } from 'react';
import { useCan } from '@/features/auth/hooks/use-can';
import type { PagePermissionDefs, PagePermissions } from '@/features/auth/permissions/types';

/**
 * Resolves boolean flags from a page's permission definitions.
 * Import codes from the feature's local `permissions.ts` file.
 */
export function usePagePermissions(defs: PagePermissionDefs): PagePermissions {
  const can = useCan();

  return useMemo(
    () => ({
      codes: defs,
      canRead: can(defs.read),
      canCreate: defs.create != null && can(defs.create),
      canUpdate: defs.update != null && can(defs.update),
      canDelete: defs.delete != null && can(defs.delete),
      canApprove: defs.approve != null && can(defs.approve),
      canExport: defs.export != null && can(defs.export),
    }),
    [
      can,
      defs,
      defs.read,
      defs.create,
      defs.update,
      defs.delete,
      defs.approve,
      defs.export,
    ],
  );
}
