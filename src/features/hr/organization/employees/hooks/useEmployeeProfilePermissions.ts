'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoles } from '@/features/hr/permissions/hooks/useRoles';
import { usePermissions } from '@/features/hr/permissions/hooks/usePermissions';
import { rolesApi } from '@/features/hr/permissions/lib/api/roles';
import { userRolesApi } from '@/features/hr/permissions/lib/api/user-roles';
import { userPermissionsApi, type UserPermissionEffect } from '@/features/hr/permissions/lib/api/user-permissions';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveEmployeeCompanyId } from '@/features/hr/organization/employees/services/employee-company.service';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';
import type { Employee } from '@/features/hr/organization/employees/types';

export type PermissionOverlay = {
  overlayId: string;
  permissionId: string;
  effect: UserPermissionEffect;
  reason: string | null;
};

export function useEmployeeProfilePermissions(employee: Employee, enabled = true) {
  const qc = useQueryClient();
  const userId = employee.userId ?? null;
  const hasLinkedUser = employee.hasUser ?? !!userId;

  // ── All roles & permissions from system ──────────────────────────────────
  const { data: rolesResult } = useRoles(enabled);
  const { data: permissionsResult } = usePermissions(undefined, enabled);
  const allRoles = rolesResult?.items ?? [];
  const allPermissions: PermissionResponseDto[] = permissionsResult?.items ?? [];

  // ── Current user role assignments ────────────────────────────────────────
  const { data: userRolesResult, isLoading: rolesAssignLoading } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => userRolesApi.list(userId!),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000,
  });
  const userRoleAssignments = userRolesResult?.items ?? [];
  // Take the first active assignment as the current role
  const activeAssignment = userRoleAssignments.find((a) => a.isActive) ?? userRoleAssignments[0] ?? null;

  // ── Draft: which role the admin is about to save ─────────────────────────
  const [roleDraft, setRoleDraft] = React.useState<string>('');
  React.useEffect(() => {
    setRoleDraft(activeAssignment?.roleId ?? '');
  }, [activeAssignment?.roleId]);

  const selectedRole = allRoles.find((r) => r.id === roleDraft) ?? null;
  const roleDirty = roleDraft !== (activeAssignment?.roleId ?? '');

  // ── Permissions granted by the selected role ─────────────────────────────
  const { data: rolePermsResult } = useQuery({
    queryKey: ['role-permissions', roleDraft],
    queryFn: () => rolesApi.getPermissions(roleDraft),
    enabled: enabled && !!roleDraft,
    staleTime: 5 * 60 * 1000,
  });
  const rolePermissionIds = React.useMemo(
    () => new Set((rolePermsResult?.items ?? []).map((rp) => rp.permissionId)),
    [rolePermsResult],
  );
  const rolePermissions = React.useMemo(
    () => allPermissions.filter((p) => rolePermissionIds.has(p.id) && p.nodeType === 'ACTION'),
    [allPermissions, rolePermissionIds],
  );

  // ── Per-user permission overlays ─────────────────────────────────────────
  const { data: overlaysResult } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => userPermissionsApi.list(userId!),
    enabled: enabled && !!userId,
    staleTime: 2 * 60 * 1000,
  });
  const overlays: PermissionOverlay[] = React.useMemo(
    () =>
      (overlaysResult?.items ?? [])
        .filter((o) => o.isActive)
        .map((o) => ({
          overlayId: o.id,
          permissionId: o.permissionId,
          effect: o.effect,
          reason: o.reason,
        })),
    [overlaysResult],
  );
  const overlayMap = React.useMemo(
    () => new Map(overlays.map((o) => [o.permissionId, o])),
    [overlays],
  );

  // Extra ALLOW permissions not coming from the role
  const extraAllowPermissions = React.useMemo(
    () =>
      overlays
        .filter((o) => o.effect === 'ALLOW' && !rolePermissionIds.has(o.permissionId))
        .map((o) => allPermissions.find((p) => p.id === o.permissionId))
        .filter(Boolean) as PermissionResponseDto[],
    [overlays, rolePermissionIds, allPermissions],
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const assignRoleMutation = useMutation({
    mutationFn: async (newRoleId: string) => {
      if (!userId) throw new Error('هذا الموظف غير مرتبط بحساب مستخدم');
      // Revoke existing assignment first
      if (activeAssignment) {
        await userRolesApi.revoke(activeAssignment.id);
      }
      if (newRoleId) {
        return userRolesApi.assign(userId, { roleId: newRoleId, isActive: true });
      }
    },
    onSuccess: () => {
      toast.success('تم حفظ دور الموظف');
      void qc.invalidateQueries({ queryKey: ['user-roles', userId] });
    },
    onError: (err) => handleApiError(err, 'userRole.assign'),
  });

  const addOverlayMutation = useMutation({
    mutationFn: async (args: { permissionId: string; effect: UserPermissionEffect; reason?: string }) => {
      if (!userId) throw new Error('هذا الموظف غير مرتبط بحساب مستخدم');
      const companyId = await resolveEmployeeCompanyId(employee.id);
      return userPermissionsApi.assign(userId, {
        permissionId: args.permissionId,
        companyId,
        effect: args.effect,
        reason: args.reason ?? null,
      });
    },
    onSuccess: (_, args) => {
      const label = args.effect === 'DENY' ? 'تم حجب الصلاحية' : 'تم منح الصلاحية';
      toast.success(label);
      void qc.invalidateQueries({ queryKey: ['user-permissions', userId] });
    },
    onError: (err) => {
      const { displayMessage } = handleApiError(err, 'userPermission.assign');
      toast.error(displayMessage);
    },
  });

  const removeOverlayMutation = useMutation({
    mutationFn: (overlayId: string) => userPermissionsApi.remove(overlayId),
    onSuccess: () => {
      toast.success('تمت إزالة التخصيص');
      void qc.invalidateQueries({ queryKey: ['user-permissions', userId] });
    },
    onError: (err) => handleApiError(err, 'userPermission.remove'),
  });

  const handleSaveRole = React.useCallback(() => {
    if (!userId) {
      toast.error('هذا الموظف غير مرتبط بحساب مستخدم في النظام');
      return;
    }
    assignRoleMutation.mutate(roleDraft);
  }, [userId, roleDraft, assignRoleMutation]);

  const handleToggleDeny = React.useCallback(
    (permissionId: string) => {
      const existing = overlayMap.get(permissionId);
      if (existing?.effect === 'DENY') {
        // Remove DENY → restore inherited access
        removeOverlayMutation.mutate(existing.overlayId);
      } else if (existing?.effect === 'ALLOW') {
        // Flip ALLOW → DENY
        removeOverlayMutation.mutate(existing.overlayId);
        addOverlayMutation.mutate({ permissionId, effect: 'DENY' });
      } else {
        // No overlay → add DENY
        addOverlayMutation.mutate({ permissionId, effect: 'DENY' });
      }
    },
    [overlayMap, addOverlayMutation, removeOverlayMutation],
  );

  const handleGrantExtra = React.useCallback(
    (permissionId: string) => {
      const existing = overlayMap.get(permissionId);
      if (existing) return; // already has overlay
      addOverlayMutation.mutate({ permissionId, effect: 'ALLOW' });
    },
    [overlayMap, addOverlayMutation],
  );

  const handleRemoveOverlay = React.useCallback(
    (overlayId: string) => {
      removeOverlayMutation.mutate(overlayId);
    },
    [removeOverlayMutation],
  );

  // ── Create linked user account ─────────────────────────────────────────────
  // Handled via useEmployeeCreateUser + EmployeeCreateUserDialog (personal section)

  return {
    // role assignment
    allRoles,
    roleDraft,
    setRoleDraft,
    selectedRole,
    roleDirty,
    rolesAssignLoading,
    isSavingRole: assignRoleMutation.isPending,
    handleSaveRole,
    // role permissions (what the role grants)
    rolePermissions,
    // overlays
    overlays,
    overlayMap,
    extraAllowPermissions,
    // extra browseable permissions (all ACTION nodes not in role)
    allActionPermissions: allPermissions.filter((p) => p.nodeType === 'ACTION'),
    // handlers
    handleToggleDeny,
    handleGrantExtra,
    handleRemoveOverlay,
    isMutating: addOverlayMutation.isPending || removeOverlayMutation.isPending,
    hasLinkedUser,
  };
}

export type EmployeePermissionsModel = ReturnType<typeof useEmployeeProfilePermissions>;
