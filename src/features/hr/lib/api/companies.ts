import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type CompanyResponseDto = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  crNumber: string | null;
  vatNumber: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const companiesApi = {
  getAll(query?: { page?: number; limit?: number }) {
    return apiRequest<PaginatedResult<CompanyResponseDto>>('/companies', { query });
  },
  getById(id: string) {
    return apiRequest<CompanyResponseDto>(`/companies/${id}`);
  },
};
