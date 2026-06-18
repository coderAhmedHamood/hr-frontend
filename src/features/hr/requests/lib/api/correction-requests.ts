import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type CorrectionRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ApiCorrectionRequest = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  subtypeSlug: string | null;
  subtypeNameAr: string | null;
  attendanceDaySummaryId: string | null;
  departmentNameAr: string | null;
  workDate: string;
  previousCheckInAt: string | null;
  previousCheckOutAt: string | null;
  previousStatus: string | null;
  correctedCheckInAt: string | null;
  correctedCheckOutAt: string | null;
  reasonAr: string | null;
  decisionNotesAr: string | null;
  attachments: unknown[];
  status: CorrectionRequestStatus;
  submittedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
  decidedByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCorrectionRequestDto = {
  companyId: string;
  employeeId: string;
  requestTypeId: string;
  subtypeSlug?: string;
  attendanceDaySummaryId?: string;
  workDate: string;
  correctedCheckInAt?: string;
  correctedCheckOutAt?: string;
  reasonAr?: string;
  attachments?: unknown[];
  createdBy?: string;
};

export type UpdateCorrectionRequestDto = {
  subtypeSlug?: string | null;
  correctedCheckInAt?: string | null;
  correctedCheckOutAt?: string | null;
  reasonAr?: string;
  attachments?: unknown[];
  updatedBy?: string;
};

export type CorrectionDecisionDto = {
  decision: 'approve' | 'reject';
  /** HR employee id — not the auth user id */
  decidedByEmployeeId?: string;
  decisionNotesAr?: string;
  updatedBy?: string;
};

export type CorrectionCancelDto = {
  decisionNotesAr?: string;
  updatedBy?: string;
};

export const correctionRequestsApi = {
  list: (params?: {
    companyId?: string;
    employeeId?: string;
    requestTypeId?: string;
    status?: string;
    workDateFrom?: string;
    workDateTo?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<ApiCorrectionRequest>>('/requests/correction-requests', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<ApiCorrectionRequest>(`/requests/correction-requests/${id}`),

  create: (body: CreateCorrectionRequestDto) =>
    apiRequest<ApiCorrectionRequest>('/requests/correction-requests', { method: 'POST', body }),

  update: (id: string, body: UpdateCorrectionRequestDto) =>
    apiRequest<ApiCorrectionRequest>(`/requests/correction-requests/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/requests/correction-requests/${id}`, { method: 'DELETE' }),

  decide: (id: string, body: CorrectionDecisionDto) =>
    apiRequest<ApiCorrectionRequest>(`/requests/correction-requests/${id}/decision`, {
      method: 'POST',
      body,
    }),

  cancel: (id: string, body?: CorrectionCancelDto) =>
    apiRequest<ApiCorrectionRequest>(`/requests/correction-requests/${id}/cancel`, {
      method: 'POST',
      body: body ?? {},
    }),
};

// Also wire up the new leave-requests endpoint (matches Swagger /requests/leave-requests)
export type LeaveRequestStatusNew = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type ApiLeaveRequest = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  leaveTypeId: string;
  leaveTypeNameAr: string;
  subtypeSlug: string | null;
  subtypeNameAr: string | null;
  departmentNameAr: string | null;
  startDate: string;
  endDate: string;
  workingDays: number;
  reasonAr: string | null;
  decisionNotesAr: string | null;
  attachments: unknown[];
  status: LeaveRequestStatusNew;
  submittedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
  decidedByEmployeeId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateLeaveRequestNewDto = {
  companyId: string;
  employeeId: string;
  requestTypeId: string;
  leaveTypeId: string;
  subtypeSlug?: string;
  startDate: string;
  endDate: string;
  workingDays?: number;
  reasonAr?: string;
  attachments?: unknown[];
  createdBy?: string;
};

export type LeaveDecisionDto = {
  decision: 'approve' | 'reject';
  /** HR employee id — not the auth user id */
  decidedByEmployeeId?: string;
  decisionNotesAr?: string;
  updatedBy?: string;
};

export const leaveRequestsNewApi = {
  list: (params?: {
    companyId?: string;
    employeeId?: string;
    requestTypeId?: string;
    leaveTypeId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<PaginatedResult<ApiLeaveRequest>>('/requests/leave-requests', {
      query: params as Record<string, string | number | boolean | null | undefined>,
    }),

  get: (id: string) =>
    apiRequest<ApiLeaveRequest>(`/requests/leave-requests/${id}`),

  create: (body: CreateLeaveRequestNewDto) =>
    apiRequest<ApiLeaveRequest>('/requests/leave-requests', { method: 'POST', body }),

  update: (id: string, body: Partial<CreateLeaveRequestNewDto> & { updatedBy?: string }) =>
    apiRequest<ApiLeaveRequest>(`/requests/leave-requests/${id}`, { method: 'PATCH', body }),

  delete: (id: string) =>
    apiRequest<void>(`/requests/leave-requests/${id}`, { method: 'DELETE' }),

  decide: (id: string, body: LeaveDecisionDto) =>
    apiRequest<ApiLeaveRequest>(`/requests/leave-requests/${id}/decision`, {
      method: 'POST',
      body,
    }),

  cancel: (id: string, body?: { decisionNotesAr?: string; updatedBy?: string }) =>
    apiRequest<ApiLeaveRequest>(`/requests/leave-requests/${id}/cancel`, {
      method: 'POST',
      body: body ?? {},
    }),
};
