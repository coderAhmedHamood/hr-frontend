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
