import { apiRequest } from '@/features/hr/lib/api/client';
import type {
  OvertimeRequestResponseDto,
  OvertimeRequestListResponseDto,
  OvertimeRequestListQuery,
  CreateOvertimeRequestDto,
  UpdateOvertimeRequestDto,
  DecideOvertimeRequestDto,
  CancelOvertimeRequestDto,
} from '@/features/hr/requests/types/api/overtime-requests';

export type {
  OvertimeRequestResponseDto,
  OvertimeRequestListItemDto,
  OvertimeRequestListResponseDto,
  OvertimeRequestListQuery,
  OvertimeRequestStatusDto,
  CreateOvertimeRequestDto,
  UpdateOvertimeRequestDto,
  DecideOvertimeRequestDto,
  CancelOvertimeRequestDto,
  RequestApprovalAssignmentCatalogDto,
  RequestApprovalAssignmentResponseDto,
} from '@/features/hr/requests/types/api/overtime-requests';

export const overtimeRequestsApi = {
  list: (params?: OvertimeRequestListQuery) =>
    apiRequest<OvertimeRequestListResponseDto>('/requests/overtime-requests', {
      query: params as Record<string, string | number | boolean | null | undefined | string[]>,
    }),

  get: (id: string) =>
    apiRequest<OvertimeRequestResponseDto>(`/requests/overtime-requests/${id}`),

  create: (body: CreateOvertimeRequestDto) =>
    apiRequest<OvertimeRequestResponseDto>('/requests/overtime-requests', { method: 'POST', body }),

  update: (id: string, body: UpdateOvertimeRequestDto) =>
    apiRequest<OvertimeRequestResponseDto>(`/requests/overtime-requests/${id}`, { method: 'PATCH', body }),

  decide: (id: string, body: DecideOvertimeRequestDto) =>
    apiRequest<OvertimeRequestResponseDto>(`/requests/overtime-requests/${id}/decision`, {
      method: 'POST',
      body,
    }),

  cancel: (id: string, body?: CancelOvertimeRequestDto) =>
    apiRequest<OvertimeRequestResponseDto>(`/requests/overtime-requests/${id}/cancel`, {
      method: 'POST',
      body: body ?? {},
    }),

  remove: (id: string) =>
    apiRequest<void>(`/requests/overtime-requests/${id}`, { method: 'DELETE' }),
};
