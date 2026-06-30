/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useAllowanceTypes, allowanceTypeKeys } from '../use-allowance-types';

// ─── mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/hr/organization/lib/default-company-id', () => ({
  getDefaultCompanyId: jest.fn(() => 'company-1'),
}));

jest.mock('@/features/hr/organization/lib/archive-scope', () => ({
  payrollListArchiveQuery: jest.fn(() => ({})),
}));

const mockGetAll = jest.fn();
jest.mock('@/features/hr/contracts/lib/api/allowance-types', () => ({
  allowanceTypesApi: { getAll: (...args: unknown[]) => mockGetAll(...args) },
}));

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const apiRow = {
  id: 'at-1',
  companyId: 'company-1',
  code: 'HOUSING',
  nameAr: 'بدل سكن',
  nameEn: 'Housing Allowance',
  calculationType: 'fixed_amount',
  typicalAmount: '1500',
  typicalPercent: null,
  currency: 'SAR',
  isTaxable: false,
  isIncludedInGosi: false,
  sortOrder: 1,
  isActive: true,
  notes: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  createdBy: null,
  updatedBy: null,
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe('useAllowanceTypes', () => {
  beforeEach(() => {
    mockGetAll.mockResolvedValue({ items: [apiRow], pagination: { page: 1, limit: 200, total: 1, totalPages: 1 } });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and maps allowance types', async () => {
    const { result } = renderHook(() => useAllowanceTypes(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: 'at-1',
        code: 'HOUSING',
        nameAr: 'بدل سكن',
        nameEn: 'Housing Allowance',
        typicalAmount: 1500,
        currency: 'SAR',
        sortOrder: 1,
        isActive: true,
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]);
  });

  it('calls the API with companyId and limit 200', async () => {
    const { result } = renderHook(() => useAllowanceTypes(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGetAll).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-1', limit: 200 }),
    );
  });

  it('returns empty array and disabled state when no companyId', async () => {
    const { getDefaultCompanyId } = jest.requireMock('@/features/hr/organization/lib/default-company-id');
    (getDefaultCompanyId as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useAllowanceTypes(), { wrapper: makeWrapper() });

    // query should stay pending/idle (not fire), so mockGetAll never called
    await waitFor(() => expect(result.current.isFetching).toBe(false));
    expect(mockGetAll).not.toHaveBeenCalled();

    (getDefaultCompanyId as jest.Mock).mockReturnValue('company-1');
  });

  it('exposes correct query key shape', () => {
    expect(allowanceTypeKeys.byCompany('company-1')).toEqual(['allowance-types', 'company-1']);
    expect(allowanceTypeKeys.all).toEqual(['allowance-types']);
  });

  it('maps typicalAmount null to 0', async () => {
    mockGetAll.mockResolvedValue({
      items: [{ ...apiRow, typicalAmount: null }],
      pagination: { page: 1, limit: 200, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => useAllowanceTypes(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].typicalAmount).toBe(0);
  });

  it('maps nameEn null to empty string', async () => {
    mockGetAll.mockResolvedValue({
      items: [{ ...apiRow, nameEn: null }],
      pagination: { page: 1, limit: 200, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => useAllowanceTypes(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].nameEn).toBe('');
  });
});
