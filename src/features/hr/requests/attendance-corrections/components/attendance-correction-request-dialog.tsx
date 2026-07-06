'use client';

import * as React from 'react';
import { ArrowDown, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { ModernTimePicker } from '@/components/ui/time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/shared-dialogs';
import { cn } from '@/shared/utils';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { attendanceEventsApi } from '@/features/hr/attendance/lib/api/attendance-events';
import type { DailyBreakdownResponseDto } from '@/features/hr/attendance/types/api/attendance-events';
import { requestTypesApi, type ApiRequestType } from '@/features/hr/requests/lib/api/request-types';
import { useAttendanceCorrectionRequestsStore } from '@/features/hr/requests/lib/attendance-correction-store';
import { ArabicClockTime } from '@/features/hr/requests/components/correction-period-times';
import {
  buildCorrectionFormPeriodsFromBreakdown,
  formPeriodToApiPunches,
  type CorrectionFormPeriod,
} from '@/features/hr/requests/attendance-corrections/lib/correction-from-daily-breakdown';
import { defaultTimezoneOffsetMinutes } from '@/features/hr/requests/attendance-corrections/lib/correction-period-time';

export type AttendanceCorrectionRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | undefined;
  employees: Array<{ id: string; nameAr: string }>;
  initialEmployeeId?: string;
  initialWorkDate?: string;
  initialAttendanceDaySummaryId?: string;
  /** When set, only pre-fill this shift period from daily breakdown. */
  initialPeriodIndex?: number;
  onSuccess?: () => void;
};

type DialogPeriod = CorrectionFormPeriod & { useShiftTimes: boolean };

function periodHasChanges(period: DialogPeriod): boolean {
  return (
    period.correctedCheckIn !== period.recordedCheckIn ||
    period.correctedCheckOut !== period.recordedCheckOut
  );
}

function periodIsValid(period: DialogPeriod): boolean {
  if (!period.correctedCheckIn.trim()) return false;
  if (!period.checkOutOptional && !period.correctedCheckOut.trim()) return false;
  return true;
}

