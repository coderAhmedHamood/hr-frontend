import { loadAllPermissions } from '@/features/hr/permissions/services/permissions.service';
import { permissionsApi } from '@/features/hr/permissions/lib/api/permissions';

jest.mock('@/features/hr/permissions/lib/api/permissions', () => ({
  permissionsApi: {
    getAll: jest.fn(),
  },
}));

const getAll = permissionsApi.getAll as jest.Mock;

function page(items: { id: string }[], page: number, totalPages: number) {
  return {
    items,
    pagination: { page, limit: 500, total: items.length * totalPages, totalPages },
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
    expect(getAll).toHaveBeenNthCalledWith(1, { page: 1, limit: 500 });
    expect(getAll).toHaveBeenNthCalledWith(2, { page: 2, limit: 500 });
    expect(result.items.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  it('uses a single request when the catalog fits in one page', async () => {
    getAll.mockResolvedValueOnce(page([{ id: 'p1' }, { id: 'p2' }], 1, 1));

    const result = await loadAllPermissions();

    expect(getAll).toHaveBeenCalledTimes(1);
    expect(getAll).toHaveBeenCalledWith({ page: 1, limit: 500 });
    expect(result.items).toHaveLength(2);
  });
});
