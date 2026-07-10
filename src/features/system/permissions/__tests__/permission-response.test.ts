import {
  normalizeApplicationsList,
  normalizePermissionsList,
  toPaginatedPermissions,
} from '@/features/system/permissions/lib/api/permission-response';

const groupedPermissionsResponse = {
  applications: [
    {
      id: 'app-accounting',
      code: 'accounting',
      nameAr: 'المحاسبة',
      nameEn: 'Accounting',
      sortOrder: 20,
      items: [
        {
          id: 'g1',
          applicationId: 'app-accounting',
          parentId: null,
          code: 'acct.module',
          nameAr: 'نظام المحاسبة',
          nameEn: 'Accounting module',
          nodeType: 'GROUP' as const,
          action: null,
          resource: null,
          sortOrder: 0,
          isSystem: true,
          status: 'active',
        },
        {
          id: 'a1',
          applicationId: 'app-accounting',
          parentId: 'g1',
          code: 'acct.invoices.read',
          nameAr: 'عرض الفواتير',
          nameEn: 'View invoices',
          nodeType: 'ACTION' as const,
          action: 'read',
          resource: 'invoices',
          sortOrder: 1,
          isSystem: true,
          status: 'active',
        },
      ],
    },
  ],
};

describe('permission-response normalizers', () => {
  it('extracts permission items from grouped applications payload', () => {
    const items = normalizePermissionsList(groupedPermissionsResponse, 'app-accounting');
    expect(items).toHaveLength(2);
    expect(items[1]?.code).toBe('acct.invoices.read');
  });

  it('builds paginated permissions from grouped payload', () => {
    const result = toPaginatedPermissions(groupedPermissionsResponse, 'app-accounting');
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  it('normalizes applications list from grouped payload', () => {
    const apps = normalizeApplicationsList(groupedPermissionsResponse);
    expect(apps).toHaveLength(1);
    expect(apps[0]?.code).toBe('accounting');
    expect(apps[0]?.items).toHaveLength(2);
  });
});
