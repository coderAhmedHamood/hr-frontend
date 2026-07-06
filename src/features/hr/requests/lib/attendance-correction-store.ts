export type { AttendanceCorrectionPeriod, AttendanceCorrectionRequest } from '@/features/hr/requests/types/attendance-correction';

import { create } from 'zustand';
import {
  correctionRequestsApi,
  type ApiCorrectionRequest,
  type CorrectionDecisionDto,
  type CorrectionRequestStatus,
} from './api/correction-requests';
import { ApiError } from '@/features/hr/lib/api/client';
import { translateCorrectionRequestError } from '@/features/hr/requests/attendance-corrections/lib/correction-request-errors';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import type { RequestApprovalAssignmentCatalogDto } from './api/correction-requests';
import type { RequestApproverStatesSnapshot } from './api/request-approver-states-types';
import { buildRequestApproverStatesFromListItem, normalizeRequestApproverStates } from './request-approver-states';
import type {
  AttendanceCorrectionPeriod,
  AttendanceCorrectionRequest,
} from '@/features/hr/requests/types/attendance-correction';
import { correctionRequestStatusLabelAr } from '@/shared/i18n/ar';



function isoToTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toTimeString().slice(0, 5);
  } catch {
    return '';
  }
}

const ATTENDANCE_STATUS_AR: Record<string, string> = {
  present:     'حاضر',
  late:        'متأخر',
  absent:      'غائب',
  early_leave: 'انصراف مبكر',
  'early-leave': 'انصراف مبكر',
  on_leave:    'إجازة',
  'on-leave':  'إجازة',
  holiday:     'عطلة رسمية',
  weekend:     'يوم راحة',
  rest_day:    'يوم راحة',
  unscheduled: 'غير مجدول',
  no_record:   'لا يوجد سجل',
};

function translateAttendanceStatus(s: string | null | undefined): string {
  if (!s) return '—';
  return ATTENDANCE_STATUS_AR[s] ?? s;
}

function resolvePeriodPunches(
  side: 'recorded' | 'corrected',
  p: NonNullable<ApiCorrectionRequest['correctedTimes']>['periods'][number],
): { checkInAt: string | null; checkOutAt: string | null } {
  const nested = p[side];
  if (nested) {
    return {
      checkInAt: nested.checkInAt ?? null,
      checkOutAt: nested.checkOutAt ?? null,
    };
  }
  if (side === 'corrected') {
    return {
      checkInAt: p.checkInAt ?? null,
      checkOutAt: p.checkOutAt ?? null,
    };
  }
  return { checkInAt: null, checkOutAt: null };
}

function mapCorrectedPeriods(r: ApiCorrectionRequest): AttendanceCorrectionPeriod[] {
  const fromNew = r.correctedTimes?.periods;
  if (fromNew?.length) {
    return fromNew.map((p) => {
      const recorded = resolvePeriodPunches('recorded', p);
      const corrected = resolvePeriodPunches('corrected', p);
      return {
        periodId: p.periodId,
        recordedCheckInAt: recorded.checkInAt,
        recordedCheckOutAt: recorded.checkOutAt,
        checkInAt: corrected.checkInAt,
        checkOutAt: corrected.checkOutAt,
      };
    });
  }

  if (r.correctedCheckInAt || r.correctedCheckOutAt) {
    return [{
      periodId: 'period-1',
      recordedCheckInAt: r.previousCheckInAt ?? null,
      recordedCheckOutAt: r.previousCheckOutAt ?? null,
      checkInAt: r.correctedCheckInAt,
      checkOutAt: r.correctedCheckOutAt,
    }];
  }

  return [];
}

function resolveCorrectionApproverStates(
  r: ApiCorrectionRequest,
  approvalCatalog?: RequestApprovalAssignmentCatalogDto[],
): RequestApproverStatesSnapshot | null {
  if (approvalCatalog?.length) {
    const fromList = buildRequestApproverStatesFromListItem(
      {
        approvalAssignmentId: r.approvalAssignmentId ?? null,
        approverDecisions: r.approverDecisions ?? null,
      },
      approvalCatalog,
    );
    if (fromList) return fromList;
  }
  return normalizeRequestApproverStates(r);
}

