import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type DepartmentResponseDto = {
  id: string;
  companyId: string;
  branchId: string;
  parentDepartmentId: string | null;
  code: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  managerEmployeeId: string | null;
  levelNo: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDepartmentDto = {
  companyId: string;
  branchId: string;
  parentDepartmentId?: string | null;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  managerEmployeeId?: string | null;
  levelNo?: number;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateDepartmentDto = Omit<Partial<CreateDepartmentDto>, 'companyId' | 'branchId'>;

export type DepartmentListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  branchId?: string;
  isActive?: boolean;
};

export const departmentsApi = {
  getAll(query?: DepartmentListQuery) {
    return apiRequest<PaginatedResult<DepartmentResponseDto>>('/departments', { query });
  },
  getById(id: string) {
    return apiRequest<DepartmentResponseDto>(`/departments/${id}`);
  },
  create(payload: CreateDepartmentDto) {
    return apiRequest<DepartmentResponseDto>('/departments', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateDepartmentDto) {
    return apiRequest<DepartmentResponseDto>(`/departments/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/departments/${id}`, { method: 'DELETE' });
  },
};
