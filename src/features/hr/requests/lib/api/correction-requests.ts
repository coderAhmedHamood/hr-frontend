import { apiRequest } from '@/features/hr/lib/api/client';
import { toRequestDecisionApiBody } from '@/features/hr/requests/lib/request-approver-states';
import type { RequestApproverStatesSnapshot } from '@/features/hr/requests/types/api/request-approver-states-types';
export type { CorrectionRequestStatus, CorrectionPeriodTimeDto, CorrectionTimesDto, ApiCorrectionRequest, ApiCorrectionRequestListResponse, CreateCorrectionRequestDto, UpdateCorrectionRequestDto, CorrectionDecisionDto, CorrectionCancelDto, LeaveRequestStatusNew, ApiLeaveRequest, ApiLeaveRequestListResponse, CreateLeaveRequestNewDto, LeaveDecisionDto, RequestApprovalAssignmentCatalogDto } from '@/features/hr/requests/types/api/correction-requests';
import type { CorrectionRequestStatus, CorrectionPeriodTimeDto, CorrectionTimesDto, ApiCorrectionRequest, ApiCorrectionRequestListResponse, CreateCorrectionRequestDto, UpdateCorrectionRequestDto, CorrectionDecisionDto, CorrectionCancelDto, LeaveRequestStatusNew, ApiLeaveRequest, ApiLeaveRequestListResponse, CreateLeaveRequestNewDto, LeaveDecisionDto } from '@/features/hr/requests/types/api/correction-requests';









export const correctionRequestsApi = {
  list: (params?: {
    companyId?: string;
    employeeId?: string;
    employeeIds?: string[];
    departmentId?: string;
    requestTypeId?: string;
    status?: string;
    workDateFrom?: string;
    workDateTo?: string;
    page?: number;
    limit?: number;
  }) =>
    apiRequest<ApiCorrectionRequestListResponse>('/requests/correction-requests', {
      query: params as Record<string, string | number | boolean | null | undefined | string[]>,
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
      body: toRequestDecisionApiBody(body),
    }),

  cancel: (id: string, body?: CorrectionCancelDto) =>
    apiRequest<ApiCorrectionRequest>(`/requests/correction-requests/${id}/cancel`, {
      method: 'POST',
      body: body ?? {},
    }),
};

// Also wire up the new leave-requests endpoint (matches Swagger /requests/leave-requests)




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
    apiRequest<ApiLeaveRequestListResponse>('/requests/leave-requests', {
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
      body: toRequestDecisionApiBody(body),
    }),

  cancel: (id: string, body?: { decisionNotesAr?: string; updatedBy?: string }) =>
    apiRequest<ApiLeaveRequest>(`/requests/leave-requests/${id}/cancel`, {
      method: 'POST',
      body: body ?? {},
    }),
};

