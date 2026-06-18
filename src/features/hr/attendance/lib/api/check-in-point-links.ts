import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type CheckInPointLinkResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  checkInPointId: string;
  batchId: string | null;
  effectiveFrom: string | null;
  linkActive: boolean;
};

export type CreateCheckInPointLinkDto = {
  companyId: string;
  employeeId: string;
  checkInPointId: string;
  batchId?: string | null;
  effectiveFrom?: string | null;
  linkActive?: boolean;
};

export type BulkCheckInPointLinkItem = {
  employeeId: string;
  checkInPointId: string;
};

export type BulkCreateCheckInPointLinkDto = {
  companyId: string;
  links: BulkCheckInPointLinkItem[];
  batchId?: string | null;
  effectiveFrom?: string | null;
  linkActive?: boolean;
};

export type BulkCreateCheckInPointLinkResponseDto = {
  created: number;
  requested: number;
  items: CheckInPointLinkResponseDto[];
};

export type UpdateCheckInPointLinkDto = Omit<
  Partial<CreateCheckInPointLinkDto>,
  'companyId' | 'employeeId' | 'checkInPointId'
>;

export type CheckInPointLinkListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  checkInPointId?: string;
  linkActive?: boolean;
};

export type GroupedByPointEmployee = {
  linkId: string;
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string | null;
  employeeCode: string;
  batchId: string | null;
  effectiveFrom: string | null;
  linkActive: boolean;
};

export type GroupedByPointItem = {
  checkInPoint: {
    id: string;
    companyId: string;
    nameAr: string;
    nameEn: string | null;
    latitude: string;
    longitude: string;
    radiusMeters: number;
    isActive: boolean;
  };
  totalLinks: number;
  activeLinks: number;
  employees: GroupedByPointEmployee[];
};

export type GroupedByPointQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  checkInPointId?: string;
  linkActive?: boolean;
};

export const checkInPointLinksApi = {
  getAll(query?: CheckInPointLinkListQuery) {
    return apiRequest<PaginatedResult<CheckInPointLinkResponseDto>>('/attendance/check-in-point-links', {
      query,
    });
  },
  getById(id: string) {
    return apiRequest<CheckInPointLinkResponseDto>(`/attendance/check-in-point-links/${id}`);
  },
  create(payload: CreateCheckInPointLinkDto) {
    return apiRequest<CheckInPointLinkResponseDto>('/attendance/check-in-point-links', {
      method: 'POST',
      body: payload,
    });
  },
  createBulk(payload: BulkCreateCheckInPointLinkDto) {
    return apiRequest<BulkCreateCheckInPointLinkResponseDto>('/attendance/check-in-point-links/bulk', {
      method: 'POST',
      body: payload,
    });
  },
  update(id: string, payload: UpdateCheckInPointLinkDto) {
    return apiRequest<CheckInPointLinkResponseDto>(`/attendance/check-in-point-links/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/check-in-point-links/${id}`, { method: 'DELETE' });
  },
  getGroupedByPoint(query?: GroupedByPointQuery) {
    return apiRequest<PaginatedResult<GroupedByPointItem>>('/attendance/check-in-point-links/grouped-by-point', { query });
  },
};
