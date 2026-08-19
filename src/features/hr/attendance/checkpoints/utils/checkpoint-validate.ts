import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { CHECKPOINT_RADIUS_MIN_METERS } from '@/features/hr/attendance/checkpoints/constants/checkpoints-panel';

export function validateCheckpointDraft(draft: AttendanceCheckInPoint): string | null {
  if (!draft.nameAr.trim()) return 'اسم النقطة بالعربية مطلوب';
  if (draft.latitude < -90 || draft.latitude > 90) return 'خط العرض خارج النطاق';
  if (draft.longitude < -180 || draft.longitude > 180) return 'خط الطول خارج النطاق';
  if (draft.radiusMeters < CHECKPOINT_RADIUS_MIN_METERS) {
    return `نصف القطر يجب أن يكون ${CHECKPOINT_RADIUS_MIN_METERS} أمتار على الأقل`;
  }
  return null;
}

/** Accepts "24.711515" or Arabic/Latin decimals while typing. */
export function parseCoordInput(raw: string, min: number, max: number): number | null {
  const t = raw.trim().replace(/[،]/g, '.').replace(',', '.');
  if (!/^-?\d+(?:\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return parseFloat(n.toFixed(6));
}

/** Paste "lat, lng" (comma, semicolon, or space). */
export function parseLatLngPair(raw: string): { latitude: number; longitude: number } | null {
  const t = raw.trim().replace(/[،]/g, ',');
  const parts = t.split(/[,;\s]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const latitude = parseCoordInput(parts[0]!, -90, 90);
  const longitude = parseCoordInput(parts[1]!, -180, 180);
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}
