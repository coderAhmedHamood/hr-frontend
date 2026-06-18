import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';

export function validateCheckpointDraft(draft: AttendanceCheckInPoint): string | null {
  if (!draft.nameAr.trim()) return 'اسم النقطة بالعربية مطلوب';
  if (draft.latitude < -90 || draft.latitude > 90) return 'خط العرض خارج النطاق';
  if (draft.longitude < -180 || draft.longitude > 180) return 'خط الطول خارج النطاق';
  if (draft.radiusMeters < 10) return 'نصف القطر يجب أن يكون 10 أمتار على الأقل';
  return null;
}
