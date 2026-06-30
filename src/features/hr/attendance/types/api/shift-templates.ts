import type { OrganizationArchiveScope } from '@/features/hr/organization/lib/archive-scope';

export type PeriodPayload = {
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
  archiveScope?: OrganizationArchiveScope;
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
