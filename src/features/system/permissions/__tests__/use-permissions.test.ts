import {
  resolveHrApplicationId,
  scopeToHrApplication,
} from '@/features/system/permissions/hooks/usePermissions';
import type { PermissionResponseDto } from '@/features/system/permissions/lib/api/permissions';

function makePerm(
  id: string,
  code: string,
  applicationId: string,
): PermissionResponseDto {
  return {
    id,
    applicationId,
    code,
    nameAr: id,
    nameEn: id,
    nodeType: 'ACTION',
    action: 'read',
    resource: 'employees',
    parentId: null,
    sortOrder: 0,
    isSystem: true,
    status: 'active',
  };
}

function makeGroup(id: string, code: string, applicationId: string): PermissionResponseDto {
  return {
    ...makePerm(id, code, applicationId),
    nodeType: 'GROUP',
    action: null,
    resource: null,
  };
}

describe('resolveHrApplicationId', () => {
  const hrAppId = '4002cca8-64fe-428c-9946-c42676dfc0a2';
  const wrongAppId = '00000000-0000-4000-8000-000000000001';

  it('prefers hr.module applicationId over a mismatched hint', () => {
    const all = [
      makeGroup('root', 'hr.module', hrAppId),
      makePerm('p1', 'hr.employees.read', hrAppId),
    ];

    expect(resolveHrApplicationId(all, wrongAppId)).toBe(hrAppId);
  });
});

describe('scopeToHrApplication', () => {
  const hrAppId = '4002cca8-64fe-428c-9946-c42676dfc0a2';
  const wrongAppId = '00000000-0000-4000-8000-000000000001';

  it('returns all nodes for hr.module application even when hint does not match', () => {
    const all = [
      makeGroup('root', 'hr.module', hrAppId),
      makePerm('p1', 'hr.employees.read', hrAppId),
      makePerm('p2', 'other.app.read', wrongAppId),
    ];

    const { items, resolvedApplicationId } = scopeToHrApplication(all, wrongAppId);

    expect(items).toHaveLength(2);
    expect(items.map((p) => p.id).sort()).toEqual(['p1', 'root']);
    expect(resolvedApplicationId).toBe(hrAppId);
  });

  it('includes GROUP and ACTION nodes for the HR application', () => {
    const all = [
      makeGroup('root', 'hr.module', hrAppId),
      makePerm('p1', 'hr.employees.read', hrAppId),
      makePerm('p2', 'hr.companies.read', hrAppId),
    ];

    const { items } = scopeToHrApplication(all, hrAppId);
    expect(items).toHaveLength(3);
  });
});
