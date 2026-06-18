import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ShiftAssignmentResponseDto = {
  id: string;
  companyId: string;
  shiftTemplateId: string;
  shiftTemplateNameAr: string;
  shiftTemplateColorHex: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  openShiftHours: number | null;
  batchId: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ShiftAssignmentListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  shiftTemplateId?: string;
  isActive?: boolean;
  batchId?: string;
};

export type CreateShiftAssignmentDto = {
  companyId: string;
  shiftTemplateId: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  openShiftHours?: number | null;
  isActive?: boolean;
  notes?: string | null;
};

export type BulkCreateShiftAssignmentDto = {
  companyId: string;
  shiftTemplateId: string;
  employeeIds: string[];
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive?: boolean;
  notes?: string | null;
};

export type BulkCreateShiftAssignmentResult = {
  created: number;
  requested: number;
  items: ShiftAssignmentResponseDto[];
};

export type UpdateShiftAssignmentDto = Partial<Omit<CreateShiftAssignmentDto, 'companyId' | 'shiftTemplateId' | 'employeeId'>>;

export type GroupedByTemplateEmployee = {
  assignmentId: string;
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string | null;
  employeeCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  openShiftHours: number | null;
  batchId: string | null;
  isActive: boolean;
  notes: string | null;
};

export type GroupedByTemplateItem = {
  shiftTemplate: {
    id: string;
    companyId: string;
    nameAr: string;
    nameEn: string | null;
    colorHex: string;
    effectiveFrom: string;
    isActive: boolean;
  };
  totalAssignments: number;
  activeAssignments: number;
  employees: GroupedByTemplateEmployee[];
};

export type GroupedByTemplateQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  shiftTemplateId?: string;
  isActive?: boolean;
  batchId?: string;
};

/** Active company employee with no effective shift assignment on the reference date. */
export type UnassignedEmployeeResponseDto = {
  id: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string | null;
  branchId: string | null;
  departmentId: string | null;
  jobTitleId: string | null;
};

export type UnassignedEmployeesListQuery = {
  page?: number;
  limit?: number;
  companyId: string;
  asOfDate?: string;
};

export const shiftAssignmentsApi = {
  getAll(query?: ShiftAssignmentListQuery) {
    return apiRequest<PaginatedResult<ShiftAssignmentResponseDto>>('/attendance/shift-assignments', { query });
  },
  getGroupedByTemplate(query?: GroupedByTemplateQuery) {
    return apiRequest<PaginatedResult<GroupedByTemplateItem>>('/attendance/shift-assignments/grouped-by-template', { query });
  },
  getUnassignedEmployees(query: UnassignedEmployeesListQuery) {
    return apiRequest<PaginatedResult<UnassignedEmployeeResponseDto>>(
      '/attendance/shift-assignments/unassigned-employees',
      { query },
    );
  },
  getById(id: string) {
    return apiRequest<ShiftAssignmentResponseDto>(`/attendance/shift-assignments/${id}`);
  },
  create(payload: CreateShiftAssignmentDto) {
    return apiRequest<ShiftAssignmentResponseDto>('/attendance/shift-assignments', { method: 'POST', body: payload });
  },
  bulkCreate(payload: BulkCreateShiftAssignmentDto) {
    return apiRequest<BulkCreateShiftAssignmentResult>('/attendance/shift-assignments/bulk', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateShiftAssignmentDto) {
    return apiRequest<ShiftAssignmentResponseDto>(`/attendance/shift-assignments/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/shift-assignments/${id}`, { method: 'DELETE' });
  },
};
