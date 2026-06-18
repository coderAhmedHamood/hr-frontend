import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ViolationDeductionKindDto = 'none' | 'amount' | 'hours' | 'day';

export type ViolationTypeResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  sortOrder: number;
  isActive: boolean;
  hasDeduction: boolean;
  deductionKind: ViolationDeductionKindDto | null;
  deductionValue: string | null;
  needsWarning: boolean;
  needsInvestigation: boolean;
  needsApproval: boolean;
  approvalTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateViolationTypeDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  hasDeduction?: boolean;
  deductionKind?: ViolationDeductionKindDto | null;
  deductionValue?: number | null;
  needsWarning?: boolean;
  needsInvestigation?: boolean;
  needsApproval?: boolean;
  approvalTemplateId?: string | null;
};

export type UpdateViolationTypeDto = Omit<Partial<CreateViolationTypeDto>, 'companyId'>;

export type ViolationTypeListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
};

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
