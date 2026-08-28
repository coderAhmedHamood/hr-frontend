import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

/** يطابق `CompanyGuideline` في الباك-إند — `@Controller('guidelines')`. */
export type CompanyGuidelineDto = {
  id: string;
  companyId: string;
  titleAr: string;
  bodyAr: string | null;
  points: string[];
  isPublished: boolean;
  sortOrder: number;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCompanyGuidelineDto = {
  companyId: string;
  titleAr: string;
  bodyAr?: string | null;
  points?: string[];
  isPublished?: boolean;
  sortOrder?: number;
};

export type UpdateCompanyGuidelineDto = {
  titleAr?: string;
  bodyAr?: string | null;
  points?: string[];
  isPublished?: boolean;
  sortOrder?: number;
};

export type CompanyGuidelinesListParams = {
  companyId?: string;
  isPublished?: boolean;
  archiveScope?: OrganizationArchiveScope;
  page?: number;
  limit?: number;
};

export const companyGuidelinesApi = {
  list(params: CompanyGuidelinesListParams) {
    return apiRequest<PaginatedResult<CompanyGuidelineDto>>('/guidelines', { query: params });
  },
  getById(id: string) {
    return apiRequest<CompanyGuidelineDto>(`/guidelines/${id}`);
  },
  create(payload: CreateCompanyGuidelineDto) {
    return apiRequest<CompanyGuidelineDto>('/guidelines', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateCompanyGuidelineDto) {
    return apiRequest<CompanyGuidelineDto>(`/guidelines/${id}`, { method: 'PATCH', body: payload });
  },
  /** استعادة إرشاد مؤرشف. */
  restore(id: string) {
    return apiRequest<CompanyGuidelineDto>(`/guidelines/${id}/restore`, { method: 'PATCH' });
  },
  /** أرشفة منطقية — لا يوجد حذف فعلي. */
  archive(id: string) {
    return apiRequest<void>(`/guidelines/${id}`, { method: 'DELETE' });
  },
  /** مسار تطبيق الجوال — مصفوفة مباشرة، منشور وغير مؤرشف فقط. */
  listForMobile(companyId: string) {
    return apiRequest<CompanyGuidelineDto[]>(`/guidelines/mobile/${companyId}`);
  },
};
