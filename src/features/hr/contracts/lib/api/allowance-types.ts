import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type AllowanceCalculationType = 'fixed_amount' | 'percent_of_basic';

export type AllowanceTypeDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  calculationType: AllowanceCalculationType;
  typicalAmount: string | null;
  typicalPercent: string | null;
  currency: string;
  isTaxable: boolean;
  isIncludedInGosi: boolean;
  sortOrder: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateAllowanceTypeDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  calculationType: AllowanceCalculationType;
  typicalAmount?: number | null;
  typicalPercent?: number | null;
  currency?: string;
  isTaxable?: boolean;
  isIncludedInGosi?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateAllowanceTypeDto = Partial<Omit<CreateAllowanceTypeDto, 'companyId'>>;

export const allowanceTypesApi = {
  getAll(params?: { companyId?: string; isActive?: boolean; page?: number; limit?: number }) {
    return apiRequest<PaginatedResult<AllowanceTypeDto>>('/payroll/allowance-types', { query: params });
  },
  getById(id: string) {
    return apiRequest<AllowanceTypeDto>(`/payroll/allowance-types/${id}`);
  },
  create(body: CreateAllowanceTypeDto) {
    return apiRequest<AllowanceTypeDto>('/payroll/allowance-types', { method: 'POST', body });
  },
  update(id: string, body: UpdateAllowanceTypeDto) {
    return apiRequest<AllowanceTypeDto>(`/payroll/allowance-types/${id}`, { method: 'PATCH', body });
  },
  remove(id: string) {
    return apiRequest<void>(`/payroll/allowance-types/${id}`, { method: 'DELETE' });
  },
};