function TimeField({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {children ?? (
        <div className="flex h-10 items-center rounded-lg border border-border/50 bg-muted/20 px-3">
          {value ? (
            <ArabicClockTime value={value} className="text-sm font-semibold" />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      )}
    </div>
  );
}

function PeriodCorrectionCard({
  period,
  onChange,
}: {
  period: DialogPeriod;
  onChange: (patch: Partial<DialogPeriod>) => void;
}) {
  const handleShiftToggle = (useShiftTimes: boolean) => {
    if (useShiftTimes) {
      onChange({
        useShiftTimes: true,
        correctedCheckIn: period.shiftCheckIn,
        correctedCheckOut: period.shiftCheckOut,
      });
      return;
    }
    onChange({
      useShiftTimes: false,
      correctedCheckIn: period.recordedCheckIn || period.shiftCheckIn,
      correctedCheckOut: period.recordedCheckOut || period.shiftCheckOut,
    });
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-card shadow-soft',
        period.needsCorrection ? 'border-primary/25' : 'border-border/70',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 bg-muted/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{period.labelAr}</span>
          {period.needsCorrection ? (
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10px] text-primary">
              يحتاج تصحيح
            </Badge>
          ) : null}
        </div>
        <Badge variant="secondary" className="gap-1 font-mono text-[11px] tabular-nums">
          <Clock className="h-3 w-3 opacity-60" />
          {period.expectedRangeAr}
        </Badge>
      </div>

      <div className="space-y-4 p-4">
        <div className="rounded-xl border border-border/50 bg-muted/10 p-3">
          <p className="mb-3 text-xs font-semibold text-muted-foreground">البصمة المسجّلة</p>
          <div className="grid grid-cols-2 gap-3">
            <TimeField label="حضور" value={period.recordedCheckIn} />
            <TimeField label="انصراف" value={period.recordedCheckOut} />
          </div>
        </div>

        <div className="flex justify-center text-muted-foreground/60">
          <ArrowDown className="h-4 w-4" aria-hidden />
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-primary">الأوقات المطلوبة</p>
            <div className="flex items-center gap-2">
              <Label htmlFor={`shift-mode-${period.periodId}`} className="text-[11px] text-muted-foreground">
                {period.useShiftTimes ? 'أوقات الوردية' : 'أوقات يدوية'}
              </Label>
              <Switch
                id={`shift-mode-${period.periodId}`}
                checked={period.useShiftTimes}
                onCheckedChange={handleShiftToggle}
              />
            </div>
          </div>

          {period.useShiftTimes ? (
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="حضور" value={period.correctedCheckIn} />
              <TimeField label="انصراف" value={period.correctedCheckOut} />
            </div>
          ) : (
            <>
              <p className="mb-3 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-primary">أوقات يدوية:</span>{' '}
                اضغط على الحقل لاختيار وقت الحضور أو الانصراف الذي تريده.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <TimeField label="حضور" value={period.correctedCheckIn}>
                  <ModernTimePicker
                    value={period.correctedCheckIn}
                    onChange={(v) => onChange({ correctedCheckIn: v })}
                    placeholder="اضغط لاختيار وقت الحضور"
                  />
                </TimeField>
                <TimeField label={period.checkOutOptional ? 'انصراف (اختياري)' : 'انصراف'} value={period.correctedCheckOut}>
                  <ModernTimePicker
                    value={period.correctedCheckOut}
                    onChange={(v) => onChange({ correctedCheckOut: v })}
                    placeholder="اضغط لاختيار وقت الانصراف"
                  />
                </TimeField>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AttendanceCorrectionRequestDialog({
  open,
  onOpenChange,
  companyId,
  employees,
  initialEmployeeId,
  initialWorkDate,
  initialAttendanceDaySummaryId,
  initialPeriodIndex,
  onSuccess,
}: AttendanceCorrectionRequestDialogProps) {
  const { submit } = useAttendanceCorrectionRequestsStore();

  const [correctionRequestType, setCorrectionRequestType] = React.useState<ApiRequestType | null>(null);
  const [formEmpId, setFormEmpId] = React.useState('');
  const [formWorkDate, setFormWorkDate] = React.useState('');
  const [formReason, setFormReason] = React.useState('');
  const [formPeriods, setFormPeriods] = React.useState<DialogPeriod[]>([]);
  const [attendanceDaySummaryId, setAttendanceDaySummaryId] = React.useState<string | undefined>();
  const [breakdown, setBreakdown] = React.useState<DailyBreakdownResponseDto | null>(null);
  const [breakdownLoading, setBreakdownLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const periodIndexRef = React.useRef<number | undefined>(initialPeriodIndex);

  const timezoneOffsetMinutes = breakdown?.timezoneOffsetMinutes ?? defaultTimezoneOffsetMinutes();

  React.useEffect(() => {
    if (!companyId || !open) return;
    let cancelled = false;
    void requestTypesApi
      .list({ companyId, requestCategory: 'attendance_correction', isActive: true, limit: 50 })
      .then((res) => {
        if (cancelled) return;
        const officialFirst =
          res.items.find((t) => t.slug === 'attendance-correction') ?? res.items[0] ?? null;
        setCorrectionRequestType(officialFirst);
      })
      .catch(() => {
        if (!cancelled) setCorrectionRequestType(null);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId, open]);

  const resetForm = React.useCallback(() => {
    setFormEmpId(initialEmployeeId ?? employees[0]?.id ?? '');
    setFormWorkDate(initialWorkDate ?? '');
    setFormReason('');
    setFormPeriods([]);
    setAttendanceDaySummaryId(initialAttendanceDaySummaryId);
    setBreakdown(null);
  }, [employees, initialAttendanceDaySummaryId, initialEmployeeId, initialWorkDate]);

  React.useEffect(() => {
    if (!open) return;
    periodIndexRef.current = initialPeriodIndex;
    resetForm();
  }, [open, resetForm, initialPeriodIndex]);

  React.useEffect(() => {
    if (!open || !companyId || !formEmpId || !formWorkDate) {
      setBreakdown(null);
      setFormPeriods([]);
      return;
    }

    let cancelled = false;
    setBreakdownLoading(true);
    void attendanceEventsApi
      .getDailyBreakdown({
        employeeId: formEmpId,
        workDate: formWorkDate,
        companyId,
        timezoneOffsetMinutes: defaultTimezoneOffsetMinutes(),
      })
      .then((data) => {
        if (cancelled) return;
        setBreakdown(data);
        if (data.periods.length > 0) {
          const built = buildCorrectionFormPeriodsFromBreakdown(data, periodIndexRef.current, {
            includeAll: true,
          });
          setFormPeriods(built.map((p) => ({ ...p, useShiftTimes: true })));
        } else {
          setFormPeriods([]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setBreakdown(null);
        setFormPeriods([]);
        handleApiError(err, 'correction-requests.daily-breakdown');
      })
      .finally(() => {
        if (!cancelled) setBreakdownLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, companyId, formEmpId, formWorkDate]);

  const submittablePeriods = React.useMemo(
    () => formPeriods.filter((p) => periodIsValid(p) && periodHasChanges(p)),
    [formPeriods],
  );

  const updatePeriod = React.useCallback((index: number, patch: Partial<DialogPeriod>) => {
    setFormPeriods((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionRequestType) {
      toast.error('تعذر تحديد نوع طلب تصحيح الحضور — تأكد من وجود نوع طلب مفعّل.');
      return;
    }
    if (submittablePeriods.length === 0) {
      toast.error('عدّل وقتاً واحداً على الأقل (حضور أو انصراف) قبل الإرسال.');
      return;
    }

    const apiPeriods = submittablePeriods.map((p) =>
      formPeriodToApiPunches(formWorkDate, timezoneOffsetMinutes, p),
    );

    setSubmitting(true);
    try {
      const res = await submit({
        employeeId: formEmpId,
        requestTypeId: correctionRequestType.id,
        workDate: formWorkDate,
        attendanceDaySummaryId,
        reasonAr: formReason.trim(),
        periods: apiPeriods,
      });
      if (res.ok === false) {
        toast.error(res.error);
        return;
      }
      toast.success('تم تسجيل طلب التصحيح — قيد الموافقة.');
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const shiftTemplate = breakdown?.shiftTemplate;
  const employeeName = employees.find((e) => e.id === formEmpId)?.nameAr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'sm:max-w-2xl')} dir="rtl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className={dialogShellHeaderClass}>
            <DialogTitle>طلب تصحيح حضور</DialogTitle>
            <DialogDescription>
              راجع البصمات المسجّلة وحدّد الأوقات الصحيحة — من الوردية أو يدوياً.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className={cn(dialogShellBodyClass, 'grid gap-4')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="الموظف">
                <Select
                  value={formEmpId}
                  onValueChange={setFormEmpId}
                  disabled={initialEmployeeId != null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الموظف…" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="تاريخ التصحيح">
                <DatePickerInput
                  value={formWorkDate}
                  onChange={setFormWorkDate}
                  placeholder="اختر التاريخ"
                  disabled={initialWorkDate != null}
                />
              </FormField>
            </div>

            {employeeName && formWorkDate ? (
              <div className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
                {employeeName}
                <span className="mx-2 text-border">·</span>
                <span dir="ltr">{formWorkDate}</span>
              </div>
            ) : null}

            {shiftTemplate ? (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-soft">
                <span
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: shiftTemplate.colorHex ?? 'hsl(var(--primary))' }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{shiftTemplate.nameAr}</p>
                  <p className="text-xs text-muted-foreground">
                    {formPeriods.length}{' '}
                    {formPeriods.length === 1 ? 'فترة دوام' : 'فترات دوام'}
                  </p>
                </div>
              </div>
            ) : null}

            {breakdownLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                جاري تحميل الوردية والبصمات…
              </div>
            ) : null}

            {!breakdownLoading && formEmpId && formWorkDate && breakdown?.periods.length === 0 ? (
              <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2.5 text-xs text-foreground">
                لا توجد فترات دوام مسجّلة لهذا اليوم.
              </p>
            ) : null}

            {!breakdownLoading && formPeriods.length > 0 && submittablePeriods.length === 0 ? (
              <p className="rounded-xl border border-border/60 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
                البصمات مطابقة لأوقات الوردية. عطّل «أوقات الوردية» ثم اضغط على الحقل لاختيار الأوقات التي تريدها.
              </p>
            ) : null}

            <div className="space-y-3">
              {formPeriods.map((period, index) => (
                <PeriodCorrectionCard
                  key={period.periodId || index}
                  period={period}
                  onChange={(patch) => updatePeriod(index, patch)}
                />
              ))}
            </div>

            <FormField label="سبب الطلب">
              <Textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                rows={3}
                minLength={3}
                required
                placeholder="اشرح سبب طلب التصحيح (٣ أحرف على الأقل)…"
              />
            </FormField>
          </DialogBody>

          <DialogFooter className={dialogFormFooterClass}>
            <Button
              type="submit"
              variant="luxe"
              disabled={submitting || breakdownLoading || submittablePeriods.length === 0}
            >
              {submitting ? 'جاري الإرسال…' : 'تسجيل الطلب'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
