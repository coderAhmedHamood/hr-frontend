import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import type {
  ShiftTemplatePeriodResponse,
  ShiftTemplateWeekDayResponse,
  ShiftTemplateResponseDto,
  ShiftTemplateListQuery,
  CreateShiftTemplateDto,
  UpdateShiftTemplateDto,
} from '@/features/hr/attendance/types/api/shift-templates';

export type {
  ShiftTemplatePeriodResponse,
  ShiftTemplateWeekDayResponse,
  ShiftTemplateResponseDto,
  ShiftTemplateListQuery,
  CreateShiftTemplateDto,
  UpdateShiftTemplateDto,
  PeriodPayload,
} from '@/features/hr/attendance/types/api/shift-templates';

export const shiftTemplatesApi = {
  getAll(query?: ShiftTemplateListQuery) {
    return apiRequest<PaginatedResult<ShiftTemplateResponseDto>>('/attendance/shift-templates', { query });
  },
  getById(id: string) {
    return apiRequest<ShiftTemplateResponseDto>(`/attendance/shift-templates/${id}`);
  },
  create(payload: CreateShiftTemplateDto) {
    return apiRequest<ShiftTemplateResponseDto>('/attendance/shift-templates', { method: 'POST', body: payload });
  },
  update(id: string, payload: UpdateShiftTemplateDto) {
    return apiRequest<ShiftTemplateResponseDto>(`/attendance/shift-templates/${id}`, { method: 'PATCH', body: payload });
  },
  remove(id: string) {
    return apiRequest<void>(`/attendance/shift-templates/${id}`, { method: 'DELETE' });
  },
};
