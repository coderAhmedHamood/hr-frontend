import {
  buildEmployeeContractsListQuery,
  CONTRACT_STATUS,
} from '@/features/hr/contracts/lib/employee-contracts-list-query';

describe('buildEmployeeContractsListQuery', () => {
  it('builds company + status for active contracts', () => {
    expect(
      buildEmployeeContractsListQuery({
        companyId: 'c1',
        page: 1,
        limit: 50,
        status: 'active',
      }),
    ).toEqual({
      companyId: 'c1',
      page: 1,
      limit: 50,
      status: 'active',
    });
  });

  it('sends isDraft only when status is all', () => {
    expect(
      buildEmployeeContractsListQuery({
        companyId: 'c1',
        page: 1,
        limit: 20,
        draftMode: 'draft',
      }),
    ).toMatchObject({ isDraft: true });

    expect(
      buildEmployeeContractsListQuery({
        companyId: 'c1',
        page: 1,
        limit: 20,
        draftMode: 'undraft',
      }),
    ).toMatchObject({ isDraft: false });
  });

  it('prefers status over isDraft to avoid incompatible pairs', () => {
    const q = buildEmployeeContractsListQuery({
      companyId: 'c1',
      page: 1,
      limit: 20,
      status: 'active',
      draftMode: 'draft',
    });
    expect(q.status).toBe('active');
    expect(q.isDraft).toBeUndefined();
  });

  it('dedupes employeeIds and supports contractNumber partial search', () => {
    const q = buildEmployeeContractsListQuery({
      companyId: 'c1',
      page: 1,
      limit: 20,
      employeeIds: ['u1', 'u1', 'u2'],
      contractNumber: '  CON-2026  ',
      contractNature: 'fixed_term',
      workArrangement: 'full_time',
    });
    expect(q.employeeIds).toEqual(['u1', 'u2']);
    expect(q.contractNumber).toBe('CON-2026');
    expect(q.contractNature).toBe('fixed_term');
    expect(q.workArrangement).toBe('full_time');
  });

  it('exposes the documented status enum literals', () => {
    expect([...CONTRACT_STATUS]).toEqual([
      'draft',
      'pending_signature',
      'active',
      'expired',
      'terminated',
      'superseded',
      'cancelled',
    ]);
  });
});
