import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ExperienceCertificateStatus = 'draft' | 'issued' | 'revoked';
export type ExperienceCertificateLanguage = 'ar' | 'en' | 'both';

export type ExperienceCertificateDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string | null;
  issuedByEmployeeId: string | null;
  issuedByEmployeeNameAr: string | null;
  certificateNumber: string;
  issuanceDate: string;
  serviceStartDate: string;
  serviceEndDate: string | null;
  jobTitleOnCertificate: string;
  dutiesSummary: string | null;
  purpose: string | null;
  addressedTo: string | null;
  language: ExperienceCertificateLanguage | string;
  status: ExperienceCertificateStatus | string;
  notes: string | null;
  attachments: unknown[] | null;
  issuedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateExperienceCertificateDto = {
  companyId: string;
  employeeId: string;
  issuedByEmployeeId?: string | null;
  certificateNumber: string;
  issuanceDate: string;
  serviceStartDate: string;
  serviceEndDate: string;
  jobTitleOnCertificate: string;
  dutiesSummary: string;
  purpose?: string | null;
  addressedTo?: string | null;
  language?: ExperienceCertificateLanguage | string;
  notes?: string | null;
  attachments?: unknown[] | null;
  createdBy?: string | null;
};

export type ExperienceCertificateListParams = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  issuedByEmployeeId?: string;
  status?: string;
  language?: string;
  certificateNumber?: string;
  issuanceDateFrom?: string;
  issuanceDateTo?: string;
};

export const experienceCertificatesApi = {
  getAll(query?: ExperienceCertificateListParams) {
    return apiRequest<PaginatedResult<ExperienceCertificateDto>>('/hr/experience-certificates', {
      query,
    });
  },

  getById(id: string) {
    return apiRequest<ExperienceCertificateDto>(`/hr/experience-certificates/${id}`);
  },

  create(payload: CreateExperienceCertificateDto) {
    return apiRequest<ExperienceCertificateDto>('/hr/experience-certificates', {
      method: 'POST',
      body: payload,
    });
  },
};
