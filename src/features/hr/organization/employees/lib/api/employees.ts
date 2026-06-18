import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { UserResponseDto } from '@/features/hr/organization/lib/api/users';
import type { EmployeeAssignmentResponseDto } from '@/features/hr/organization/employees/lib/api/employee-assignments';

export type { EmployeeAssignmentResponseDto };

export type EmployeeResponseDto = {
  id: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string | null;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  nationality: string | null;
  avatar: string | null;
  position: string | null;
  managerId: string | null;
  contractType: string | null;
  contractStatus: string | null;
  startDate: string | null;
  endDate: string | null;
  baseSalary: string | null;
  housingAllowance: string | null;
  transportAllowance: string | null;
  otherAllowances: string | null;
  gosi: string | null;
  bankAccount: string | null;
  iban: string | null;
  address: string | null;
  gender: string | null;
  birthDate: string | null;
  maritalStatus: string | null;
  role: string | null;
  assignedRoleId: string | null;
  userId: string | null;
  hasUser?: boolean;
  user?: {
    id: string;
    email: string | null;
    phone: string | null;
    fullNameAr: string | null;
    fullNameEn: string | null;
    isActive: boolean;
    status: string;
  } | null;
  branchId: string | null;
  branchNameAr: string | null;
  departmentId: string | null;
  departmentNameAr: string | null;
  meta: Record<string, unknown> | null;
  assignment?: EmployeeAssignmentResponseDto | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateEmployeeDto = {
  employeeCode: string;
  nameAr: string;
  nameEn?: string | null;
  email?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  nationality?: string | null;
  position?: string | null;
  managerId?: string | null;
  startDate?: string | null;
  bankAccount?: string | null;
  iban?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  maritalStatus?: string | null;
  role?: string | null;
  /** Primary org assignment created with the employee. */
  companyId?: string;
  branchId?: string;
  departmentId?: string | null;
  jobTitleId?: string | null;
  assignmentIsPrimary?: boolean;
};

/** Matches PATCH /hr/employees/{id} — no allowance fields (not in backend schema). */
export type UpdateEmployeeDto = {
  nameAr?: string;
  nameEn?: string | null;
  email?: string | null;
  phone?: string | null;
  nationalId?: string | null;
  nationality?: string | null;
  avatar?: string | null;
  avatarHue?: number;
  position?: string | null;
  managerId?: string | null;
  contractType?: string | null;
  contractStatus?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  baseSalary?: number | null;
  bankAccount?: string | null;
  iban?: string | null;
  address?: string | null;
  openStream?: string | null;
  village?: string | null;
  district?: string | null;
  city?: string | null;
  emergencyContact?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  maritalStatus?: string | null;
  role?: string | null;
  meta?: Record<string, unknown>;
};

export type EmployeeListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  search?: string;
  branchId?: string;
  departmentId?: string;
  contractStatus?: string;
  startDateFrom?: string;
  startDateTo?: string;
};

export type CreateEmployeeUserAccountDto = {
  employeeCode: string;
  companyId: string;
  email: string;
  password: string;
};

export const employeesApi = {
  getAll(query?: EmployeeListQuery) {
    return apiRequest<PaginatedResult<EmployeeResponseDto>>('/hr/employees', { query });
  },
  getById(id: string) {
    return apiRequest<EmployeeResponseDto>(`/hr/employees/${id}`);
  },
  create(payload: CreateEmployeeDto) {
    return apiRequest<EmployeeResponseDto>('/hr/employees', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateEmployeeDto) {
    return apiRequest<EmployeeResponseDto>(`/hr/employees/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/hr/employees/${id}`, { method: 'DELETE' });
  },
  createUserAccount(payload: CreateEmployeeUserAccountDto) {
    return apiRequest<UserResponseDto>('/hr/employees/user-account', {
      method: 'POST',
      body: payload,
    });
  },
};
