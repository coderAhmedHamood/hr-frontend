import {
  hasPermission,
  countGrantedPermissions,
  expandAllPermissionKeys,
} from '@/features/system/permissions/utils/permission-matrix';
import { PERMISSION_MATRIX_TOTAL } from '@/features/system/permissions/constants/permission-matrix';

describe('hasPermission', () => {
  it('returns true for exact resource.action match', () => {
    expect(hasPermission(['employees.read', 'payroll.create'], 'employees', 'read')).toBe(true);
  });

  it('returns false when permission not present', () => {
    expect(hasPermission(['employees.read'], 'employees', 'delete')).toBe(false);
  });

  it('returns true when "all" is in the list', () => {
    expect(hasPermission(['all'], 'employees', 'delete')).toBe(true);
  });

  it('returns true when wildcard resource.* is present', () => {
    expect(hasPermission(['employees.*'], 'employees', 'approve')).toBe(true);
  });

  it('returns false for empty list', () => {
    expect(hasPermission([], 'employees', 'read')).toBe(false);
  });
});

describe('countGrantedPermissions', () => {
  it('returns PERMISSION_MATRIX_TOTAL for ["all"]', () => {
    expect(countGrantedPermissions(['all'])).toBe(PERMISSION_MATRIX_TOTAL);
  });

  it('returns 0 for empty list', () => {
    expect(countGrantedPermissions([])).toBe(0);
  });

  it('counts correctly for specific permissions', () => {
    // employees.read + employees.create = 2
    expect(countGrantedPermissions(['employees.read', 'employees.create'])).toBe(2);
  });

  it('does not double-count duplicates', () => {
    expect(countGrantedPermissions(['employees.read', 'employees.read'])).toBe(1);
  });

  it('counts across multiple resources', () => {
    const perms = ['employees.read', 'payroll.read', 'payroll.create'];
    expect(countGrantedPermissions(perms)).toBe(3);
  });
});

describe('expandAllPermissionKeys', () => {
  it('returns an array of length PERMISSION_MATRIX_TOTAL', () => {
    expect(expandAllPermissionKeys()).toHaveLength(PERMISSION_MATRIX_TOTAL);
  });

  it('returns unique entries only', () => {
    const keys = expandAllPermissionKeys();
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('each key matches resource.action format', () => {
    expandAllPermissionKeys().forEach((k) => {
      expect(k).toMatch(/^\w+\.\w+$/);
    });
  });

  it('does not include "all"', () => {
    expect(expandAllPermissionKeys()).not.toContain('all');
  });
});
