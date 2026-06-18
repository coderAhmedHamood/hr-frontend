import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type BranchResponseDto = {
  id: string;
  companyId: string;
  code: string;
  nameAr: string;
  nameEn: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  managerName: string | null;
  isHeadquarters: boolean;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateBranchDto = {
  companyId: string;
  code: string;
  nameAr: string;
  nameEn?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  postalCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  managerName?: string | null;
  isHeadquarters?: boolean;
  isActive?: boolean;
  notes?: string | null;
};

export type UpdateBranchDto = Omit<Partial<CreateBranchDto>, 'companyId'>;

export type BranchListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
};

export const branchesApi = {
  getAll(query?: BranchListQuery) {
    return apiRequest<PaginatedResult<BranchResponseDto>>('/branches', { query });
  },
  getById(id: string) {
    return apiRequest<BranchResponseDto>(`/branches/${id}`);
  },
  create(payload: CreateBranchDto) {
    return apiRequest<BranchResponseDto>('/branches', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateBranchDto) {
    return apiRequest<BranchResponseDto>(`/branches/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/branches/${id}`, { method: 'DELETE' });
  },
};
