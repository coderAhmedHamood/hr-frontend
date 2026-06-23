import { create } from 'zustand';
import {
  correctionRequestsApi,
  type ApiCorrectionRequest,
  type CorrectionDecisionDto,
  type CorrectionRequestStatus,
} from './api/correction-requests';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import type { RequestApproverStatesSnapshot } from './api/request-approver-states-types';
import { normalizeRequestApproverStates } from './request-approver-states';

export type AttendanceCorrectionRequest = {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  /** Department display name returned by the backend (not an ID). */
  departmentNameAr: string;
  /** kept for UI compat — derived from requestTypeNameAr */
  requestTypeId: string;
  requestTypeNameAr: string;
  subtypeSlug: string | null;
  subtypeNameAr: string | null;
  attendanceDaySummaryId: string | null;
  workDate: string;
  previousCheckIn: string;
  previousCheckOut: string;
  correctedCheckIn: string;
  correctedCheckOut: string;
  previousStatusAr: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reasonAr: string;
  decisionNotesAr: string;
  submittedAt: string;
  cancelledAt: string | null;
  createdAt: string;
  decidedAt: string | null;
  decidedByEmployeeId: string | null;
  approverStates: RequestApproverStatesSnapshot | null;
};

function isoToTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toTimeString().slice(0, 5);
  } catch {
    return '';
  }
}

function dateTimeIso(workDate: string, time: string): string | undefined {
  if (!time) return undefined;
  // Include local timezone offset so backend stores the correct instant
  const d = new Date(`${workDate}T${time}:00`);
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const hh = String(Math.floor(Math.abs(off) / 60)).padStart(2, '0');
  const mm = String(Math.abs(off) % 60).padStart(2, '0');
  return `${workDate}T${time}:00${sign}${hh}:${mm}`;
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

export function mapCorrectionRequest(r: ApiCorrectionRequest): AttendanceCorrectionRequest {
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
    correctedCheckIn: isoToTime(r.correctedCheckInAt),
    correctedCheckOut: isoToTime(r.correctedCheckOutAt),
    previousStatusAr: translateAttendanceStatus(r.previousStatus),
    status: r.status as AttendanceCorrectionRequest['status'],
    reasonAr: r.reasonAr ?? '',
    decisionNotesAr: r.decisionNotesAr ?? '',
    submittedAt: r.submittedAt,
    cancelledAt: r.cancelledAt,
    createdAt: r.createdAt,
    decidedAt: r.decidedAt,
    decidedByEmployeeId: r.decidedByEmployeeId,
    approverStates: normalizeRequestApproverStates(r),
  };
}

interface State {
  items: AttendanceCorrectionRequest[];
  isLoading: boolean;
  error: string | null;
  fetch: (params?: { employeeId?: string; status?: string; workDateFrom?: string; workDateTo?: string }) => Promise<void>;
  submit: (input: {
    employeeId: string;
    requestTypeId: string;
    workDate: string;
    correctedCheckIn?: string;
    correctedCheckOut?: string;
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
      set({ items: result.items.map(mapCorrectionRequest), isLoading: false });
    } catch (e) {
      set({ error: (e as Error).message, isLoading: false });
    }
  },

  submit: async (input) => {
    const companyId = getDefaultCompanyId() ?? '';
    const userId = useAuthStore.getState().user?.id;
    if (!input.employeeId.trim()) return { ok: false, error: 'اختر الموظف.' };
    if (!input.requestTypeId.trim()) return { ok: false, error: 'اختر نوع الطلب.' };
    if (!input.workDate.trim()) return { ok: false, error: 'أدخل تاريخ اليوم.' };
    try {
      const created = await correctionRequestsApi.create({
        companyId,
        employeeId: input.employeeId,
        requestTypeId: input.requestTypeId,
        workDate: input.workDate,
        correctedCheckInAt: dateTimeIso(input.workDate, input.correctedCheckIn ?? ''),
        correctedCheckOutAt: dateTimeIso(input.workDate, input.correctedCheckOut ?? ''),
        reasonAr: input.reasonAr,
        createdBy: userId,
      });
      set(s => ({ items: [mapCorrectionRequest(created), ...s.items] }));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
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
  if (s === 'pending') return 'قيد الموافقة';
  if (s === 'approved') return 'معتمد';
  if (s === 'cancelled') return 'ملغى';
  return 'مرفوض';
}
