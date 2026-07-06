'use client';

import * as React from 'react';
import {
  CalendarDays,
  LogIn,
  LogOut,
  Plus,
  Coffee,
  Loader2,
  ShieldAlert,
  Layers,
  Lock,
  Unlink,
  Wrench,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DailyRegisterEventDialog } from '@/features/hr/attendance/daily/components/daily-register-event-dialog';
import { cn } from '@/shared/utils';
import type { AttendanceDaySummary } from '@/features/hr/attendance/lib/types';
import {
  attendanceEventsApi,
  type AttendanceEventResponseDto,
  type AttendanceEventType,
  type DailyBreakdownPeriod,
  type DailyBreakdownResponseDto,
} from '@/features/hr/attendance/lib/api/attendance-events';
import { STATUS } from '@/features/hr/attendance/daily/constants/daily-attendance-status';
import { fmtFull, minutesToHHMM } from '@/features/hr/attendance/daily/utils/daily-attendance-format';
import {
  AttendancePunchPair,
  durationBetweenIso,
  formatMinutesAr,
} from '@/features/hr/attendance/components/attendance-punch-pair';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { DailyShiftCorrectionDialog } from '@/features/hr/attendance/daily/components/daily-shift-correction-dialog';

export const WEEKDAY_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const BREAKDOWN_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  present: STATUS.present,
  late: STATUS.late,
  absent: STATUS.absent,
  partial: STATUS.partial,
  early_leave: STATUS.early_leave,
  rest_day: STATUS.rest_day,
  unscheduled: STATUS.unscheduled,
};

const EVENT_META: Record<AttendanceEventType, { labelAr: string; icon: React.ElementType; color: string }> = {
  check_in: { labelAr: 'دخول', icon: LogIn, color: 'text-emerald-600' },
  check_out: { labelAr: 'خروج', icon: LogOut, color: 'text-sky-600' },
  break_start: { labelAr: 'بداية استراحة', icon: Coffee, color: 'text-amber-600' },
  break_end: { labelAr: 'نهاية استراحة', icon: Coffee, color: 'text-orange-600' },
};

export function defaultTimezoneOffsetMinutes() {
  return -new Date().getTimezoneOffset();
}

function fmtClock(iso: string | null | undefined, offsetMinutes: number) {
  if (!iso) return '—';
  const localMs = new Date(iso).getTime() + offsetMinutes * 60_000;
  const h24 = new Date(localMs).getUTCHours();
  const mm = String(new Date(localMs).getUTCMinutes()).padStart(2, '0');
  const period = h24 < 12 ? 'ص' : 'م';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${period}`;
}

function fmtClockRange(from: string | null | undefined, to: string | null | undefined, offsetMinutes: number) {
  if (!from && !to) return '—';
  if (from && to) return `${fmtClock(from, offsetMinutes)} — ${fmtClock(to, offsetMinutes)}`;
  return fmtClock(from ?? to, offsetMinutes);
}

function trimTime(t: string) {
  return t.slice(0, 5);
}

function formatWallClock12(t: string | null | undefined) {
  if (!t) return '—';
  const match = t.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimTime(t);
  const h24 = Number(match[1]);
  const mm = match[2];
  const period = h24 < 12 ? 'ص' : 'م';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${period}`;
}

export function statusCfg(status: string) {
  return BREAKDOWN_STATUS[status] ?? STATUS.unscheduled;
}

type PeriodActual = DailyBreakdownPeriod['actual'];

function punchAt(
  events: AttendanceEventResponseDto[],
  type: 'check_in' | 'check_out',
  last: boolean,
): string | null {
  const list = events
    .filter((e) => !e.isVoided && e.eventType === type)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  return (last ? list[list.length - 1] : list[0])?.occurredAt ?? null;
}

/** Period actual from daily-breakdown only (actual, period events, unmatched when single period). */
function resolvePeriodActualDisplay(
  period: DailyBreakdownPeriod,
  unmatchedEvents: AttendanceEventResponseDto[],
  singlePeriod: boolean,
): PeriodActual {
  const { actual } = period;

  let checkInAt = actual.checkInAt ?? punchAt(period.events, 'check_in', false);
  let checkOutAt = actual.checkOutAt ?? punchAt(period.events, 'check_out', true);

  if (singlePeriod) {
    if (!checkInAt) checkInAt = punchAt(unmatchedEvents, 'check_in', false);
    if (!checkOutAt) checkOutAt = punchAt(unmatchedEvents, 'check_out', true);
  }

  return { ...actual, checkInAt, checkOutAt };
}

