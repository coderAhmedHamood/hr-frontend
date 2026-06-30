'use client';

import * as React from 'react';
import {
  Banknote,
  Check,
  ChevronDown,
  Columns3,
  Gavel,
  Loader2,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';
import type { CompensationColumnVisibility } from '@/features/hr/payroll/lib/compensation-preview';

const ENTITLEMENT_COLUMNS: { k: keyof CompensationColumnVisibility; label: string }[] = [
  { k: 'colOvertime', label: 'أوفر تايم' },
  { k: 'colBonus', label: 'مكافآت' },
];

const DEDUCTION_COLUMNS: { k: keyof CompensationColumnVisibility; label: string; shortLabel?: string }[] = [
  { k: 'colDedAdvances', label: 'السلف' },
  { k: 'colDedAbsence', label: 'غياب' },
  { k: 'colDedLate', label: 'تأخير' },
  { k: 'colDedPenalties', label: 'جزاءات' },
  { k: 'colDedAdmin', label: 'إضافة/خصم مباشر', shortLabel: 'إضافة/خصم' },
];

type Props = {
  cols: CompensationColumnVisibility;
  isReviewLocked: boolean;
  togglingCol: keyof CompensationColumnVisibility | null;
  pushing: boolean;
  onToggleCol: (k: keyof CompensationColumnVisibility) => void;
  onPushAttendance: () => void;
  onPushAdvances: () => void;
  onPushViolations: () => void;
};

function PushActions({
  pushing,
  isReviewLocked,
  onPushAttendance,
  onPushAdvances,
  onPushViolations,
  className,
}: Pick<Props, 'pushing' | 'isReviewLocked' | 'onPushAttendance' | 'onPushAdvances' | 'onPushViolations'> & {
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:shrink-0 lg:justify-end', className)}>
      <Button
        type="button"
        size="sm"
        disabled={isReviewLocked || pushing}
        onClick={onPushAttendance}
        className="h-11 gap-2 text-xs lg:h-8 lg:gap-1.5"
      >
        {pushing ? <Loader2 className="h-4 w-4 animate-spin lg:h-3.5 lg:w-3.5" /> : <Upload className="h-4 w-4 lg:h-3.5 lg:w-3.5" />}
        دفع من الحضور
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isReviewLocked || pushing}
        onClick={onPushAdvances}
        className="h-11 gap-2 border-destructive/30 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive lg:h-8 lg:gap-1.5"
      >
        <Banknote className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
        دفع السلف
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isReviewLocked || pushing}
        onClick={onPushViolations}
        className="h-11 gap-2 border-destructive/30 text-xs text-destructive hover:bg-destructive/5 hover:text-destructive lg:h-8 lg:gap-1.5"
      >
        <Gavel className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
        دفع الجزاءات
      </Button>
    </div>
  );
}

