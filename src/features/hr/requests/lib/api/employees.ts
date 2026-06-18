import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

// ─── Response DTO ─────────────────────────────────────────────────────────────

export type EmployeeResponseDto = {
  id: string;
  employeeCode: string;
  nameAr: string;
  nameEn: string | null;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  nationality: string | null;
  position: string | null;
  managerId: string | null;
  contractStatus: string | null;
  startDate: string | null;
  baseSalary: string;
  avatar: string | null;
  gender: string | null;
  birthDate: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────

export const employeesApi = {
  list: (params?: { companyId?: string; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<EmployeeResponseDto>>('/hr/employees', { query: params }),

  get: (id: string) =>
    apiRequest<EmployeeResponseDto>(`/hr/employees/${id}`),
};
