import type { RequestApproverStatesSnapshot } from '@/features/hr/requests/types/api/request-approver-states-types';

/** @deprecated Legacy mock shape — prefer the store/API `AttendanceCorrectionRequest` type below. */
export type AttendanceCorrectionRequestStatus = 'pending' | 'approved' | 'rejected';

export type AttendanceCorrectionPeriod = {
  periodId: string;
  checkInAt: string | null;
  checkOutAt: string | null;
};

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
  correctedPeriods: AttendanceCorrectionPeriod[];
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

/** أمثلة لحالات سابقة شائعة في السجل */
export const ATTENDANCE_PREVIOUS_STATUS_PRESETS: readonly { value: string; labelAr: string }[] = [
  { value: 'تأخر وصول', labelAr: 'تأخر وصول' },
  { value: 'انصراف مبكر', labelAr: 'انصراف مبكر' },
  { value: 'تسجيل ناقص (بدون خروج)', labelAr: 'تسجيل ناقص (بدون خروج)' },
  { value: 'تسجيل ناقص (بدون دخول)', labelAr: 'تسجيل ناقص (بدون دخول)' },
  { value: 'غياب مسجّل', labelAr: 'غياب مسجّل' },
  { value: 'تطابق الشفت', labelAr: 'تطابق الشفت' },
];
