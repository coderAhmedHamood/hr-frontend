import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';
import type { ViolationDeductionKindDto, ViolationTypeResponseDto, CreateViolationTypeDto, UpdateViolationTypeDto, ViolationTypeListQuery } from '@/features/hr/discipline/types/api/violation-types';
export type { ViolationDeductionKindDto, ViolationTypeResponseDto, CreateViolationTypeDto, UpdateViolationTypeDto, ViolationTypeListQuery } from '@/features/hr/discipline/types/api/violation-types';






export const violationTypesApi = {
  getAll(query?: ViolationTypeListQuery) {
    return apiRequest<PaginatedResult<ViolationTypeResponseDto>>('/discipline/violation-types', { query });
  },
  getById(id: string) {
    return apiRequest<ViolationTypeResponseDto>(`/discipline/violation-types/${id}`);
  },
  create(payload: CreateViolationTypeDto) {
    return apiRequest<ViolationTypeResponseDto>('/discipline/violation-types', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateViolationTypeDto) {
    return apiRequest<ViolationTypeResponseDto>(`/discipline/violation-types/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/discipline/violation-types/${id}`, { method: 'DELETE' });
  },
};

