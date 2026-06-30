/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as React from 'react';
import { useContractArticles, contractArticleKeys } from '../use-contract-articles';

// ─── mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/hr/organization/lib/default-company-id', () => ({
  getDefaultCompanyId: jest.fn(() => 'company-1'),
}));

jest.mock('@/features/hr/organization/lib/archive-scope', () => ({
  payrollListArchiveQuery: jest.fn(() => ({})),
}));

const mockList = jest.fn();
jest.mock('@/features/hr/contracts/lib/contracts-api', () => ({
  contractArticlesApi: { list: (...args: unknown[]) => mockList(...args) },
}));

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const apiRow = {
  id: 'art-1',
  companyId: 'company-1',
  code: 'ART-001',
  titleAr: 'مادة العمل الإضافي',
  bodyAr: 'يُلزم الموظف بالعمل الإضافي عند الحاجة.\r\nوفق ما تقتضيه المصلحة.',
  isBasic: true,
  isActive: true,
  isArchived: false,
  updatedAt: '2024-06-01T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z',
  createdBy: null,
  updatedBy: null,
};

// ─── tests ────────────────────────────────────────────────────────────────────

describe('useContractArticles', () => {
  beforeEach(() => {
    mockList.mockResolvedValue({ items: [apiRow], pagination: { page: 1, limit: 200, total: 1, totalPages: 1 } });
  });

  afterEach(() => jest.clearAllMocks());

  it('fetches and maps articles', async () => {
    const { result } = renderHook(() => useContractArticles(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        id: 'art-1',
        code: 'ART-001',
        title: 'مادة العمل الإضافي',
        body: 'يُلزم الموظف بالعمل الإضافي عند الحاجة.\nوفق ما تقتضيه المصلحة.',
        isBasic: true,
        isActive: true,
        updatedAt: '2024-06-01T00:00:00Z',
      },
    ]);
  });

  it('normalizes \\r\\n to \\n in body', async () => {
    const { result } = renderHook(() => useContractArticles(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].body).not.toContain('\r');
  });

  it('maps null bodyAr to empty string', async () => {
    mockList.mockResolvedValue({
      items: [{ ...apiRow, bodyAr: null }],
      pagination: { page: 1, limit: 200, total: 1, totalPages: 1 },
    });

    const { result } = renderHook(() => useContractArticles(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].body).toBe('');
  });

  it('calls the API with companyId and limit 200', async () => {
    const { result } = renderHook(() => useContractArticles(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: 'company-1', limit: 200 }),
    );
  });

  it('stays disabled when no companyId', async () => {
    const { getDefaultCompanyId } = jest.requireMock('@/features/hr/organization/lib/default-company-id');
    (getDefaultCompanyId as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useContractArticles(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isFetching).toBe(false));

    expect(mockList).not.toHaveBeenCalled();
    (getDefaultCompanyId as jest.Mock).mockReturnValue('company-1');
  });

  it('exposes correct query key shape', () => {
    expect(contractArticleKeys.byCompany('company-1')).toEqual(['contract-articles', 'company-1']);
    expect(contractArticleKeys.all).toEqual(['contract-articles']);
  });
});
