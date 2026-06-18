import { buildPermissionMatrix } from '@/features/hr/permissions/utils/build-permission-matrix';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';

function makeNode(
  partial: Partial<PermissionResponseDto> & Pick<PermissionResponseDto, 'id' | 'code' | 'nodeType'>,
): PermissionResponseDto {
  return {
    applicationId: 'app-1',
    nameAr: partial.nameAr ?? partial.id,
    nameEn: null,
    action: null,
    resource: null,
    parentId: null,
    sortOrder: 0,
    isSystem: true,
    status: 'active',
    ...partial,
  };
}

describe('buildPermissionMatrix', () => {
  it('builds rows from ACTION nodes and labels from parent GROUP', () => {
    const items: PermissionResponseDto[] = [
      makeNode({
        id: 'g-module',
        code: 'hr.module',
        nodeType: 'GROUP',
        nameAr: 'نظام الموارد البشرية',
      }),
      makeNode({
        id: 'g-assignments',
        code: 'hr.employees.assignments',
        nodeType: 'GROUP',
        nameAr: 'تعيينات الموظف',
        parentId: 'g-module',
        sortOrder: 2,
      }),
      makeNode({
        id: 'a-read',
        code: 'hr.employees.assignments.read',
        nodeType: 'ACTION',
        nameAr: 'عرض التعيينات',
        action: 'read',
        resource: 'employee-assignments',
        parentId: 'g-assignments',
        sortOrder: 1,
      }),
      makeNode({
        id: 'a-create',
        code: 'hr.employees.assignments.create',
        nodeType: 'ACTION',
        nameAr: 'إنشاء تعيين',
        action: 'create',
        resource: 'employee-assignments',
        parentId: 'g-assignments',
        sortOrder: 2,
      }),
    ];

    const { resources, actionIds, matrix, resourceLabels } = buildPermissionMatrix(items);

    expect(resources).toEqual(['employee-assignments']);
    expect(actionIds).toEqual(['read', 'create']);
    expect(matrix['employee-assignments']).toEqual({ read: 'a-read', create: 'a-create' });
    expect(resourceLabels['employee-assignments']).toBe('تعيينات الموظف');
  });

  it('orders resources by action sortOrder', () => {
    const items: PermissionResponseDto[] = [
      makeNode({
        id: 'b-read',
        code: 'hr.branches.read',
        nodeType: 'ACTION',
        action: 'read',
        resource: 'branches',
        sortOrder: 5,
      }),
      makeNode({
        id: 'e-read',
        code: 'hr.employees.read',
        nodeType: 'ACTION',
        action: 'read',
        resource: 'employees',
        sortOrder: 1,
      }),
    ];

    const { resources } = buildPermissionMatrix(items);
    expect(resources).toEqual(['employees', 'branches']);
  });
});
