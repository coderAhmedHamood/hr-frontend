import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type { CheckInPointLinkResponseDto, CreateCheckInPointLinkDto, BulkCheckInPointLinkItem, BulkCreateCheckInPointLinkDto, BulkCreateCheckInPointLinkResponseDto, UpdateCheckInPointLinkDto, CheckInPointLinkListQuery, GroupedByPointEmployee, GroupedByPointItem, GroupedByPointQuery } from '@/features/hr/attendance/types/api/check-in-point-links';
export type { CheckInPointLinkResponseDto, CreateCheckInPointLinkDto, BulkCheckInPointLinkItem, BulkCreateCheckInPointLinkDto, BulkCreateCheckInPointLinkResponseDto, UpdateCheckInPointLinkDto, CheckInPointLinkListQuery, GroupedByPointEmployee, GroupedByPointItem, GroupedByPointQuery } from '@/features/hr/attendance/types/api/check-in-point-links';











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

