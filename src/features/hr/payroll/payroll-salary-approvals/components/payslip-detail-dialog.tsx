'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DisplayDate } from '@/components/ui/table-cells';
import { formatLatinNumber } from '@/features/hr/payroll/lib/compensation-preview';
import { MONTHLY_INPUT_KIND_LABELS } from '@/features/hr/payroll/monthly-inputs/constants/monthly-input-labels';
import type { MonthlyInputKindDto } from '@/features/hr/payroll/lib/api/monthly-inputs';
import {
  PAYSLIP_ACCEPTANCE_STATUS_COLORS,
  PAYSLIP_ACCEPTANCE_STATUS_LABELS,
  PAYSLIP_ATTENDANCE_LABELS,
  PAYSLIP_BREAKDOWN_TOTAL_LABELS,
  PAYSLIP_STATUS_COLORS,
  PAYSLIP_STATUS_LABELS,
  parsePayslipMoney,
  payslipAcceptanceStatus,
  payslipsApi,
  type PayslipResponseDto,
} from '@/features/hr/payroll/lib/api/payslips';
import { cn } from '@/shared/utils';
import { PayslipDetailDecisionFooter } from '@/features/hr/payroll/components/payslip-employee-decision-actions';

function money(value: string | null | undefined): string {
  return formatLatinNumber(parsePayslipMoney(value), 2);
}

function monthlyInputKindLabel(kind: unknown): string {
  if (typeof kind !== 'string') return '—';
  return MONTHLY_INPUT_KIND_LABELS[kind as MonthlyInputKindDto] ?? kind;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 border-b border-border/40 py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value ?? '—'}</span>
    </div>
  );
}

function BreakdownSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/15 p-3 space-y-2">
      <p className="text-xs font-bold text-foreground">{title}</p>
      {children}
    </div>
  );
}

function renderBreakdown(breakdown: Record<string, unknown> | null) {
  if (!breakdown) {
    return <p className="text-xs text-muted-foreground">لا توجد تفاصيل إضافية.</p>;
  }

  const attendance = breakdown.attendance as Record<string, unknown> | undefined;
  const totals = breakdown.totals as Record<string, unknown> | undefined;
  const additions = breakdown.additions as Array<Record<string, unknown>> | undefined;
  const deductions = breakdown.deductions as Array<Record<string, unknown>> | undefined;
  const allowanceLines = breakdown.allowanceLines as Array<Record<string, unknown>> | undefined;

  return (
    <div className="space-y-3">
      {totals && (
        <BreakdownSection title="ملخص المبالغ">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(totals).map(([key, val]) => (
              <div key={key} className="flex justify-between gap-2 rounded-lg bg-background/80 px-2 py-1.5">
                <span className="text-muted-foreground">
                  {PAYSLIP_BREAKDOWN_TOTAL_LABELS[key] ?? key}
                </span>
                <span className="font-mono tabular-nums">{money(String(val))}</span>
              </div>
            ))}
          </div>
        </BreakdownSection>
      )}

      {attendance && (
        <BreakdownSection title="الحضور">
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(attendance).map(([key, val]) => (
              <span key={key} className="rounded-lg border border-border/60 bg-background/80 px-2 py-1 tabular-nums">
                {PAYSLIP_ATTENDANCE_LABELS[key] ?? key}: <strong>{String(val)}</strong>
              </span>
            ))}
          </div>
        </BreakdownSection>
      )}

      {allowanceLines && allowanceLines.length > 0 && (
        <BreakdownSection title="بدلات العقد">
          <ul className="space-y-1 text-xs">
            {allowanceLines.map((line, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>{String(line.allowanceTypeNameAr ?? line.allowanceTypeCode ?? '—')}</span>
                <span className="font-mono tabular-nums">{money(String(line.amount))}</span>
              </li>
            ))}
          </ul>
        </BreakdownSection>
      )}

      {additions && additions.length > 0 && (
        <BreakdownSection title="إضافات">
          <ul className="space-y-1 text-xs">
            {additions.map((item, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {monthlyInputKindLabel(item.kind)}
                  {item.note ? ` — ${String(item.note)}` : ''}
                </span>
                <span className="font-mono tabular-nums text-primary">{money(String(item.amount))}</span>
              </li>
            ))}
          </ul>
        </BreakdownSection>
      )}

      {deductions && deductions.length > 0 && (
        <BreakdownSection title="خصومات">
          <ul className="space-y-1 text-xs">
            {deductions.map((item, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {monthlyInputKindLabel(item.kind)}
                  {item.note ? ` — ${String(item.note)}` : ''}
                </span>
                <span className="font-mono tabular-nums text-destructive">{money(String(item.amount))}</span>
              </li>
            ))}
          </ul>
        </BreakdownSection>
      )}
    </div>
  );
}

