import { buildPersonalEmployeeUpdatePayload } from '@/features/hr/organization/employees/services/employee-update.service';
import type { Employee } from '@/features/hr/organization/employees/types';

function baseEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'emp-1',
    employeeCode: 'EMP-001',
    name: 'أحمد',
    nameEn: 'Ahmed',
    email: 'a@test.com',
    phone: '0500000000',
    nationalId: '123',
    nationality: 'سعودي',
    avatar: '',
    position: 'محاسب',
    departmentId: '',
    branchId: '',
    managerId: null,
    contractType: 'permanent',
    contractStatus: 'active',
    startDate: '2024-01-01',
    baseSalary: 10000,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    gosi: 0,
    bankAccount: '',
    iban: '',
    address: 'الرياض',
    emergencyContact: '',
    gender: 'male',
    birthDate: '1990-01-01',
    maritalStatus: 'single',
    role: 'employee',
    ...overrides,
  };
}

describe('buildPersonalEmployeeUpdatePayload', () => {
  it('maps personal fields and includes nameAr', () => {
    const payload = buildPersonalEmployeeUpdatePayload(baseEmployee({ name: 'سارة العتيبي' }));
    expect(payload).toEqual({
      nameAr: 'سارة العتيبي',
      email: 'a@test.com',
      phone: '0500000000',
      nationalId: '123',
      nationality: 'سعودي',
      address: 'الرياض',
      gender: 'male',
      birthDate: '1990-01-01',
      maritalStatus: 'single',
    });
  });

  it('does not send allowance or contract fields', () => {
    const payload = buildPersonalEmployeeUpdatePayload(baseEmployee());
    expect(payload).not.toHaveProperty('housingAllowance');
    expect(payload).not.toHaveProperty('baseSalary');
    expect(payload).not.toHaveProperty('managerId');
    expect(payload).not.toHaveProperty('role');
  });
});