export function ActualRegistrationBlock({
  actual,
  offsetMinutes,
}: {
  actual: PeriodActual;
  offsetMinutes: number;
}) {
  const duration =
    formatMinutesAr(actual.workedMinutes) ??
    durationBetweenIso(actual.checkInAt, actual.checkOutAt);

  return (
    <div className="space-y-2.5 rounded-lg border border-border/50 bg-muted/10 p-3">
      <p className="text-[11px] font-semibold text-muted-foreground">التسجيل الفعلي</p>
      <AttendancePunchPair
        checkInTime={fmtClock(actual.checkInAt, offsetMinutes)}
        checkOutTime={fmtClock(actual.checkOutAt, offsetMinutes)}
        duration={duration}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-xs">
          <span className="text-muted-foreground">مدة العمل</span>
          <span className="font-semibold tabular-nums">{minutesToHHMM(actual.workedMinutes)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/60 px-3 py-2 text-xs">
          <span className="text-muted-foreground">استراحات</span>
          <span className="font-semibold tabular-nums">{minutesToHHMM(actual.breakMinutes)}</span>
        </div>
      </div>
    </div>
  );
}

/** Day-level actual when breakdown has no periods — from daily-breakdown unmatched + totals only. */
export function resolveDayActualWithoutPeriods(
  breakdown: DailyBreakdownResponseDto,
): PeriodActual | null {
  const checkInAt = punchAt(breakdown.unmatchedEvents, 'check_in', false);
  const checkOutAt = punchAt(breakdown.unmatchedEvents, 'check_out', true);
  const workedMinutes = breakdown.totals.workedMinutes;

  if (!checkInAt && !checkOutAt && workedMinutes === 0) return null;

  return {
    checkInAt,
    checkOutAt,
    checkInEventId: null,
    checkOutEventId: null,
    breakStartAt: null,
    breakEndAt: null,
    breakMinutes: breakdown.totals.breakMinutes,
    workedMinutes,
  };
}

export function StatChip({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warn' | 'danger' | 'success';
}) {
  const toneClass =
    tone === 'warn'
      ? 'text-warning'
      : tone === 'danger'
        ? 'text-destructive'
        : tone === 'success'
          ? 'text-success'
          : 'text-foreground';
  return (
    <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', toneClass)}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="text-left">
        <span className="font-medium tabular-nums">{value}</span>
        {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground/80">{hint}</p> : null}
      </div>
    </div>
  );
}

export function EventRow({ evt, offsetMinutes }: { evt: AttendanceEventResponseDto; offsetMinutes: number }) {
  const meta = EVENT_META[evt.eventType];
  const Icon = meta.icon;
  const warning = evt.warningMessage ?? evt.exclusionMessage;
  return (
    <div className="rounded-lg border border-border/60 bg-background px-2.5 py-2">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.color)} />
        <span className="flex-1 text-xs">{meta.labelAr}</span>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground" dir="ltr">
          {fmtClock(evt.occurredAt, offsetMinutes)}
        </span>
        {evt.source === 'manual_hr' ? (
          <span className="text-[10px] text-muted-foreground/60">يدوي</span>
        ) : null}
      </div>
      {evt.checkInPointNameAr ? (
        <p className="mt-1 text-[10px] text-muted-foreground">{evt.checkInPointNameAr}</p>
      ) : null}
      {evt.isExcludedFromComputation ? (
        <p className="mt-1 text-[10px] text-amber-700">مُستبعد من الحساب</p>
      ) : null}
      {warning ? (
        <p className="mt-1 text-[10px] text-amber-700">{warning}</p>
      ) : null}
      {evt.notes ? (
        <p className="mt-1 text-[10px] text-muted-foreground/80">{evt.notes}</p>
      ) : null}
    </div>
  );
}

