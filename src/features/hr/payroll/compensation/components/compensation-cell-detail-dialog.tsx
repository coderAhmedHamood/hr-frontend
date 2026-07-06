'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TableDateCell } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import { MoneyAmount } from '@/components/ui/sar-amount';
import {
  MONTHLY_INPUT_DIRECTION_LABELS,
  MONTHLY_INPUT_KIND_LABELS,
} from '@/features/hr/payroll/monthly-inputs/constants/monthly-input-labels';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  COMPENSATION_DETAIL_FIELD_LABELS,
  getCompensationPreviewFieldAmount,
  type CompensationCellDetailContext,
  type CompensationCellDetailResult,
} from '@/features/hr/payroll/compensation/lib/compensation-cell-detail';
import { fetchCompensationCellDetail } from '@/features/hr/payroll/compensation/services/fetch-compensation-cell-detail';
import type { ViolationRecordResponseDto } from '@/features/hr/discipline/types/api/violation-records';
import type { AdvanceKindDto, AdvanceStatusDto } from '@/features/hr/contracts/lib/api/employee-advances';

const ADVANCE_STATUS_LABELS: Record<AdvanceStatusDto, string> = {
  draft: 'مسودة',
  pending_approval: 'بانتظار الاعتماد',
  approved: 'معتمدة',
  rejected: 'مرفوضة',
  disbursed: 'مصروفة',
  repaying: 'قيد السداد',
  fully_repaid: 'مسددة بالكامل',
  cancelled: 'ملغاة',
};

const ADVANCE_KIND_LABELS: Record<AdvanceKindDto, string> = {
  salary_advance: 'سلفة راتب',
  emergency: 'طوارئ',
  travel: 'سفر',
  housing: 'سكن',
  other: 'أخرى',
};

