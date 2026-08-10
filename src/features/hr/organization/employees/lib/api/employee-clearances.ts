import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type EmployeeClearanceStatus = 'draft' | 'issued' | 'revoked';
export type EmployeeClearanceSignatureStatus = 'none' | 'pending' | 'signed';

export type EmployeeClearanceDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string | null;
  issuedByEmployeeId: string | null;
  issuedByEmployeeNameAr: string | null;
  clearanceNumber: string;
  clearanceDate: string;
  jobTitle: string;
  reasons: string | null;
  financialDischargeAcknowledged: boolean;
  claimsWaived: boolean;
  noMutualObligations: boolean;
  signatureName: string | null;
  nationalId: string | null;
  status: EmployeeClearanceStatus | string;
  employeeSignatureStatus?: EmployeeClearanceSignatureStatus | string;
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

export type CreateEmployeeClearanceDto = {
  companyId: string;
  employeeId: string;
  issuedByEmployeeId?: string | null;
  clearanceNumber: string;
  clearanceDate: string;
  jobTitle: string;
  reasons: string;
  financialDischargeAcknowledged?: boolean;
  claimsWaived?: boolean;
  noMutualObligations?: boolean;
  signatureName?: string | null;
  nationalId?: string | null;
  notes?: string | null;
  attachments?: unknown[] | null;
  createdBy?: string | null;
};

export type EmployeeClearanceListParams = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  issuedByEmployeeId?: string;
  status?: string;
  clearanceNumber?: string;
  clearanceDateFrom?: string;
  clearanceDateTo?: string;
};

export const employeeClearancesApi = {
  getAll(query?: EmployeeClearanceListParams) {
    return apiRequest<PaginatedResult<EmployeeClearanceDto>>('/hr/employee-clearances', {
      query,
    });
  },

  getById(id: string) {
    return apiRequest<EmployeeClearanceDto>(`/hr/employee-clearances/${id}`);
  },

  create(payload: CreateEmployeeClearanceDto) {
    return apiRequest<EmployeeClearanceDto>('/hr/employee-clearances', {
      method: 'POST',
      body: payload,
    });
  },

  sendToEmployee(
    id: string,
    payload?: { issuedByEmployeeId?: string; updatedBy?: string | null },
  ) {
    return apiRequest<EmployeeClearanceDto>(
      `/hr/employee-clearances/${id}/send-to-employee`,
      { method: 'POST', body: payload ?? {} },
    );
  },
};