export function PayslipDetailDialog({
  payslipId,
  open,
  onOpenChange,
  onAccept,
  onReject,
  decisionBusyId = null,
  refreshKey = 0,
}: {
  payslipId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: (payslip: PayslipResponseDto) => void;
  onReject?: (payslip: PayslipResponseDto) => void;
  decisionBusyId?: string | null;
  refreshKey?: number;
}) {
  const [payslip, setPayslip] = React.useState<PayslipResponseDto | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !payslipId) {
      setPayslip(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void payslipsApi.get(payslipId)
      .then(data => { if (!cancelled) setPayslip(data); })
      .catch(() => { if (!cancelled) setPayslip(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, payslipId, refreshKey]);

  const handleAccept = React.useCallback(() => {
    if (!payslip || !onAccept) return;
    onAccept(payslip);
  }, [onAccept, payslip]);

  const handleReject = React.useCallback(() => {
    if (!payslip || !onReject) return;
    onReject(payslip);
  }, [onReject, payslip]);

  const acceptance = payslip ? payslipAcceptanceStatus(payslip) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-hidden border-border p-0" dir="rtl">
        <div className="border-b border-border/60 bg-linear-to-b from-primary/6 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-base">
              {payslip?.employeeNameAr ?? 'قسيمة الراتب'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {payslip?.contractNumber ? `عقد ${payslip.contractNumber}` : 'تفاصيل القسيمة والتفصيل المحاسبي'}
            </DialogDescription>
          </DialogHeader>
          {payslip && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className={cn('rounded-lg border px-2 py-0.5 text-[10px] font-semibold', PAYSLIP_STATUS_COLORS[payslip.status])}>
                {PAYSLIP_STATUS_LABELS[payslip.status]}
              </Badge>
              {acceptance && (
                <Badge className={cn('rounded-lg border px-2 py-0.5 text-[10px] font-semibold', PAYSLIP_ACCEPTANCE_STATUS_COLORS[acceptance])}>
                  {PAYSLIP_ACCEPTANCE_STATUS_LABELS[acceptance]}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="max-h-[calc(90vh-8rem)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !payslip ? (
            <p className="text-sm text-muted-foreground text-center py-8">تعذر تحميل القسيمة.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/10 px-3 py-1">
                <DetailRow label="الموظف" value={payslip.employeeNameAr} />
                <DetailRow label="رقم العقد" value={payslip.contractNumber} />
                <DetailRow
                  label="حالة القسيمة"
                  value={
                    <Badge className={cn('rounded-lg border px-2 py-0.5 text-[10px] font-semibold', PAYSLIP_STATUS_COLORS[payslip.status])}>
                      {PAYSLIP_STATUS_LABELS[payslip.status]}
                    </Badge>
                  }
                />
                <DetailRow
                  label="موافقة الموظف"
                  value={
                    acceptance ? (
                      <Badge className={cn('rounded-lg border px-2 py-0.5 text-[10px] font-semibold', PAYSLIP_ACCEPTANCE_STATUS_COLORS[acceptance])}>
                        {PAYSLIP_ACCEPTANCE_STATUS_LABELS[acceptance]}
                      </Badge>
                    ) : '—'
                  }
                />
                <DetailRow
                  label="تاريخ الموافقة"
                  value={payslip.acceptanceAt ? <DisplayDate value={payslip.acceptanceAt} mode="datetime" /> : '—'}
                />
                {payslip.acceptanceNote && (
                  <DetailRow label="ملاحظة الموافقة" value={payslip.acceptanceNote} />
                )}
                <DetailRow
                  label="تاريخ التوليد"
                  value={payslip.generatedAt ? <DisplayDate value={payslip.generatedAt} mode="datetime" /> : '—'}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                {([
                  ['الراتب الأساسي', payslip.baseSalary],
                  ['البدلات', payslip.allowancesTotal],
                  ['الإضافات', payslip.additionsTotal],
                  ['الخصومات', payslip.deductionsTotal],
                  ['التأمينات', payslip.gosi],
                  ['الإجمالي', payslip.gross],
                ] as const).map(([label, val]) => (
                  <div key={label} className="rounded-lg border border-border/60 bg-card px-2.5 py-2 text-center">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="mt-0.5 font-mono font-semibold tabular-nums">{money(val)}</p>
                  </div>
                ))}
                <div className="col-span-2 rounded-lg border border-primary/25 bg-primary/8 px-2.5 py-2 text-center sm:col-span-3">
                  <p className="text-[10px] font-bold text-primary">الصافي ({payslip.currency})</p>
                  <p className="mt-0.5 font-mono text-lg font-bold tabular-nums text-primary">{money(payslip.net)}</p>
                </div>
              </div>

              {(payslip.workingDays != null || payslip.presentDays != null) && (
                <BreakdownSection title="ملخص الحضور">
                  <div className="flex flex-wrap gap-2 text-xs">
                    {payslip.workingDays != null && (
                      <span className="rounded-lg border border-border/60 bg-background/80 px-2 py-1">
                        {PAYSLIP_ATTENDANCE_LABELS.workingDays}: <strong>{payslip.workingDays}</strong>
                      </span>
                    )}
                    {payslip.presentDays != null && (
                      <span className="rounded-lg border border-border/60 bg-background/80 px-2 py-1">
                        {PAYSLIP_ATTENDANCE_LABELS.presentDays}: <strong>{payslip.presentDays}</strong>
                      </span>
                    )}
                    {payslip.absentDays != null && (
                      <span className="rounded-lg border border-border/60 bg-background/80 px-2 py-1">
                        {PAYSLIP_ATTENDANCE_LABELS.absentDays}: <strong>{payslip.absentDays}</strong>
                      </span>
                    )}
                    {payslip.lateDays != null && (
                      <span className="rounded-lg border border-border/60 bg-background/80 px-2 py-1">
                        {PAYSLIP_ATTENDANCE_LABELS.lateDays}: <strong>{payslip.lateDays}</strong>
                      </span>
                    )}
                  </div>
                </BreakdownSection>
              )}

              {payslip.notes && (
                <p className="rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                  {payslip.notes}
                </p>
              )}

              {renderBreakdown(payslip.breakdown)}

              {onAccept && onReject && (
                <PayslipDetailDecisionFooter
                  payslip={payslip}
                  busy={decisionBusyId === payslip.id}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
