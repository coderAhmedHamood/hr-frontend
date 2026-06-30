import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { EmployeeResponseDto } from '@/features/hr/requests/types/api/employees';
export type { EmployeeResponseDto } from '@/features/hr/requests/types/api/employees';

// ─── Response DTO ─────────────────────────────────────────────────────────────


// ─── API ──────────────────────────────────────────────────────────────────────

export const employeesApi = {
  list: (params?: { companyId?: string; page?: number; limit?: number }) =>
    apiRequest<PaginatedResult<EmployeeResponseDto>>('/hr/employees', { query: params }),

  get: (id: string) =>
    apiRequest<EmployeeResponseDto>(`/hr/employees/${id}`),
};

