import type { ShiftPeriod, ShiftTemplate, WeekDayIndex } from '@/features/hr/attendance/lib/types';
import { DAY_LABELS } from '@/features/hr/attendance/templates/constants/shift-templates-ui';

export function toMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(':').map(Number);
  return h * 60 + m;
}

export function fmtMin(totalMin: number): string {
  const safe = ((totalMin % 1440) + 1440) % 1440;
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

/** قيمة `<input type="time" />` → `HH:mm` للتخزين */
export function normalizeTimeInput(raw: string): string {
  if (!raw?.trim()) return '00:00';
  const [hPart = '0', mPart = '0'] = raw.split(':');
  const h = Math.min(23, Math.max(0, parseInt(hPart, 10) || 0));
  const m = Math.min(59, Math.max(0, parseInt(mPart, 10) || 0));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function summarizeTemplate(t: ShiftTemplate): string {
  const workDays = t.weekDays.filter((d) => !d.isRest).length;
  const sample = t.weekDays.find((d) => !d.isRest && d.periods.length > 0);
  if (!sample) return `${workDays} أيام عمل`;
  const p = sample.periods[0];
  return `${workDays} أيام · ${p.startTime} – ${p.endTime}`;
}

export function cloneTemplate(t: ShiftTemplate): ShiftTemplate {
  return JSON.parse(JSON.stringify(t)) as ShiftTemplate;
}

export function validateTemplate(t: ShiftTemplate): string | null {
  if (!t.nameAr.trim()) return 'اسم القالب مطلوب';
  const workDays = t.weekDays.filter((d) => !d.isRest);
  if (workDays.length === 0) return 'يجب تحديد يوم عمل واحد على الأقل';
  for (const d of workDays) {
    for (const p of d.periods) {
      const [sh, sm] = p.startTime.split(':').map(Number);
      const [eh, em] = p.endTime.split(':').map(Number);
      if (eh * 60 + em <= sh * 60 + sm)
        return `${DAY_LABELS[d.day]}: وقت النهاية يجب أن يكون بعد بداية الدوام`;
      if (p.breakEnabled) {
        const [bh, bm] = p.breakStart.split(':').map(Number);
        const [xh, xm] = p.breakEnd.split(':').map(Number);
        const a = sh * 60 + sm;
        const b = eh * 60 + em;
        const bs = bh * 60 + bm;
        const be = xh * 60 + xm;
        if (bs < a || be > b || be <= bs)
          return `${DAY_LABELS[d.day]}: أوقات الاستراحة يجب أن تقع داخل فترة العمل`;
      }
    }
  }
  return null;
}

export function durationLabel(start: string, end: string): string {
  const d = toMinutes(end) - toMinutes(start);
  if (d <= 0) return '';
  const h = Math.floor(d / 60);
  const m = d % 60;
  return m > 0 ? `${h}س ${m}د` : `${h}س`;
}
