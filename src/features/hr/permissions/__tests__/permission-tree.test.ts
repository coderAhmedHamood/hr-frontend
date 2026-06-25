import {
  buildPermissionTree,
  collectResourceBlocks,
  filterPermissionTree,
} from '@/features/hr/permissions/utils/permission-tree';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

const sample: PermissionResponseDto[] = [
  {
    id: 'g1',
    applicationId: 'app',
    code: 'hr.module',
    nameAr: 'الموارد البشرية',
    nameEn: null,
    nodeType: 'GROUP',
    action: null,
    resource: null,
    parentId: null,
    sortOrder: 0,
    isSystem: true,
    status: 'active',
  },
  {
    id: 'g2',
    applicationId: 'app',
    code: 'hr.employees',
    nameAr: 'الموظفون',
    nameEn: null,
    nodeType: 'GROUP',
    action: null,
    resource: 'employees',
    parentId: 'g1',
    sortOrder: 0,
    isSystem: true,
    status: 'active',
  },
  {
    id: 'a1',
    applicationId: 'app',
    code: 'hr.employees.read',
    nameAr: 'عرض الموظفين',
    nameEn: null,
    nodeType: 'ACTION',
    action: 'read',
    resource: 'employees',
    parentId: 'g2',
    sortOrder: 0,
    isSystem: true,
    status: 'active',
  },
];

describe('permission-tree catalog helpers', () => {
  it('collectResourceBlocks groups actions under their parent resource', () => {
    const tree = buildPermissionTree(sample);
    const blocks = collectResourceBlocks(tree[0]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toBe('الموظفون');
    expect(blocks[0].actions).toHaveLength(1);
  });

  it('filterPermissionTree matches Arabic action labels', () => {
    const tree = buildPermissionTree(sample);
    const filtered = filterPermissionTree(tree, 'عرض');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('g1');
  });
});