export function mapCorrectionRequest(
  r: ApiCorrectionRequest,
  approvalCatalog?: RequestApprovalAssignmentCatalogDto[],
): AttendanceCorrectionRequest {
  const correctedPeriods = mapCorrectedPeriods(r);
  const firstPeriod = correctedPeriods[0];

  return {
    id: r.id,
    employeeId: r.employeeId,
    employeeNameAr: r.employeeNameAr,
    departmentNameAr: r.departmentNameAr ?? '',
    requestTypeId: r.requestTypeId,
    requestTypeNameAr: r.requestTypeNameAr,
    subtypeSlug: r.subtypeSlug,
    subtypeNameAr: r.subtypeNameAr,
    attendanceDaySummaryId: r.attendanceDaySummaryId,
    workDate: r.workDate,
    previousCheckIn: isoToTime(r.previousCheckInAt),
    previousCheckOut: isoToTime(r.previousCheckOutAt),
    correctedCheckIn: isoToTime(firstPeriod?.checkInAt ?? r.correctedCheckInAt),
    correctedCheckOut: isoToTime(firstPeriod?.checkOutAt ?? r.correctedCheckOutAt),
    correctedPeriods,
    previousStatusAr: translateAttendanceStatus(r.previousStatus),
    status: r.status as AttendanceCorrectionRequest['status'],
    reasonAr: r.reasonAr ?? '',
    decisionNotesAr: r.decisionNotesAr ?? '',
    submittedAt: r.submittedAt,
    cancelledAt: r.cancelledAt,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    decidedByEmployeeId: r.decidedByEmployeeId,
    approverStates: resolveCorrectionApproverStates(r, approvalCatalog),
  };
}

interface State {
  items: AttendanceCorrectionRequest[];
  isLoading: boolean;
  error: { message: string; status: number } | null;
  fetch: (params?: { employeeId?: string; status?: string; workDateFrom?: string; workDateTo?: string }) => Promise<void>;
  submit: (input: {
    employeeId: string;
    requestTypeId: string;
    workDate: string;
    attendanceDaySummaryId?: string;
    subtypeSlug?: string;
    periods: Array<{
      periodId: string;
      checkInAt: string | null;
      checkOutAt: string | null;
    }>;
    reasonAr?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  approve: (id: string, payload: CorrectionDecisionDto) => Promise<void>;
  reject: (id: string, payload: CorrectionDecisionDto) => Promise<void>;
  cancel: (id: string, notes?: string) => Promise<void>;
}

export const useAttendanceCorrectionRequestsStore = create<State>()((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetch: async (params) => {
    const companyId = getDefaultCompanyId();
    if (!companyId) return;
    set({ isLoading: true, error: null });
    try {
      const result = await correctionRequestsApi.list({ companyId, limit: 200, ...params });
      set({ items: result.items.map((r) => mapCorrectionRequest(r, result.approvalAssignments)), isLoading: false });
    } catch (e) {
      set({ error: { message: (e as Error).message, status: e instanceof ApiError ? e.status : 0 }, isLoading: false });
    }
  },

  submit: async (input) => {
    const companyId = getDefaultCompanyId() ?? '';
    const userId = useAuthStore.getState().user?.id;
    if (!input.employeeId.trim()) return { ok: false, error: 'اختر الموظف.' };
    if (!input.requestTypeId.trim()) return { ok: false, error: 'اختر نوع الطلب.' };
    if (!input.workDate.trim()) return { ok: false, error: 'أدخل تاريخ اليوم.' };

    const hasCorrectedPunch = input.periods.some(
      (p) => p.checkInAt || p.checkOutAt,
    );
    if (!hasCorrectedPunch) {
      return { ok: false, error: 'أدخل وقت حضور أو انصراف مصحّحاً لفترة واحدة على الأقل.' };
    }

    const reasonAr = input.reasonAr?.trim() ?? '';
    if (reasonAr.length < 3) {
      return { ok: false, error: 'سبب الطلب مطلوب (٣ أحرف على الأقل).' };
    }

    try {
      const created = await correctionRequestsApi.create({
        companyId,
        employeeId: input.employeeId,
        requestTypeId: input.requestTypeId,
        workDate: input.workDate,
        ...(input.attendanceDaySummaryId ? { attendanceDaySummaryId: input.attendanceDaySummaryId } : {}),
        ...(input.subtypeSlug ? { subtypeSlug: input.subtypeSlug } : {}),
        correctedTimes: {
          periods: input.periods.map((p) => ({
            periodId: p.periodId,
            checkInAt: p.checkInAt,
            checkOutAt: p.checkOutAt,
          })),
        },
        reasonAr,
        createdBy: userId,
      });
      set(s => ({ items: [mapCorrectionRequest(created), ...s.items] }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: translateCorrectionRequestError(e) };
    }
  },

  approve: async (id, payload) => {
    const updated = await correctionRequestsApi.decide(id, payload);
    set(s => ({ items: s.items.map(r => r.id === id ? mapCorrectionRequest(updated) : r) }));
  },

  reject: async (id, payload) => {
    const updated = await correctionRequestsApi.decide(id, payload);
    set(s => ({ items: s.items.map(r => r.id === id ? mapCorrectionRequest(updated) : r) }));
  },

  cancel: async (id, notes) => {
    const userId = useAuthStore.getState().user?.id ?? '';
    const updated = await correctionRequestsApi.cancel(id, { decisionNotesAr: notes, updatedBy: userId });
    set(s => ({ items: s.items.map(r => r.id === id ? mapCorrectionRequest(updated) : r) }));
  },
}));

export function attendanceCorrectionStatusLabelAr(s: AttendanceCorrectionRequest['status']): string {
  return correctionRequestStatusLabelAr(s);
}