function WindowStatusBadge({
  label,
  value,
}: {
  label: string;
  value: boolean | null | undefined;
}) {
  if (value == null) {
    return (
      <span className="rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground">
        {label}: —
      </span>
    );
  }
  return (
    <span
      className={cn(
        'rounded-md border px-2 py-1 text-[10px] font-medium',
        value
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-destructive/30 bg-destructive/10 text-destructive',
      )}
    >
      {label}: {value ? 'ضمن النافذة' : 'خارج النافذة'}
    </span>
  );
}

export function PeriodCard({
  period,
  index,
  offsetMinutes,
  unmatchedEvents,
  singlePeriod,
}: {
  period: DailyBreakdownPeriod;
  index: number;
  offsetMinutes: number;
  unmatchedEvents: AttendanceEventResponseDto[];
  singlePeriod: boolean;
}) {
  const { expected, analysis, events } = period;
  const displayActual = resolvePeriodActualDisplay(period, unmatchedEvents, singlePeriod);
  const cfg = statusCfg(analysis.status);
  const periodLabel = period.expected.sortOrder === 0 && index === 0 ? 'الفترة' : `الفترة ${index + 1}`;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-semibold">{periodLabel}</span>
          <span className="text-xs text-muted-foreground" >
            {formatWallClock12(expected.startTime)} — {formatWallClock12(expected.endTime)}
          </span>
        </div>
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', cfg.color)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
          {cfg.label}
        </span>
      </div>

      {expected.strictMode ? (
        <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-700">
          <ShieldAlert className="h-3 w-3 shrink-0" />
          دوام صارم — البصمات يجب أن تكون ضمن النوافذ المسموحة
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {expected.flexibilityEnabled ? (
          <span className="rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground">
            سماحية {expected.flexibilityMinutes ?? 0} د
          </span>
        ) : null}
        {expected.checkOutNotRequired ? (
          <span className="rounded-md border border-border/50 bg-muted/20 px-2 py-1 text-[10px] text-muted-foreground">
            الخروج غير مطلوب
          </span>
        ) : null}
        {expected.autoOvertime ? (
          <span className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[10px] text-success">
            إضافي تلقائي
          </span>
        ) : null}
      </div>

      <div className="grid gap-2 rounded-lg border border-border/50 bg-muted/10 p-2.5">
        <p className="text-[11px] font-semibold text-muted-foreground">الدوام المتوقع</p>
        <DetailRow
          label="بداية / نهاية"
          value={fmtClockRange(expected.startAt, expected.endAt, offsetMinutes)}
        />
        <DetailRow label="المدة" value={minutesToHHMM(expected.durationMinutes)} />
        <DetailRow
          label="نافذة الدخول"
          value={fmtClockRange(expected.checkInWindowStartAt, expected.checkInWindowEndAt, offsetMinutes)}
          hint={`قبل ${expected.checkInWindow.beforeStartMinutes} د · سماح ${expected.checkInWindow.graceMinutes} د · بعد ${expected.checkInWindow.afterStartMinutes} د`}
        />
        <DetailRow
          label="حد التأخير"
          value={fmtClock(expected.lateThresholdAt, offsetMinutes)}
        />
        <DetailRow
          label="نافذة الخروج"
          value={fmtClockRange(expected.checkOutWindowStartAt, expected.checkOutWindowEndAt, offsetMinutes)}
          hint={`قبل ${expected.checkOutWindow.beforeEndMinutes} د · نقص مسموح ${expected.checkOutWindow.allowedShortageMinutes} د · بعد ${expected.checkOutWindow.afterEndMinutes} د`}
        />
        <DetailRow
          label="حد الانصراف المبكر"
          value={fmtClock(expected.earlyLeaveThresholdAt, offsetMinutes)}
        />
        {expected.breakEnabled ? (
          <DetailRow
            label="استراحة مجدولة"
            value={`${expected.breakStart ? trimTime(expected.breakStart) : '—'} — ${expected.breakEnd ? trimTime(expected.breakEnd) : '—'}`}
          />
        ) : null}
      </div>

      <ActualRegistrationBlock actual={displayActual} offsetMinutes={offsetMinutes} />

      <div className="flex flex-wrap gap-1.5">
        <WindowStatusBadge label="دخول" value={analysis.checkInWithinWindow} />
        <WindowStatusBadge label="خروج" value={analysis.checkOutWithinWindow} />
        {analysis.isComplete ? (
          <span className="rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
            مكتمل
          </span>
        ) : null}
        {analysis.isAbsent ? (
          <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive">
            غائب
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {analysis.rawLateMinutes > 0 ? (
          <StatChip
            label={analysis.lateMinutes > 0 ? 'تأخير خام' : 'تأخير ضمن السماحية'}
            value={minutesToHHMM(analysis.rawLateMinutes)}
            tone={analysis.lateMinutes > 0 ? 'warn' : 'default'}
          />
        ) : null}
        {analysis.lateMinutes > 0 ? (
          <StatChip label="تأخير" value={minutesToHHMM(analysis.lateMinutes)} tone="warn" />
        ) : null}
        {analysis.rawEarlyLeaveMinutes > 0 ? (
          <StatChip
            label={analysis.earlyLeaveMinutes > 0 ? 'انصراف مبكر خام' : 'انصراف مبكر ضمن السماحية'}
            value={minutesToHHMM(analysis.rawEarlyLeaveMinutes)}
            tone={analysis.earlyLeaveMinutes > 0 ? 'warn' : 'default'}
          />
        ) : null}
        {analysis.earlyLeaveMinutes > 0 ? (
          <StatChip label="انصراف مبكر" value={minutesToHHMM(analysis.earlyLeaveMinutes)} tone="warn" />
        ) : null}
        {analysis.overtimeMinutes > 0 ? (
          <StatChip label="إضافي" value={minutesToHHMM(analysis.overtimeMinutes)} tone="success" />
        ) : null}
        {analysis.shortageMinutes > 0 ? (
          <StatChip label="نقص" value={minutesToHHMM(analysis.shortageMinutes)} tone="danger" />
        ) : null}
        {analysis.earlyArrivalMinutes > 0 ? (
          <StatChip label="حضور مبكر" value={minutesToHHMM(analysis.earlyArrivalMinutes)} />
        ) : null}
      </div>

      {(analysis.checkInBeforeWindow ||
        analysis.checkInAfterWindow ||
        analysis.checkOutBeforeWindow ||
        analysis.checkOutAfterWindow ||
        analysis.strictModeViolation) && (
        <div className="space-y-1 rounded-lg border border-destructive/25 bg-destructive/5 p-2.5 text-[11px] text-destructive">
          {analysis.checkInBeforeWindow ? <p>• الدخول قبل نافذة الدخول المسموحة</p> : null}
          {analysis.checkInAfterWindow ? <p>• الدخول بعد نهاية نافذة الدخول (فاتت النافذة)</p> : null}
          {analysis.checkOutBeforeWindow ? <p>• الخروج قبل نافذة الخروج (مبكر جداً)</p> : null}
          {analysis.checkOutAfterWindow ? <p>• الخروج بعد نهاية نافذة الخروج</p> : null}
          {analysis.strictModeViolation ? <p>• انتهاك الدوام الصارم</p> : null}
        </div>
      )}

      {events.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground">أحداث الفترة</p>
          {events.map((evt) => (
            <EventRow key={evt.id} evt={evt} offsetMinutes={offsetMinutes} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DailyDayDetailDialog({
  summary,
  open,
  onOpenChange,
  companyId,
}: {
  summary: AttendanceDaySummary | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId?: string;
}) {
  const [registerOpen, setRegisterOpen] = React.useState(false);
  const [breakdown, setBreakdown] = React.useState<DailyBreakdownResponseDto | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [correctionOpen, setCorrectionOpen] = React.useState(false);
  const [correctionPeriodIndex, setCorrectionPeriodIndex] = React.useState<number | undefined>();

  const loadBreakdown = React.useCallback(async (opts?: { silent?: boolean }) => {
    if (!summary || !companyId) return;
    if (!opts?.silent) setLoading(true);
    try {
      const data = await attendanceEventsApi.getDailyBreakdown({
        employeeId: summary.employeeId,
        workDate: summary.date,
        companyId,
        timezoneOffsetMinutes: defaultTimezoneOffsetMinutes(),
      });
      setBreakdown(data);
    } catch (err) {
      handleApiError(err, 'attendance/events/daily-breakdown');
      setBreakdown(null);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [summary, companyId]);

  const openCorrectionForPeriod = React.useCallback((periodIndex: number) => {
    setCorrectionPeriodIndex(periodIndex);
    setCorrectionOpen(true);
  }, []);

  React.useEffect(() => {
    if (!open || !summary || !companyId) {
      setBreakdown(null);
      return;
    }
    void loadBreakdown();
  }, [open, summary, companyId, loadBreakdown]);

  if (!summary) return null;

  const isFinalized = Boolean(summary.isFinalized);
  const offsetMinutes = breakdown?.timezoneOffsetMinutes ?? defaultTimezoneOffsetMinutes();
  const dayCfg = breakdown ? statusCfg(breakdown.status) : STATUS.unscheduled;
  const totals = breakdown?.totals;
  const dayActualWithoutPeriods =
    breakdown && breakdown.periods.length === 0
      ? resolveDayActualWithoutPeriods(breakdown)
      : null;
  const displayDate = breakdown?.workDate ?? summary.date;
  const displayEmployeeName = breakdown?.employeeNameAr ?? summary.employeeName;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-visible p-0" dir="rtl">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-right">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <DialogTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                تفاصيل يوم الحضور
              </DialogTitle>
              <DialogDescription className="sr-only">
                تفاصيل حضور {summary.employeeName} ليوم {summary.date}
              </DialogDescription>

              {!loading && breakdown && breakdown.periods.length > 0 && companyId && !isFinalized ? (
                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {breakdown.periods.map((period, index) => {
                    const multi = breakdown.periods.length > 1;
                    return (
                      <Button
                        key={period.expected.periodId}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1.5 border-primary/30 px-2.5 text-[11px] text-primary hover:bg-primary/5"
                        title={`تصحيح ${multi ? `وردية ${index + 1}` : 'الوردية'} — ${trimTime(period.expected.startTime)} إلى ${trimTime(period.expected.endTime)}`}
                        onClick={() => openCorrectionForPeriod(index)}
                      >
                        <Wrench className="h-3 w-3" />
                        تصحيح {multi ? `وردية ${index + 1}` : 'الوردية'}
                      </Button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {/* Header */}
            <div className="rounded-xl border border-border bg-muted/10 px-4 py-3 space-y-1.5">
              <p className="text-base font-semibold">{displayEmployeeName}</p>
              <p className="text-xs text-muted-foreground">
                {fmtFull(displayDate)}
                {breakdown ? ` · ${WEEKDAY_AR[breakdown.weekDay] ?? ''}` : ''}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold', dayCfg.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', dayCfg.dot)} />
                  {dayCfg.label}
                </span>
                {isFinalized ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/30 bg-muted/30 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    اليوم مقفل نهائياً
                  </span>
                ) : null}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : breakdown ? (
              <>
                {/* Shift template */}
                {breakdown.shiftTemplate ? (
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: breakdown.shiftTemplate.colorHex ?? '#64748b' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{breakdown.shiftTemplate.nameAr}</p>
                      {breakdown.shiftAssignment ? (
                        <p className="text-[11px] text-muted-foreground">
                          ساري من {breakdown.shiftAssignment.effectiveFrom}
                          {breakdown.shiftAssignment.effectiveTo ? ` إلى ${breakdown.shiftAssignment.effectiveTo}` : ''}
                        </p>
                      ) : null}
                    </div>
                    {breakdown.isRestDay ? (
                      <span className="text-[11px] text-muted-foreground">يوم راحة</span>
                    ) : null}
                    {breakdown.isUnscheduled ? (
                      <span className="text-[11px] text-muted-foreground">غير مجدول</span>
                    ) : null}
                  </div>
                ) : breakdown.isUnscheduled ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                    لا يوجد قالب دوام نشط لهذا اليوم
                  </p>
                ) : null}

                {/* Day totals */}
                {totals ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">إجماليات اليوم</p>
                    <div className="grid grid-cols-3 gap-2">
                      <StatChip label="متوقع" value={minutesToHHMM(totals.expectedMinutes)} />
                      <StatChip label="فعلي" value={minutesToHHMM(totals.workedMinutes)} />
                      <StatChip label="داخل الفترات" value={minutesToHHMM(totals.workedMinutesInsidePeriods ?? 0)} />
                      <StatChip label="خارج الفترات" value={minutesToHHMM(totals.workedMinutesOutsidePeriods ?? 0)} />
                      <StatChip label="استراحات" value={minutesToHHMM(totals.breakMinutes)} />
                      <StatChip
                        label="حضور مبكر"
                        value={minutesToHHMM(totals.earlyArrivalMinutes ?? 0)}
                      />
                      <StatChip
                        label="تأخير"
                        value={minutesToHHMM(totals.lateMinutes)}
                        tone={totals.lateMinutes > 0 ? 'warn' : 'default'}
                      />
                      <StatChip
                        label="انصراف مبكر"
                        value={minutesToHHMM(totals.earlyLeaveMinutes)}
                        tone={totals.earlyLeaveMinutes > 0 ? 'warn' : 'default'}
                      />
                      <StatChip
                        label="إضافي"
                        value={minutesToHHMM(totals.overtimeMinutes)}
                        tone={totals.overtimeMinutes > 0 ? 'success' : 'default'}
                      />
                      <StatChip
                        label="نقص"
                        value={minutesToHHMM(totals.shortageMinutes)}
                        tone={totals.shortageMinutes > 0 ? 'danger' : 'default'}
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <StatChip label="فترات" value={String(totals.periodsTotal)} />
                      <StatChip label="حضر" value={String(totals.periodsAttended)} tone="success" />
                      <StatChip label="تأخر" value={String(totals.periodsLate)} tone="warn" />
                      <StatChip label="فائت" value={String(totals.periodsMissed)} tone="danger" />
                    </div>
                  </div>
                ) : null}

                {/* Periods */}
                {breakdown.periods.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">تحليل الفترات</p>
                    {breakdown.periods.map((period, index) => (
                      <PeriodCard
                        key={period.expected.periodId}
                        period={period}
                        index={index}
                        offsetMinutes={offsetMinutes}
                        unmatchedEvents={breakdown.unmatchedEvents}
                        singlePeriod={breakdown.periods.length === 1}
                      />
                    ))}
                  </div>
                ) : dayActualWithoutPeriods ? (
                  <div className="space-y-3">
                    <ActualRegistrationBlock
                      actual={dayActualWithoutPeriods}
                      offsetMinutes={offsetMinutes}
                    />
                  </div>
                ) : null}

                {/* Unmatched events */}
                {breakdown.unmatchedEvents.length > 0 ? (
                  <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                    <div className="flex items-center gap-2">
        <Unlink className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-800">أحداث غير مرتبطة بفترة</p>
                    </div>
                    <p className="text-[11px] text-amber-700/90">
                      هذه البصمات خارج نوافذ الدخول/الخروج لجميع الفترات — مثلاً دخول قبل نافذة الدخول في الدوام الصارم.
                    </p>
                    <div className="space-y-1.5">
                      {breakdown.unmatchedEvents.map((evt) => (
                        <EventRow key={evt.id} evt={evt} offsetMinutes={offsetMinutes} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-6">تعذّر تحميل التحليل التفصيلي</p>
            )}
          </div>

          {companyId && !isFinalized ? (
            <DialogFooter className={dialogFormFooterClass}>
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  setRegisterOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                تسجيل حدث في هذا اليوم
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      {companyId ? (
        <DailyRegisterEventDialog
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          employeeId={summary.employeeId}
          employeeName={summary.employeeName}
          workDate={summary.date}
          companyId={companyId}
          onCreated={() => {
            void loadBreakdown();
          }}
        />
      ) : null}

      {companyId ? (
        <DailyShiftCorrectionDialog
          open={correctionOpen}
          onOpenChange={(open) => {
            setCorrectionOpen(open);
            if (!open) setCorrectionPeriodIndex(undefined);
          }}
          companyId={companyId}
          employeeId={summary.employeeId}
          employeeName={summary.employeeName}
          workDate={summary.date}
          periodIndex={correctionPeriodIndex}
          onSuccess={() => {
            void loadBreakdown();
          }}
        />
      ) : null}
    </>
  );
}
