import { apiRequest } from '@/features/hr/lib/api/client';

export type EmployeeAssignmentStatusDto = 'active' | 'suspended' | 'ended';

export type EmployeeAssignmentResponseDto = {
  id: string;
  employeeId: string;
  companyId: string;
  branchId: string;
  departmentId: string | null;
  jobTitleId: string | null;
  isPrimary: boolean;
  status: EmployeeAssignmentStatusDto;
  startDate: string | null;
  endDate: string | null;
  isArchived: boolean;
  archivedAt: string | null;
  archivedReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateEmployeeAssignmentDto = {
  companyId: string;
  branchId: string;
  departmentId?: string | null;
  jobTitleId?: string | null;
  isPrimary?: boolean;
  status?: EmployeeAssignmentStatusDto;
  startDate?: string | null;
  endDate?: string | null;
};

/** PATCH — company/branch cannot be changed after create. */
export type UpdateEmployeeAssignmentDto = {
  departmentId?: string | null;
  jobTitleId?: string | null;
  isPrimary?: boolean;
  status?: EmployeeAssignmentStatusDto;
  startDate?: string | null;
  endDate?: string | null;
};

export const employeeAssignmentsApi = {
  getAll(employeeId: string) {
    return apiRequest<EmployeeAssignmentResponseDto[]>(`/hr/employees/${employeeId}/assignments`);
  },
  getById(employeeId: string, assignmentId: string) {
    return apiRequest<EmployeeAssignmentResponseDto>(
      `/hr/employees/${employeeId}/assignments/${assignmentId}`,
    );
  },
  create(employeeId: string, payload: CreateEmployeeAssignmentDto) {
    return apiRequest<EmployeeAssignmentResponseDto>(`/hr/employees/${employeeId}/assignments`, {
      method: 'POST',
      body: payload,
    });
  },
  update(employeeId: string, assignmentId: string, payload: UpdateEmployeeAssignmentDto) {
    return apiRequest<EmployeeAssignmentResponseDto>(
      `/hr/employees/${employeeId}/assignments/${assignmentId}`,
      { method: 'PATCH', body: payload },
    );
  },
  remove(employeeId: string, assignmentId: string) {
    return apiRequest<void>(
      `/hr/employees/${employeeId}/assignments/${assignmentId}`,
      { method: 'DELETE' },
    );
  },
};
