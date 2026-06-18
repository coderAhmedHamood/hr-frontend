import type { PermissionRoleColorToken } from '@/features/hr/permissions/constants/role-colors';

export type PermissionRole = {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: string[];
  color: PermissionRoleColorToken;
};

/** Alias for PermissionRole (legacy name). */
export type Role = PermissionRole;

export interface Permission {
  id: string;
  name: string;
  resource: string;
  actions: ('read' | 'create' | 'update' | 'delete' | 'approve')[];
}
