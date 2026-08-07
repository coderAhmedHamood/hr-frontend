import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type EmployeeMobileCircularStatus = 'draft' | 'issued' | 'revoked';
export type EmployeeMobileCircularSignatureStatus = 'none' | 'pending' | 'signed';

export type EmployeeMobileCircularDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  nationalId: string | null;
  issuedByEmployeeId: string | null;
  issuedByEmployeeNameAr: string | null;
  circularNumber: string;
  circularDate: string;
  status: EmployeeMobileCircularStatus | string;
  employeeSignatureStatus?: EmployeeMobileCircularSignatureStatus | string;
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

export type CreateEmployeeMobileCircularDto = {
  companyId: string;
  employeeId: string;
  issuedByEmployeeId?: string | null;
  circularNumber?: string;
  circularDate: string;
  nationalId?: string | null;
  notes?: string | null;
  attachments?: unknown[] | null;
  createdBy?: string | null;
};

export type EmployeeMobileCircularListParams = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  status?: string;
  employeeSignatureStatus?: string;
};

export const employeeMobileCircularsApi = {
  getAll(query?: EmployeeMobileCircularListParams) {
    return apiRequest<PaginatedResult<EmployeeMobileCircularDto>>(
      '/hr/employee-mobile-circulars',
      { query },
    );
  },

  getById(id: string) {
    return apiRequest<EmployeeMobileCircularDto>(
      `/hr/employee-mobile-circulars/${id}`,
    );
  },

  create(payload: CreateEmployeeMobileCircularDto) {
    return apiRequest<EmployeeMobileCircularDto>('/hr/employee-mobile-circulars', {
      method: 'POST',
      body: payload,
    });
  },

  sendToEmployee(
    id: string,
    payload?: { issuedByEmployeeId?: string; updatedBy?: string | null },
  ) {
    return apiRequest<EmployeeMobileCircularDto>(
      `/hr/employee-mobile-circulars/${id}/send-to-employee`,
      { method: 'POST', body: payload ?? {} },
    );
  },
};
