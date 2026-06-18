import {
  createEmployeeUserAccount,
  resolveCreatedUserId,
  resolveEmployeeUserAccountCompanyId,
} from '@/features/hr/organization/employees/services/employee-user-account.service';
import { employeesApi } from '@/features/hr/organization/employees/lib/api/employees';
import { useAuthStore } from '@/features/auth/lib/auth-store';

jest.mock('@/features/hr/organization/employees/lib/api/employees', () => ({
  employeesApi: {
    createUserAccount: jest.fn(),
  },
}));

jest.mock('@/features/hr/organization/employees/services/employee-company.service', () => ({
  resolveEmployeeCompanyId: jest.fn(),
}));

import { resolveEmployeeCompanyId } from '@/features/hr/organization/employees/services/employee-company.service';

const resolveEmployeeCompanyIdMock = resolveEmployeeCompanyId as jest.Mock;

const createUserAccount = employeesApi.createUserAccount as jest.Mock;

const companyA = '4002cca8-64fe-428c-9946-c42676dfc0a2';
const companyB = '11111111-1111-4111-8111-111111111111';

describe('employee-user-account.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      activeCompanyId: companyA,
      accessProfile: {
        userId: 'admin-1',
        defaultCompanyId: companyA,
        defaultBranchId: null,
        companies: [{ companyId: companyA, permissions: [], deniedPermissions: [], branches: [] }],
      },
    });
  });

  it('prefers the employee primary assignment company when the user is linked to it', async () => {
    resolveEmployeeCompanyIdMock.mockResolvedValue(companyA);

    await expect(resolveEmployeeUserAccountCompanyId('emp-1')).resolves.toBe(companyA);
  });

  it('falls back to active company when employee has no assignments', async () => {
    resolveEmployeeCompanyIdMock.mockRejectedValue(new Error('no assignment'));

    await expect(resolveEmployeeUserAccountCompanyId('emp-1')).resolves.toBe(companyA);
  });

  it('rejects when employee assignment company is not linked to the current user', async () => {
    resolveEmployeeCompanyIdMock.mockResolvedValue(companyB);

    await expect(resolveEmployeeUserAccountCompanyId('emp-1')).rejects.toThrow(
      'الموظف معيّن لشركة لا يمكنك إدارتها',
    );
  });

  it('calls POST /hr/employees/user-account via employeesApi', async () => {
    createUserAccount.mockResolvedValue({
      id: 'user-1',
      email: 'user@company.com',
    });

    const result = await createEmployeeUserAccount({
      employeeCode: 'EMP-001',
      companyId: companyA,
      email: 'user@company.com',
      password: 'secret12',
    });

    expect(createUserAccount).toHaveBeenCalledWith({
      employeeCode: 'EMP-001',
      companyId: companyA,
      email: 'user@company.com',
      password: 'secret12',
    });
    expect(result.id).toBe('user-1');
    expect(resolveCreatedUserId(result)).toBe('user-1');
  });

  it('resolveCreatedUserId prefers userId, nested user.id, then top-level id', () => {
    expect(resolveCreatedUserId({ userId: 'u1' } as never)).toBe('u1');
    expect(resolveCreatedUserId({ user: { id: 'u2' } } as never)).toBe('u2');
    expect(resolveCreatedUserId({ id: 'u3' } as never)).toBe('u3');
    expect(resolveCreatedUserId({} as never)).toBeNull();
  });
});