function ColumnToggleChip({
  active,
  activeClassName,
  inactiveClassName,
  disabled,
  loading,
  label,
  onClick,
  compact = false,
}: {
  active: boolean;
  activeClassName: string;
  inactiveClassName?: string;
  disabled: boolean;
  loading: boolean;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 font-medium transition-all duration-200 disabled:opacity-60',
        compact
          ? cn(
              'rounded-lg border px-2.5 py-1 text-[11px]',
              active
                ? activeClassName
                : (inactiveClassName ?? 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'),
            )
          : cn(
              'min-h-11 w-full justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs',
              active
                ? activeClassName
                : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
            ),
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : compact ? (
        active ? <Check className="h-3 w-3 shrink-0" /> : null
      ) : active ? (
        <Check className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border/80" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function CompensationDataToolbar(props: Props) {
  const {
    cols,
    isReviewLocked,
    togglingCol,
    pushing,
    onToggleCol,
    onPushAttendance,
    onPushAdvances,
    onPushViolations,
  } = props;

  const [columnsOpen, setColumnsOpen] = React.useState(false);

  const activeColumnCount = Object.values(cols).filter(Boolean).length;
  const chipsDisabled = isReviewLocked || togglingCol !== null;

  return (
    <div className="animate-fade-in">
      {/* ── Mobile / tablet ── */}
      <div className="space-y-3 lg:hidden">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border/60 bg-muted/25 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">دفع البيانات للفترة</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              استيراد المدخلات من الحضور أو السلف أو الجزاءات
            </p>
          </div>
          <div className="p-3">
            <PushActions
              pushing={pushing}
              isReviewLocked={isReviewLocked}
              onPushAttendance={onPushAttendance}
              onPushAdvances={onPushAdvances}
              onPushViolations={onPushViolations}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <button
            type="button"
            onClick={() => setColumnsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted/20"
            aria-expanded={columnsOpen}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40">
                <Columns3 className="h-4 w-4 text-muted-foreground" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">إظهار الأعمدة</p>
                <p className="text-[11px] text-muted-foreground">{activeColumnCount} عمود مفعّل</p>
              </div>
            </div>
            <ChevronDown
              className={cn(
                'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                columnsOpen && 'rotate-180',
              )}
            />
          </button>

          <div
            className={cn(
              'grid transition-[grid-template-rows] duration-200',
              columnsOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 border-t border-border/60 px-4 pb-4 pt-3">
                <section className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary/80">مستحقات</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ENTITLEMENT_COLUMNS.map(({ k, label }) => (
                      <ColumnToggleChip
                        key={k}
                        label={label}
                        active={cols[k]}
                        loading={togglingCol === k}
                        disabled={chipsDisabled}
                        activeClassName="border-primary bg-primary text-primary-foreground shadow-soft"
                        onClick={() => onToggleCol(k)}
                      />
                    ))}
                  </div>
                </section>
                <section className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-destructive/80">خصومات</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DEDUCTION_COLUMNS.map(({ k, label, shortLabel }) => (
                      <ColumnToggleChip
                        key={k}
                        label={shortLabel ?? label}
                        active={cols[k]}
                        loading={togglingCol === k}
                        disabled={chipsDisabled}
                        activeClassName="border-destructive/30 bg-destructive/10 text-destructive shadow-soft"
                        onClick={() => onToggleCol(k)}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop: compact single toolbar ── */}
      <div className="hidden lg:flex lg:flex-wrap lg:items-center lg:gap-2 lg:rounded-xl lg:border lg:border-border lg:bg-card lg:px-4 lg:py-3 lg:shadow-soft">
        <span className="shrink-0 text-xs font-semibold text-muted-foreground">إظهار الأعمدة</span>
        <div className="hidden h-5 w-px bg-border xl:block" />

        <span className="text-[10px] font-bold uppercase tracking-wide text-primary/80">مستحقات</span>
        {ENTITLEMENT_COLUMNS.map(({ k, label }) => (
          <ColumnToggleChip
            key={k}
            compact
            label={label}
            active={cols[k]}
            loading={togglingCol === k}
            disabled={chipsDisabled}
            activeClassName="border-primary bg-primary text-primary-foreground shadow-soft"
            onClick={() => onToggleCol(k)}
          />
        ))}

        <div className="h-5 w-px bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-wide text-destructive/80">خصومات</span>
        {DEDUCTION_COLUMNS.map(({ k, label }) => (
          <ColumnToggleChip
            key={k}
            compact
            label={label}
            active={cols[k]}
            loading={togglingCol === k}
            disabled={chipsDisabled}
            activeClassName="border-destructive/30 bg-destructive/10 text-destructive shadow-soft"
            inactiveClassName="border-border bg-card text-muted-foreground hover:border-destructive/30 hover:text-foreground"
            onClick={() => onToggleCol(k)}
          />
        ))}

        <div className="ms-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          <PushActions
            pushing={pushing}
            isReviewLocked={isReviewLocked}
            onPushAttendance={onPushAttendance}
            onPushAdvances={onPushAdvances}
            onPushViolations={onPushViolations}
            className="flex-row"
          />
        </div>
      </div>
    </div>
  );
}
