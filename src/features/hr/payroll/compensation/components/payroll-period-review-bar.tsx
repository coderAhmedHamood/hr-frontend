'use client';

import * as React from 'react';
import {
  ArrowLeft, ArrowRight, Check, Eye, FileCheck, Loader2, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/shared/utils';
import {
  isPayrollPeriodReviewable,
  type HRPayrollPeriodRecord,
  type HRPayrollReviewStage,
} from '@/features/hr/payroll/lib/payroll-periods-store';

const REVIEW_STEPS: { key: HRPayrollReviewStage; ar: string; icon: React.ElementType }[] = [
  { key: 'first_review', ar: 'مراجعة أولى', icon: FileCheck },
  { key: 'second_review', ar: 'مراجعة ثانية', icon: Eye },
  { key: 'third_review', ar: 'مراجعة ثالثة', icon: Shield },
];

function stageIndex(stage: HRPayrollReviewStage): number {
  return { first_review: 0, second_review: 1, third_review: 2 }[stage];
}

function isStepDone(period: HRPayrollPeriodRecord, step: HRPayrollReviewStage): boolean {
  if (step === 'first_review') return !!period.firstReviewedAt;
  if (step === 'second_review') return !!period.secondReviewedAt;
  return !!period.thirdReviewedAt;
}

function advanceLabel(stage: HRPayrollReviewStage): string {
  if (stage === 'first_review') return 'تسجيل المراجعة الأولى';
  if (stage === 'second_review') return 'تسجيل المراجعة الثانية';
  return 'إتمام المراجعة الاخيرة';
}

export function PayrollPeriodReviewBar({
  period,
  hasLines,
  advancing,
  reverting,
  onAdvance,
  onRevert,
}: {
  period: HRPayrollPeriodRecord;
  hasLines: boolean;
  advancing: boolean;
  reverting: boolean;
  onAdvance: () => void;
  onRevert: () => void;
}) {
  const reviewable = isPayrollPeriodReviewable(period.status);
  const activeIdx = stageIndex(period.reviewStage);
  const busy = advancing || reverting;

  const canRevert = reviewable && (
    !!period.firstReviewedAt || !!period.secondReviewedAt || !!period.thirdReviewedAt
  );
  const canAdvance = reviewable && !period.isReviewCompleted && hasLines;

  return (
    <Card className="overflow-hidden border-primary/20 animate-fade-in">
      <div className="relative overflow-hidden bg-linear-to-b from-primary/6 to-card">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3" dir="rtl">
          <p className="shrink-0 text-xs font-bold text-foreground">مسار المراجعة</p>

          <div className="flex min-w-0 flex-1 items-center" dir="ltr">
            {REVIEW_STEPS.map((st, i) => {
              const done = isStepDone(period, st.key);
              const active = !period.isReviewCompleted && i === activeIdx;
              const filled = i > 0 && (done || (i <= activeIdx && !period.isReviewCompleted));
              const StepIcon = st.icon;
              return (
                <React.Fragment key={st.key}>
                  {i > 0 && (
                    <div
                      className={cn(
                        'h-[2px] min-w-3 flex-1 rounded-full transition-all duration-500',
                        filled || done ? 'bg-success' : 'bg-border',
                      )}
                    />
                  )}
                  <div
                    title={st.ar}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                      done && 'border-success bg-success text-success-foreground shadow-soft',
                      active && !done && 'border-primary bg-primary text-primary-foreground shadow-soft ring-2 ring-primary/20',
                      !done && !active && 'border-border bg-muted/40 text-muted-foreground',
                    )}
                  >
                    {done
                      ? <Check className="h-4 w-4" strokeWidth={2.5} />
                      : <StepIcon className="h-3.5 w-3.5" />
                    }
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!period.isReviewCompleted && reviewable && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!canRevert || busy}
                  onClick={onRevert}
                  title={!canRevert ? 'لا توجد مرحلة سابقة للتراجع' : undefined}
                  className="h-8 gap-1 px-2.5 text-xs"
                >
                  {reverting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  تراجع
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canAdvance || busy}
                  onClick={onAdvance}
                  title={!hasLines ? 'أضف سجلات تشغيل أولاً' : undefined}
                  className="h-8 gap-1 px-2.5 text-xs"
                >
                  {advancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowLeft className="h-3.5 w-3.5" />}
                  {advanceLabel(period.reviewStage)}
                </Button>
              </>
            )}

            {!reviewable && !period.isReviewCompleted && (
              <span className="text-[10px] text-muted-foreground">
                المراجعة متاحة للفترات المسودة أو المفتوحة فقط
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
