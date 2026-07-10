import { loadAllPermissions } from '@/features/system/permissions/services/permissions.service';
import { permissionsApi } from '@/features/system/permissions/lib/api/permissions';
import { normalizePermissionsList } from '@/features/system/permissions/lib/api/permission-response';

jest.mock('@/features/system/permissions/lib/api/permissions', () => ({
  permissionsApi: {
    getAll: jest.fn(),
  },
}));

const getAll = permissionsApi.getAll as jest.Mock;

function page(items: { id: string }[], page: number, totalPages: number) {
  return {
    items,
    pagination: { page, limit: 200, total: items.length * totalPages, totalPages },
  };
}

describe('loadAllPermissions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches every page until totalPages is exhausted', async () => {
    getAll
      .mockResolvedValueOnce(page([{ id: 'p1' }], 1, 2))
      .mockResolvedValueOnce(page([{ id: 'p2' }], 2, 2));

    const result = await loadAllPermissions();

    expect(getAll).toHaveBeenCalledTimes(2);
    expect(getAll).toHaveBeenNthCalledWith(1, { page: 1, limit: 200 });
    expect(getAll).toHaveBeenNthCalledWith(2, { page: 2, limit: 200 });
    expect(result.items.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('uses a single request when the catalog fits in one page', async () => {
    getAll.mockResolvedValueOnce(page([{ id: 'p1' }, { id: 'p2' }], 1, 1));

    const result = await loadAllPermissions();

    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith({ page: 1, limit: 200 });
    expect(result.items).toHaveLength(2);
  });

  it('parses grouped applications payload', async () => {
    getAll.mockResolvedValueOnce({
      applications: [
        {
          id: 'app-1',
          code: 'hr',
          nameAr: 'HR',
          items: [{ id: 'p1' }, { id: 'p2' }],
        },
      ],
    });

    const result = await loadAllPermissions();

    expect(result.items.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});

describe('loadPermissionsByApplication', () => {
  beforeEach(() => jest.clearAllMocks());

  it('extracts items from grouped applications response', async () => {
    const { loadPermissionsByApplication } = await import(
      '@/features/system/permissions/services/permissions.service'
    );

    getAll.mockResolvedValueOnce({
      applications: [
        {
          id: 'app-accounting',
          code: 'accounting',
          nameAr: 'المحاسبة',
          items: [{ id: 'perm-1' }, { id: 'perm-2' }],
        },
      ],
    });

    const result = await loadPermissionsByApplication('app-accounting');

    expect(getAll).toHaveBeenCalledWith({
      page: 1,
      limit: 200,
      applicationId: 'app-accounting',
    });
    expect(result.items.map((p) => p.id)).toEqual(['perm-1', 'perm-2']);
  });
});
