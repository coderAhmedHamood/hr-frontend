import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

export type ShiftTemplatePeriodResponse = {
  id: string;
  startTime: string;
  endTime: string;
  breakEnabled: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  flexibilityEnabled: boolean;
  flexibilityMinutes: number | null;
  checkIn: { beforeStartMinutes: number; graceMinutes: number; afterStartMinutes: number };
  checkOut: { beforeEndMinutes: number; allowedShortageMinutes: number; afterEndMinutes: number };
  checkOutNotRequired: boolean;
  autoOvertime: boolean;
  strictMode: boolean;
  strictPenaltyWarning: boolean;
  strictPenaltyBalanceEnabled: boolean;
  strictPenaltyBalanceDays: number;
};

export type ShiftTemplateWeekDayResponse = {
  day: number;
  isRest: boolean;
  periods: ShiftTemplatePeriodResponse[];
};

export type ShiftTemplateResponseDto = {
  id: string;
  companyId: string;
  nameAr: string;
  nameEn: string | null;
  colorHex: string;
  effectiveFrom: string;
  isActive: boolean;
  weekDays: ShiftTemplateWeekDayResponse[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type ShiftTemplateListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  isActive?: boolean;
};

type PeriodPayload = {
  startTime: string;
  endTime: string;
  breakEnabled?: boolean;
  breakStart?: string | null;
  breakEnd?: string | null;
  flexibilityEnabled?: boolean;
  flexibilityMinutes?: number | null;
  checkIn?: { beforeStartMinutes?: number; graceMinutes?: number; afterStartMinutes?: number };
  checkOut?: { beforeEndMinutes?: number; allowedShortageMinutes?: number; afterEndMinutes?: number };
  checkOutNotRequired?: boolean;
  autoOvertime?: boolean;
  strictMode?: boolean;
  strictPenaltyWarning?: boolean;
  strictPenaltyBalanceEnabled?: boolean;
  strictPenaltyBalanceDays?: number;
};

export type CreateShiftTemplateDto = {
  companyId: string;
  nameAr: string;
  nameEn?: string | null;
  colorHex?: string;
  effectiveFrom: string;
  isActive?: boolean;
  weekDays: Array<{ day: number; isRest: boolean; periods: PeriodPayload[] }>;
};

export type UpdateShiftTemplateDto = Partial<Omit<CreateShiftTemplateDto, 'companyId'>>;

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
