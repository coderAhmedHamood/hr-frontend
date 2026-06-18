import {
  resolvePermissionIds,
  resolvePermissionKeys,
  createRoleWithPermissions,
  updateRoleWithPermissions,
} from '@/features/hr/permissions/services/roles.service';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

jest.mock('@/features/hr/permissions/lib/api/roles', () => ({
  rolesApi: {
    create: jest.fn(),
    update: jest.fn(),
    getPermissions: jest.fn(),
    bulkAssignPermissions: jest.fn(),
    removePermission: jest.fn(),
  },
}));

import { rolesApi } from '@/features/hr/permissions/lib/api/roles';

const mockRolesApi = rolesApi as jest.Mocked<typeof rolesApi>;

function makePermission(
  id: string,
  resource: string,
  action: string,
  code?: string,
): PermissionResponseDto {
  return {
    id,
    applicationId: 'app-1',
    code: code ?? `hr.${resource}.${action}`,
    nameAr: id,
    nameEn: id,
    nodeType: 'ACTION',
    action,
    resource,
    parentId: null,
    sortOrder: 0,
    isSystem: false,
    status: 'active',
  };
}

const ALL_PERMISSIONS: PermissionResponseDto[] = [
  makePermission('p1', 'employees', 'read'),
  makePermission('p2', 'employees', 'create'),
  makePermission('p3', 'employees', 'update'),
  makePermission('p4', 'employees', 'delete'),
  makePermission('p5', 'payroll', 'read'),
  makePermission('p6', 'payroll', 'approve'),
  // A GROUP node — should be ignored
  { ...makePermission('g1', 'employees', null as unknown as string), nodeType: 'GROUP', action: null, resource: null },
];

describe('resolvePermissionIds', () => {
  it('maps frontend keys to backend permission IDs', () => {
    const ids = resolvePermissionIds(['employees.read', 'payroll.read'], ALL_PERMISSIONS);
    expect(ids).toEqual(expect.arrayContaining(['p1', 'p5']));
    expect(ids).toHaveLength(2);
  });

  it('ignores keys that have no matching backend permission', () => {
    const ids = resolvePermissionIds(['unknown.resource'], ALL_PERMISSIONS);
    expect(ids).toHaveLength(0);
  });

  it('returns all ACTION node IDs for "all"', () => {
    const ids = resolvePermissionIds(['all'], ALL_PERMISSIONS);
    // only ACTION nodes: p1..p6
    expect(ids).toEqual(expect.arrayContaining(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']));
    expect(ids).not.toContain('g1');
  });

  it('returns empty array for empty keys', () => {
    expect(resolvePermissionIds([], ALL_PERMISSIONS)).toHaveLength(0);
  });

  it('falls back to code suffix matching when resource/action are null', () => {
    const p: PermissionResponseDto = {
      id: 'px',
      applicationId: 'app-1',
      code: 'hr.attendance.approve',
      nameAr: 'px',
      nameEn: 'px',
      nodeType: 'ACTION',
      action: null,
      resource: null,
      parentId: null,
      sortOrder: 0,
      isSystem: false,
      status: 'active',
    };
    const ids = resolvePermissionIds(['attendance.approve'], [p]);
    expect(ids).toContain('px');
  });
});

describe('resolvePermissionKeys', () => {
  it('maps permission IDs back to frontend resource.action keys', () => {
    const keys = resolvePermissionKeys(['p1', 'p5'], ALL_PERMISSIONS);
    expect(keys).toContain('employees.read');
    expect(keys).toContain('payroll.read');
  });

  it('ignores IDs not found in the permissions list', () => {
    const keys = resolvePermissionKeys(['unknown-id'], ALL_PERMISSIONS);
    expect(keys).toHaveLength(0);
  });

  it('returns empty array for empty IDs', () => {
    expect(resolvePermissionKeys([], ALL_PERMISSIONS)).toHaveLength(0);
  });
});

describe('createRoleWithPermissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates role then bulk-assigns permissions via POST /roles/{id}/permissions/bulk', async () => {
    mockRolesApi.create.mockResolvedValue({
      id: 'role-new',
      nameAr: 'مشرف',
      nameEn: '',
      code: 'role_abc',
      description: null,
      isSystem: false,
      isDefault: false,
      status: 'active',
      companyId: 'company-1',
      applicationId: 'app-1',
      createdAt: '',
      updatedAt: '',
    });
    mockRolesApi.bulkAssignPermissions.mockResolvedValue(undefined);

    await createRoleWithPermissions({
      name: 'مشرف',
      description: 'وصف',
      permissionIds: ['p1', 'p2'],
      companyId: 'company-1',
      applicationId: 'app-1',
    });

    expect(mockRolesApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nameAr: 'مشرف',
        companyId: 'company-1',
        applicationId: 'app-1',
      }),
    );
    expect(mockRolesApi.bulkAssignPermissions).toHaveBeenCalledWith('role-new', ['p1', 'p2'], undefined);
  });

  it('skips bulk assign when no permissions selected', async () => {
    mockRolesApi.create.mockResolvedValue({
      id: 'role-empty',
      nameAr: 'فارغ',
      nameEn: '',
      code: 'role_xyz',
      description: null,
      isSystem: false,
      isDefault: false,
      status: 'active',
      companyId: 'company-1',
      applicationId: 'app-1',
      createdAt: '',
      updatedAt: '',
    });

    await createRoleWithPermissions({
      name: 'فارغ',
      description: '',
      permissionIds: [],
      companyId: 'company-1',
      applicationId: 'app-1',
    });

    expect(mockRolesApi.bulkAssignPermissions).not.toHaveBeenCalled();
  });
});

describe('updateRoleWithPermissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('adds new permissions via bulk and removes detached ones', async () => {
    mockRolesApi.update.mockResolvedValue({
      id: 'role-1',
      nameAr: 'محدّث',
      nameEn: '',
      code: 'role_1',
      description: 'وصف',
      isSystem: false,
      isDefault: false,
      status: 'active',
      companyId: 'company-1',
      applicationId: 'app-1',
      createdAt: '',
      updatedAt: '',
    });
    mockRolesApi.getPermissions.mockResolvedValue({
      items: [
        { id: 'link-1', roleId: 'role-1', permissionId: 'p1' },
        { id: 'link-2', roleId: 'role-1', permissionId: 'p2' },
      ],
      pagination: { page: 1, limit: 500, total: 2, totalPages: 1 },
    });
    mockRolesApi.bulkAssignPermissions.mockResolvedValue(undefined);
    mockRolesApi.removePermission.mockResolvedValue(undefined);

    await updateRoleWithPermissions('role-1', {
      name: 'محدّث',
      description: 'وصف',
      permissionIds: ['p2', 'p3'],
    });

    expect(mockRolesApi.removePermission).toHaveBeenCalledWith('link-1');
    expect(mockRolesApi.bulkAssignPermissions).toHaveBeenCalledWith('role-1', ['p3'], undefined);
  });
});