function EmptyDetail({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function DetailTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[28rem] border-separate border-spacing-0 text-xs">
        <thead>
          <tr className="bg-muted/60 text-muted-foreground">
            {headers.map((header) => (
              <th key={header} className="border-b border-border/60 px-3 py-2 text-center font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function AllowancesPreview({ context }: { context: CompensationCellDetailContext }) {
  const { row } = context;
  if (row.allowanceLines.length === 0) {
    return <EmptyDetail message="لا توجد بدلات من العقد لهذا الموظف." />;
  }
  return (
    <DetailTable headers={['نوع البدل', 'المبلغ الشهري']}>
      {row.allowanceLines.map((line) => (
        <tr key={line.labelAr} className="border-b border-border/40 last:border-0 even:bg-muted/10">
          <td className="px-3 py-2 text-right">{line.labelAr}</td>
          <td className="px-3 py-2 text-center font-mono tabular-nums text-primary">
            <MoneyAmount value={line.amount} currency={context.currency} fractionDigits={0} />
          </td>
        </tr>
      ))}
    </DetailTable>
  );
}

function NetBreakdown({ context }: { context: CompensationCellDetailContext }) {
  const { row, currency } = context;
  const Money = ({ n, fractionDigits = 0 }: { n: number; fractionDigits?: number }) => (
    <MoneyAmount value={n} currency={currency} fractionDigits={fractionDigits} />
  );
  const lines = [
    { label: 'الراتب الأساسي', amount: row.baseSalary, tone: 'text-foreground' },
    { label: 'البدلات', amount: row.allowancesMonthlyTotal, tone: 'text-primary' },
    { label: 'أوفر تايم', amount: row.entitlementOvertimeSar, tone: 'text-primary' },
    { label: 'مكافآت', amount: row.entitlementBonusSar, tone: 'text-primary' },
    { label: 'الإجمالي', amount: row.grossSar, tone: 'font-semibold text-foreground' },
    { label: 'السلف', amount: -row.dedAdvancesSar, tone: 'text-destructive' },
    { label: 'غياب', amount: -row.dedAbsenceSar, tone: 'text-warning' },
    { label: 'تأخير', amount: -row.dedLateSar, tone: 'text-destructive' },
    { label: 'جزاءات', amount: -row.dedPenaltiesSar, tone: 'text-destructive' },
    {
      label: 'إضافة/خصم مباشر',
      amount: row.dedAdminSar,
      tone: row.dedAdminSar >= 0 ? 'text-primary' : 'text-destructive',
    },
    { label: 'الصافي', amount: row.lineNetSar, tone: 'font-bold text-primary' },
  ];

  return (
    <div className="rounded-lg border border-border divide-y divide-border/50">
      {lines.map((line) => (
        <div key={line.label} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="text-muted-foreground">{line.label}</span>
          <span className={cn('font-mono tabular-nums', line.tone)}><Money n={line.amount} /></span>
        </div>
      ))}
    </div>
  );
}

function formatViolationDeduction(record: ViolationRecordResponseDto): React.ReactNode {
  const investigation = record.investigations?.find(
    (row) => row.recommendation === 'deduction' && row.deductionType && row.deductionValue,
  );
  if (investigation?.deductionType && investigation.deductionValue) {
    if (investigation.deductionType === 'fixed_amount') {
      return <MoneyAmount value={investigation.deductionValue} fractionDigits={0} />;
    }
    const unit = investigation.deductionType === 'days' ? 'يوم' : 'ساعة';
    return `${investigation.deductionValue} ${unit}`;
  }
  const type = record.violationType;
  if (!type?.hasDeduction || !type.deductionKind || type.deductionKind === 'none') return '—';
  if (!type.deductionValue) return type.deductionKind;
  return `${type.deductionValue} (${type.deductionKind})`;
}

function AdvancesDetail({
  result,
}: {
  result: Extract<CompensationCellDetailResult, { kind: 'advances' }>;
}) {
  if (result.items.length === 0) {
    return <EmptyDetail message="لا توجد سلف مسجّلة لهذا الموظف." />;
  }
  return (
    <DetailTable headers={['رقم السلفة', 'النوع', 'المبلغ', 'القسط الشهري', 'المتبقي', 'الحالة']}>
      {result.items.map((item) => (
        <tr key={item.id} className="border-b border-border/40 last:border-0 even:bg-muted/10">
          <td className="px-3 py-2 text-right font-mono">{item.advanceNumber}</td>
          <td className="px-3 py-2 text-center text-muted-foreground">
            {item.advanceKind ? (ADVANCE_KIND_LABELS[item.advanceKind] ?? item.advanceKind) : '—'}
          </td>
          <td className="px-3 py-2 text-center font-mono tabular-nums">
            <MoneyAmount value={item.amount} currency={item.currency} />
          </td>
          <td className="px-3 py-2 text-center font-mono tabular-nums text-destructive">
            {item.monthlyInstallmentAmount
              ? <MoneyAmount value={item.monthlyInstallmentAmount} currency={item.currency} />
              : '—'}
          </td>
          <td className="px-3 py-2 text-center font-mono tabular-nums text-muted-foreground">
            <MoneyAmount value={item.remainingAmount} currency={item.currency} />
          </td>
          <td className="px-3 py-2 text-center">
            <Badge variant="outline" className="text-[10px] font-normal">
              {ADVANCE_STATUS_LABELS[item.status] ?? item.status}
            </Badge>
          </td>
        </tr>
      ))}
    </DetailTable>
  );
}

function AbsenceDetail({
  result,
}: {
  result: Extract<CompensationCellDetailResult, { kind: 'absence' }>;
}) {
  if (result.days.length === 0) {
    return <EmptyDetail message="لا توجد أيام غياب لهذا الموظف في هذه الفترة." />;
  }
  return (
    <DetailTable headers={['التاريخ', 'النقص', 'الحالة']}>
      {result.days.map((day) => {
        const shortage = day.shortageMinutes ?? day.dailyTotals?.minutes.shortage ?? 0;
        return (
          <tr key={day.id} className="border-b border-border/40 last:border-0 even:bg-muted/10">
            <td className="px-3 py-2 text-center">
              <TableDateCell value={day.workDate} mode="date" />
            </td>
            <td className="px-3 py-2 text-center font-mono tabular-nums text-warning">
              {shortage > 0 ? `${shortage} د` : '—'}
            </td>
            <td className="px-3 py-2 text-center text-warning">غياب</td>
          </tr>
        );
      })}
    </DetailTable>
  );
}

function LatenessDetail({
  result,
}: {
  result: Extract<CompensationCellDetailResult, { kind: 'lateness' }>;
}) {
  if (result.days.length === 0) {
    return <EmptyDetail message="لا يوجد تأخير مسجّل لهذا الموظف في هذه الفترة." />;
  }
  return (
    <DetailTable headers={['التاريخ', 'دقائق التأخير']}>
      {result.days.map((day) => (
        <tr key={day.id} className="border-b border-border/40 last:border-0 even:bg-muted/10">
          <td className="px-3 py-2 text-center">
            <TableDateCell value={day.workDate} mode="date" />
          </td>
          <td className="px-3 py-2 text-center font-mono tabular-nums text-destructive">
            {day.lateMinutes}
          </td>
        </tr>
      ))}
    </DetailTable>
  );
}

function OvertimeDetail({
  result,
}: {
  result: Extract<CompensationCellDetailResult, { kind: 'overtime' }>;
}) {
  if (result.days.length === 0) {
    return <EmptyDetail message="لا يوجد أوفر تايم معتمد للراتب في هذه الفترة." />;
  }
  return (
    <DetailTable headers={['التاريخ', 'دقائق الإضافي']}>
      {result.days.map((day) => {
        const minutes = day.payrollOvertimeMinutes ?? day.overtimeMinutes;
        return (
          <tr key={day.id} className="border-b border-border/40 last:border-0 even:bg-muted/10">
            <td className="px-3 py-2 text-center">
              <TableDateCell value={day.workDate} mode="date" />
            </td>
            <td className="px-3 py-2 text-center font-mono tabular-nums text-primary">{minutes}</td>
          </tr>
        );
      })}
    </DetailTable>
  );
}

function PenaltiesDetail({
  result,
}: {
  result: Extract<CompensationCellDetailResult, { kind: 'penalties' }>;
}) {
  if (result.violations.length === 0) {
    return <EmptyDetail message="لا توجد مخالفات معتمدة لهذا الموظف في هذه الفترة." />;
  }
  return (
    <DetailTable headers={['رقم المخالفة', 'التاريخ', 'نوع المخالفة', 'الجزاء']}>
      {result.violations.map((record) => (
        <tr key={record.id} className="border-b border-border/40 last:border-0 even:bg-muted/10">
          <td className="px-3 py-2 text-right font-mono">{record.recordNumber}</td>
          <td className="px-3 py-2 text-center">
            <TableDateCell value={record.violationDate} mode="date" />
          </td>
          <td className="px-3 py-2 text-right">{record.violationType?.nameAr ?? '—'}</td>
          <td className="px-3 py-2 text-center text-muted-foreground">{formatViolationDeduction(record)}</td>
        </tr>
      ))}
    </DetailTable>
  );
}

function MonthlyInputsDetail({
  items,
  emptyMessage,
}: {
  items: Extract<CompensationCellDetailResult, { kind: 'bonus' | 'admin' }>['items'];
  emptyMessage: string;
}) {
  if (items.length === 0) return <EmptyDetail message={emptyMessage} />;
  return (
    <DetailTable headers={['النوع', 'الاتجاه', 'المبلغ', 'ملاحظة', 'التاريخ']}>
      {items.map((item) => (
        <tr key={item.id} className="border-b border-border/40 last:border-0 even:bg-muted/10">
          <td className="px-3 py-2 text-right">
            {MONTHLY_INPUT_KIND_LABELS[item.inputKind] ?? item.inputKind}
          </td>
          <td className="px-3 py-2 text-center">
            <Badge variant="outline" className="text-[10px] font-normal">
              {MONTHLY_INPUT_DIRECTION_LABELS[item.direction]}
            </Badge>
          </td>
          <td className="px-3 py-2 text-center font-mono tabular-nums">
            <MoneyAmount value={item.amount} currency={item.currency} />
          </td>
          <td className="max-w-[12rem] px-3 py-2 text-right text-muted-foreground">
            {item.note?.trim() || '—'}
          </td>
          <td className="px-3 py-2 text-center text-muted-foreground">
            <TableDateCell value={item.createdAt} mode="date" />
          </td>
        </tr>
      ))}
    </DetailTable>
  );
}

function DetailBody({
  context,
  result,
}: {
  context: CompensationCellDetailContext;
  result: CompensationCellDetailResult;
}) {
  if (result.kind === 'baseSalary') {
    return (
      <div className="space-y-3 text-sm">
        <p>
          <span className="text-muted-foreground">المبلغ: </span>
          <span className="font-mono font-semibold tabular-nums">
            <MoneyAmount value={context.row.baseSalary} currency={context.currency} fractionDigits={0} />
          </span>
        </p>
        <p className="text-muted-foreground">يُستمد من العقد النشط للموظف في هذه الفترة.</p>
      </div>
    );
  }
  if (result.kind === 'allowances') return <AllowancesPreview context={context} />;
  if (result.kind === 'net') return <NetBreakdown context={context} />;
  if (result.kind === 'advances') return <AdvancesDetail result={result} />;
  if (result.kind === 'absence') return <AbsenceDetail result={result} />;
  if (result.kind === 'lateness') return <LatenessDetail result={result} />;
  if (result.kind === 'overtime') return <OvertimeDetail result={result} />;
  if (result.kind === 'penalties') return <PenaltiesDetail result={result} />;
  if (result.kind === 'bonus') {
    return <MonthlyInputsDetail items={result.items} emptyMessage="لا توجد مكافآت مسجّلة لهذا الموظف في هذه الفترة." />;
  }
  return (
    <MonthlyInputsDetail
      items={result.items}
      emptyMessage="لا توجد إضافات أو خصومات مباشرة لهذا الموظف في هذه الفترة."
    />
  );
}

export function CompensationCellDetailDialog({
  context,
  open,
  onOpenChange,
}: {
  context: CompensationCellDetailContext | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [result, setResult] = React.useState<CompensationCellDetailResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !context) {
      setResult(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void fetchCompensationCellDetail(context)
      .then((data) => {
        if (!cancelled) setResult(data);
      })
      .catch((err) => {
        if (cancelled) return;
        const { displayMessage } = handleApiError(err, 'compensation.cell-detail');
        setLoadError(displayMessage);
        setResult(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, context]);

  if (!context) return null;

  const fieldLabel = COMPENSATION_DETAIL_FIELD_LABELS[context.field];
  const totalAmount = getCompensationPreviewFieldAmount(context.row, context.field);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'sm:max-w-2xl')} dir="rtl">
        <DialogHeader className={dialogShellHeaderClass}>
          <DialogTitle className="font-display text-base leading-snug">
            تفاصيل {fieldLabel}
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {context.row.namePrimary}
            <span className="mx-2 text-border">·</span>
            <span className="font-mono tabular-nums text-foreground">
            <MoneyAmount value={totalAmount} currency={context.currency} fractionDigits={0} />
            </span>
          </p>
        </DialogHeader>

        <div className={dialogShellBodyClass}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري تحميل التفاصيل...
            </div>
          ) : loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : result ? (
            <DetailBody context={context} result={result} />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
