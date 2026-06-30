'use client';

import * as React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils';
import {
  DEFAULT_COMPENSATION_PUSH_OPTIONS,
  parseOptionalPositiveRate,
  type CompensationPushOptions,
} from '@/features/hr/payroll/lib/compensation-preview';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pushing: boolean;
  disabled?: boolean;
  onConfirm: (options: CompensationPushOptions) => void;
};

function InlineSwitchRow({
  label,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 text-right">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint ? <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
      />
    </div>
  );
}

function InlineInputRow({
  label,
  hint,
  id,
  value,
  placeholder,
  disabled,
  onChange,
  onBlur,
  inputClassName,
}: {
  label: string;
  hint?: string;
  id: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
  onBlur?: () => void;
  inputClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0 text-right">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <Input
        id={id}
        type="number"
        min={0}
        step="any"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'h-9 w-36 shrink-0 rounded-lg border-border bg-background font-mono text-sm tabular-nums shadow-xs',
          inputClassName,
        )}
      />
    </div>
  );
}

export function PushFromAttendanceDialog({
  open,
  onOpenChange,
  pushing,
  disabled = false,
  onConfirm,
}: Props) {
  const [options, setOptions] = React.useState<CompensationPushOptions>(
    DEFAULT_COMPENSATION_PUSH_OPTIONS,
  );

  React.useEffect(() => {
    if (open) setOptions(DEFAULT_COMPENSATION_PUSH_OPTIONS);
  }, [open]);

  const patch = (partial: Partial<CompensationPushOptions>) =>
    setOptions(prev => ({ ...prev, ...partial }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(options);
  };

  const fieldDisabled = disabled || pushing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-primary/5 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="font-display text-lg leading-tight">
                  دفع الحضور إلى المدخلات الشهرية
                </DialogTitle>
                <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                  يحوّل ملخصات الحضور إلى مدخلات شهرية. الغياب والتأخير يُطبَّقان تلقائياً حسب حالة اليوم؛ أوفر تايم اختياري.
                </DialogDescription>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Upload className="h-4 w-4" />
              </span>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[min(70vh,520px)] overflow-y-auto px-6 py-2">
            <section className="rounded-xl border border-border/60 bg-card shadow-soft">
              <p className="border-b border-border/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                خيارات الدفع
              </p>
              <div className="divide-y divide-border/50 px-4">
                <InlineSwitchRow
                  label="استبدال المدخلات السابقة"
                  hint="حذف مدخلات الحضور السابقة قبل إنشاء مدخلات جديدة"
                  checked={options.replaceExisting}
                  disabled={fieldDisabled}
                  onCheckedChange={v => patch({ replaceExisting: v })}
                />
                <InlineSwitchRow
                  label="تطبيق أوفر تايم"
                  hint="إضافة مبالغ العمل الإضافي (اختياري في الدفع)"
                  checked={options.applyOvertime}
                  disabled={fieldDisabled}
                  onCheckedChange={v => patch({ applyOvertime: v })}
                />
                <InlineSwitchRow
                  label="خصم الغياب"
                  hint="يُخصَم تلقائياً للأيام absent — فعّل لإرسال سعر يوم مخصص"
                  checked={options.applyAbsence}
                  disabled={fieldDisabled}
                  onCheckedChange={v => patch({ applyAbsence: v })}
                />
                <InlineSwitchRow
                  label="خصم التأخير"
                  hint="يُخصَم تلقائياً للأيام late — فعّل لإرسال سعر دقيقة مخصص"
                  checked={options.applyLateness}
                  disabled={fieldDisabled}
                  onCheckedChange={v => patch({ applyLateness: v })}
                />
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-border/60 bg-card shadow-soft">
              <p className="border-b border-border/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                أسعار مخصّصة (اختياري)
              </p>
              <div className="divide-y divide-border/50 px-4">
                <InlineInputRow
                  id="absence-rate"
                  label="سعر يوم الغياب"
                  hint="سعر يوم مخصص (افتراضي: الراتب ÷ 30)"
                  placeholder="0.00"
                  value={options.absenceDailyRateOverride}
                  disabled={fieldDisabled || !options.applyAbsence}
                  onChange={v => patch({ absenceDailyRateOverride: v })}
                />
                <InlineInputRow
                  id="late-rate"
                  label="سعر دقيقة التأخير"
                  hint="سعر دقيقة مخصص (افتراضي: الراتب ÷ 30 ÷ 8 ÷ 60)"
                  placeholder="0.00"
                  value={options.lateMinuteRateOverride}
                  disabled={fieldDisabled || !options.applyLateness}
                  onChange={v => patch({ lateMinuteRateOverride: v })}
                />
                <InlineInputRow
                  id="ot-multiplier"
                  label="معامل الأ overtime"
                  hint="يُطبَّق على سعر الدقيقة الأساسي"
                  value={options.overtimeMultiplier}
                  disabled={fieldDisabled || !options.applyOvertime}
                  onChange={v => patch({ overtimeMultiplier: v })}
                  onBlur={() => {
                    if (!parseOptionalPositiveRate(options.overtimeMultiplier)) {
                      patch({ overtimeMultiplier: '1.5' });
                    }
                  }}
                  inputClassName="w-24"
                />
              </div>
            </section>
          </div>

          <DialogFooter className={dialogFormFooterClass}>
            <Button type="submit" disabled={fieldDisabled} className="min-w-[7.5rem] gap-1.5">
              {pushing && <Loader2 className="h-4 w-4 animate-spin" />}
              تنفيذ الدفع
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pushing}
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
