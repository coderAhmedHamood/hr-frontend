import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type EmployeeResignationStatus = 'draft' | 'issued' | 'revoked';
export type EmployeeResignationSignatureStatus = 'none' | 'pending' | 'signed';

export type EmployeeResignationDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string | null;
  branchNameAr: string | null;
  jobTitle: string | null;
  nationality: string | null;
  issuedByEmployeeId: string | null;
  issuedByEmployeeNameAr: string | null;
  resignationNumber: string;
  reasons: string | null;
  effectiveDateHijri: string | null;
  effectiveDateGregorian: string;
  applicantName: string | null;
  signatureName: string | null;
  submissionDate: string;
  status: EmployeeResignationStatus | string;
  employeeSignatureStatus?: EmployeeResignationSignatureStatus | string;
  signatureMethod?: string | null;
  signedAttachmentId?: string | null;
  signatureImageUrl?: string | null;
  employeeSignedAt?: string | null;
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

export type CreateEmployeeResignationDto = {
  companyId: string;
  employeeId: string;
  issuedByEmployeeId?: string | null;
  resignationNumber: string;
  submissionDate: string;
  effectiveDateGregorian: string;
  effectiveDateHijri?: string | null;
  branchNameAr?: string | null;
  jobTitle?: string | null;
  nationality?: string | null;
  reasons: string;
  applicantName?: string | null;
  signatureName?: string | null;
  notes?: string | null;
  attachments?: unknown[] | null;
  createdBy?: string | null;
};

export type EmployeeResignationListParams = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  issuedByEmployeeId?: string;
  status?: string;
  resignationNumber?: string;
  submissionDateFrom?: string;
  submissionDateTo?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
};

export const employeeResignationsApi = {
  getAll(query?: EmployeeResignationListParams) {
    return apiRequest<PaginatedResult<EmployeeResignationDto>>('/hr/employee-resignations', {
      query,
    });
  },

  getById(id: string) {
    return apiRequest<EmployeeResignationDto>(`/hr/employee-resignations/${id}`);
  },

  create(payload: CreateEmployeeResignationDto) {
    return apiRequest<EmployeeResignationDto>('/hr/employee-resignations', {
      method: 'POST',
      body: payload,
    });
  },

  sendToEmployee(
    id: string,
    payload?: { issuedByEmployeeId?: string; updatedBy?: string | null },
  ) {
    return apiRequest<EmployeeResignationDto>(
      `/hr/employee-resignations/${id}/send-to-employee`,
      { method: 'POST', body: payload ?? {} },
    );
  },
};
