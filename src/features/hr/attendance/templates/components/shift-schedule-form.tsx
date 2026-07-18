'use client';

import * as React from 'react';
import { ChevronDown, Coffee } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ModernTimePicker from '@/components/ui/modern-time-picker';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { InfoTooltip } from '@/components/ui/tooltip';
import type { ShiftPeriod } from '@/features/hr/attendance/lib/types';
import { cn } from '@/shared/utils';
import { ShiftMiniField } from '@/features/hr/attendance/templates/components/shift-mini-field';
import { ShiftTimeline } from '@/features/hr/attendance/templates/components/shift-timeline';
import { normalizeTimeInput } from '@/features/hr/attendance/templates/utils/shift-template-helpers';

export function ShiftScheduleForm({
  period,
  onChange,
}: {
  period: ShiftPeriod;
  onChange: (p: ShiftPeriod) => void;
}) {
  const [showAdv, setShowAdv] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">بداية الدوام</Label>
          <ModernTimePicker
            value={period.startTime}
            onChange={(v) => onChange({ ...period, startTime: normalizeTimeInput(v) })}
            placeholder="00:00"
          />
        </div>
        <div className="flex flex-col items-center pb-2.5 text-muted-foreground/50 gap-0.5">
          <span className="text-lg">←</span>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">نهاية الدوام</Label>
          <ModernTimePicker
            value={period.endTime}
            onChange={(v) => onChange({ ...period, endTime: normalizeTimeInput(v) })}
            placeholder="00:00"
          />
        </div>
      </div>

      {period.strictMode && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/[0.04] px-3 py-2 dark:bg-destructive/10"
          dir="rtl"
        >
          <div className="mb-2 border-b border-border/50 pb-1.5" dir="rtl">
            <div className="inline-flex items-center gap-1">
              <span className="text-xs font-semibold text-foreground">عقوبة الغياب</span>
              <InfoTooltip
                side="top"
                content={
                  <>
                    تُطبَّق هذه الخيارات عند اعتبار الموظف{' '}
                    <strong className="text-foreground">غائباً عن هذه الفترة</strong> فقط. يمكن تفعيل أكثر من خيار
                    معاً؛ مرّر على أيقونة المساعدة بجانب كل خيار للتفاصيل.
                  </>
                }
              />
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-x-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-x-3">
            <div className="flex min-h-8 shrink-0 items-center gap-1">
              <Switch
                id={`sp-warn-${period.id}`}
                className="scale-90 shrink-0"
                checked={period.strictPenaltyWarning}
                onCheckedChange={(v) => onChange({ ...period, strictPenaltyWarning: v })}
              />
              <label htmlFor={`sp-warn-${period.id}`} className="cursor-pointer text-xs font-medium whitespace-nowrap">
                إنذار
              </label>
              <InfoTooltip
                side="top"
                content={
                  <>
                    يُسجَّل <strong>إنذار</strong> للموظف عند غيابه عن الفترة، وفق مسار الإنذارات في النظام.
                  </>
                }
              />
            </div>

            <span className="hidden h-5 w-px shrink-0 bg-border/70 md:block" aria-hidden />

            <div className="flex min-h-8 shrink-0 items-center gap-1">
              <Switch
                id={`sp-bal-${period.id}`}
                className="scale-90 shrink-0"
                checked={period.strictPenaltyBalanceEnabled}
                onCheckedChange={(v) => onChange({ ...period, strictPenaltyBalanceEnabled: v })}
              />
              <label htmlFor={`sp-bal-${period.id}`} className="cursor-pointer text-xs font-medium whitespace-nowrap">
                خصم
              </label>
              <Input
                type="number"
                min={1}
                max={99}
                dir="ltr"
                disabled={!period.strictPenaltyBalanceEnabled}
                aria-label="عدد أيام الخصم من الرصيد"
                className={cn(
                  'h-7 w-11 shrink-0 px-1 text-center font-mono text-xs tabular-nums',
                  !period.strictPenaltyBalanceEnabled && 'opacity-40',
                )}
                value={period.strictPenaltyBalanceDays}
                onChange={(e) => {
                  const n = Math.min(99, Math.max(1, Number(e.target.value) || 1));
                  onChange({ ...period, strictPenaltyBalanceDays: n });
                }}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">يوم من الراتب</span>
              <InfoTooltip
                side="top"
                content={
                  <>
                    يُخصم من راتب الموظف ما يعادل <strong>يوم عمل أو أكثر</strong> حسب الرقم الذي تدخله (مثلاً 1 =
                    راتب يوم، 2 = راتب يومين) عن <strong>كل غياب</strong> في هذه الفترة.
                  </>
                }
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAdv((p) => !p)}
        className="flex w-full items-center justify-between rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
      >
        <span>إعدادات نوافذ الدخول والخروج</span>
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdv && 'rotate-180')} />
      </button>

      {showAdv && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">نافذة الدخول</p>
            <ShiftMiniField
              label="قبل بداية الدوام (د)"
              value={period.checkIn.beforeStartMinutes}
              onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, beforeStartMinutes: v } })}
              tooltip={
                <>
                  <strong className="mb-1 block">السماح بالدخول المبكر</strong>دقائق قبل بداية الدوام يُسمح فيها بالبصمة.
                </>
              }
            />
            <ShiftMiniField
              label="سماحية (د)"
              value={period.checkIn.graceMinutes}
              onChange={(v) => onChange({ ...period, checkIn: { ...period.checkIn, graceMinutes: v } })}
              tooltip={
                <>
                  <strong className="mb-1 block">فترة سماح</strong>دقائق بعد بداية الدوام لا يُحسب فيها تأخير.
                </>
              }
            />
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/10 p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">نافذة الخروج</p>
            <ShiftMiniField
              label="نقص مسموح (د)"
              value={period.checkOut.allowedShortageMinutes}
              onChange={(v) => onChange({ ...period, checkOut: { ...period.checkOut, allowedShortageMinutes: v } })}
              tooltip={
                <>
                  <strong className="mb-1 block">فترة سماح</strong>الخروج بهذا القدر قبل نهاية الدوام لا يُعدّ مخالفة.
                </>
              }
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          'flex min-w-0 flex-row flex-nowrap items-center gap-3 overflow-x-auto rounded-xl border-2 px-4 py-2.5 transition-all duration-200',
          period.breakEnabled ? 'border-warning/40 bg-warning/[0.05]' : 'border-border/50 bg-muted/10',
        )}
      >
        <label className="flex shrink-0 cursor-pointer items-center gap-2">
          <Coffee className={cn('h-4 w-4', period.breakEnabled ? 'text-warning' : 'text-muted-foreground/40')} />
          <span
            className={cn(
              'text-sm font-medium whitespace-nowrap',
              period.breakEnabled ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            استراحة
          </span>
          <Switch checked={period.breakEnabled} onCheckedChange={(v) => onChange({ ...period, breakEnabled: v })} />
        </label>
        {period.breakEnabled && (
          <div className="flex shrink-0 flex-row flex-nowrap items-center gap-2">
            <ModernTimePicker
              value={period.breakStart}
              onChange={(v) => onChange({ ...period, breakStart: normalizeTimeInput(v) })}
              placeholder="00:00"
              className="min-w-[7.5rem] max-w-[9.5rem] shrink-0"
            />
            <span className="shrink-0 text-muted-foreground/60 text-xs">—</span>
            <ModernTimePicker
              value={period.breakEnd}
              onChange={(v) => onChange({ ...period, breakEnd: normalizeTimeInput(v) })}
              placeholder="00:00"
              className="min-w-[7.5rem] max-w-[9.5rem] shrink-0"
            />
          </div>
        )}
      </div>

      <ShiftTimeline period={period} showWindows={showAdv} />
    </div>
  );
}
