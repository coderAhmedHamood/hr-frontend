/** طلب تصحيح حضور/انصراف (يرفعها الموظف ويعتمدها المعنّي) */

export type AttendanceCorrectionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AttendanceCorrectionRequest {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  departmentId: string;
  /** الشخص المتوقع أن يوافق على الطلب */
  approverId: string;
  approverNameAr: string;
  /** تاريخ اليوم الذي يخص التصحيح */
  workDate: string;
  /** وقت الحضور السابق كما في السجل */
  previousCheckIn: string;
  /** وقت الانصراف السابق كما في السجل */
  previousCheckOut: string;
  /** وقت الحضور بعد التصحيح المطلوب */
  correctedCheckIn: string;
  /** وقت الانصراف بعد التصحيح المطلوب */
  correctedCheckOut: string;
  /** الحالة السابقة للسجل (قبل التصحيح) */
  previousStatusAr: string;
  status: AttendanceCorrectionRequestStatus;
  reasonAr: string;
  createdAt: string;
  decidedAt?: string;
}

/** أمثلة لحالات سابقة شائعة في السجل */
export const ATTENDANCE_PREVIOUS_STATUS_PRESETS: readonly { value: string; labelAr: string }[] = [
  { value: 'تأخر وصول', labelAr: 'تأخر وصول' },
  { value: 'انصراف مبكر', labelAr: 'انصراف مبكر' },
  { value: 'تسجيل ناقص (بدون خروج)', labelAr: 'تسجيل ناقص (بدون خروج)' },
  { value: 'تسجيل ناقص (بدون دخول)', labelAr: 'تسجيل ناقص (بدون دخول)' },
  { value: 'غياب مسجّل', labelAr: 'غياب مسجّل' },
  { value: 'تطابق الشفت', labelAr: 'تطابق الشفت' },
];
