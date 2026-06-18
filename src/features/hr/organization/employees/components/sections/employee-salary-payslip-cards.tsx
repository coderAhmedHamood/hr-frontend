'use client';

import Link from 'next/link';
import { Calendar, ExternalLink, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, cn } from '@/shared/utils';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { Payslip } from '@/features/hr/payroll/types';
import type { EmployeePayslipCounts } from '@/features/hr/organization/employees/hooks/useEmployeeProfileData';
import {
  PAYSLIP_STATUS_COLORS,
  PAYSLIP_STATUS_LABELS,
} from '@/features/hr/payroll/lib/api/payslips';
import { hrPayrollRoutes } from '@/features/hr/payroll/constants/routes';

type Props = {
  employeePayslipSeries: Payslip[];
  payslipCounts: EmployeePayslipCounts | null;
  payslipDistinctYears: number;
  payslipPeriod: string;
  setPayslipPeriod: (v: string) => void;
  payslipPeriodOptions: { value: string; label: string }[];
  payslipsFiltered: Payslip[];
};

export function EmployeeSalaryPayslipCards({
  employeePayslipSeries,
  payslipCounts,
  payslipDistinctYears,
  payslipPeriod,
  setPayslipPeriod,
  payslipPeriodOptions,
  payslipsFiltered,
}: Props) {
  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-elevated">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-40" aria-hidden />
        <div className="relative flex flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/25 bg-gold/10 text-gold shadow-inner-soft">
                <Receipt className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">كشوف الرواتب</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  سجل شهري من <span className="font-medium text-foreground tabular-nums">2020</span> إلى{' '}
                  <span className="font-medium text-foreground tabular-nums">2026</span> — اختر شهراً وسنة من القائمة أو «كل الكشوف».
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className="rounded-lg px-2.5 py-0.5 text-xs font-medium tabular-nums">
                    {employeePayslipSeries.length} كشفاً
                  </Badge>
                  <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 text-xs border-primary/20 text-primary bg-primary/5">
                    {payslipDistinctYears} سنة
                  </Badge>
                  {payslipPeriod !== 'all' && (
                    <Badge variant="subtle" className="rounded-lg px-2.5 py-0.5 text-xs tabular-nums">
                      عرض {payslipsFiltered.length}
                    </Badge>
                  )}
                  {payslipCounts && payslipCounts.draft > 0 && (
                    <Badge className={cn('rounded-lg px-2.5 py-0.5 text-xs border', PAYSLIP_STATUS_COLORS.draft)}>
                      {payslipCounts.draft} مسودة
                    </Badge>
                  )}
                  {payslipCounts && payslipCounts.approved > 0 && (
                    <Badge className={cn('rounded-lg px-2.5 py-0.5 text-xs border', PAYSLIP_STATUS_COLORS.approved)}>
                      {payslipCounts.approved} معتمدة
                    </Badge>
                  )}
                  {payslipCounts && payslipCounts.paid > 0 && (
                    <Badge className={cn('rounded-lg px-2.5 py-0.5 text-xs border', PAYSLIP_STATUS_COLORS.paid)}>
                      {payslipCounts.paid} مدفوعة
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[260px] lg:shrink-0">
              <div className="space-y-1.5">
                <Label htmlFor="payslip-period" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden />
                  شهر وسنة، أو سنة كاملة
                </Label>
                <Select value={payslipPeriod} onValueChange={setPayslipPeriod}>
                  <SelectTrigger id="payslip-period" className="h-10 w-full rounded-xl border-border bg-background/90 shadow-xs">
                    <SelectValue placeholder="كل الكشوف" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {payslipPeriodOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-sm">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="h-10 w-full rounded-xl gap-2 border-border bg-background/80 shadow-xs lg:w-auto" asChild>
                <Link href={hrPayrollRoutes.payrollPeriods} className="inline-flex items-center justify-center">
                  <ExternalLink className="h-3.5 w-3.5" />
                  صفحة الرواتب
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {employeePayslipSeries.length > 0 ? (
        <div className="max-h-[min(72vh,820px)] overflow-y-auto overscroll-contain rounded-3xl border border-border/50 bg-muted/20 p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {payslipsFiltered.length > 0 ? (
              payslipsFiltered.map((p) => (
                <article
                  key={p.id}
                  className={cn(
                    'group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all duration-200',
                    'hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md',
                  )}
                >
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-bl from-gold/5 via-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  <div className="relative flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground tracking-tight">{p.month}</h3>
                          <Badge
                            className={cn(
                              'rounded-lg border px-2 py-0.5 text-[10px] font-semibold',
                              PAYSLIP_STATUS_COLORS[p.status],
                            )}
                          >
                            {PAYSLIP_STATUS_LABELS[p.status]}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">{p.year}</p>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/15">
                        <Wallet className="h-4 w-4" aria-hidden />
                      </span>
                    </div>
                    <div className="rounded-xl border border-gold/20 bg-gold/5 px-3 py-2.5">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">الصافي</p>
                      <p className="font-arabic-display text-lg font-semibold tabular-nums text-gold leading-tight mt-1">
                        {formatCurrency(p.net)}
                      </p>
                    </div>
                    <dl className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="rounded-lg border border-border/50 bg-muted/30 px-1.5 py-2">
                        <dt className="text-[10px] text-muted-foreground leading-tight">عمل</dt>
                        <dd className="font-arabic-display text-xs font-semibold tabular-nums text-foreground mt-1">{p.workingDays}</dd>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-muted/30 px-1.5 py-2">
                        <dt className="text-[10px] text-muted-foreground leading-tight">حضور</dt>
                        <dd className="font-arabic-display text-xs font-semibold tabular-nums text-success mt-1">{p.presentDays}</dd>
                      </div>
                      <div className={cn(
                        'rounded-lg border px-1.5 py-2',
                        p.lateDays > 0 ? 'border-warning/30 bg-warning/5' : 'border-border/50 bg-muted/30',
                      )}
                      >
                        <dt className={cn('text-[10px] leading-tight', p.lateDays > 0 ? 'text-warning' : 'text-muted-foreground')}>تأخير</dt>
                        <dd className={cn('font-arabic-display text-xs font-semibold tabular-nums mt-1', p.lateDays > 0 ? 'text-warning' : 'text-muted-foreground')}>{p.lateDays}</dd>
                      </div>
                      <div className={cn(
                        'rounded-lg border px-1.5 py-2',
                        p.absentDays > 0 ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-muted/30',
                      )}
                      >
                        <dt className={cn('text-[10px] leading-tight', p.absentDays > 0 ? 'text-destructive' : 'text-muted-foreground')}>غياب</dt>
                        <dd className={cn('font-arabic-display text-xs font-semibold tabular-nums mt-1', p.absentDays > 0 ? 'text-destructive' : 'text-muted-foreground')}>{p.absentDays}</dd>
                      </div>
                    </dl>
                  </div>
                </article>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-card/50">
                <Receipt className="h-8 w-8 opacity-40 mb-2" aria-hidden />
                <p className="text-sm">لا يوجد كشف لهذه الفترة.</p>
                <Button type="button" variant="link" className="text-primary h-auto p-0 mt-2" onClick={() => setPayslipPeriod('all')}>
                  عرض كل الكشوف
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Empty icon={Receipt} text="لا توجد كشوف رواتب" />
      )}
    </>
  );
}
