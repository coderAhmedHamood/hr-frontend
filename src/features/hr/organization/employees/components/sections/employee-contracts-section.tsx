'use client';

import Link from 'next/link';
import { ExternalLink, FileSignature, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { MoneyAmount } from '@/components/ui/sar-amount';
import { formatNumber, cn } from '@/shared/utils';
import { Empty, SectionH } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { hrContractsRoutes } from '@/features/hr/contracts/constants/routes';

import {
  TEMPLATE_CONTRACT_NATURE_LABELS,
  TEMPLATE_WORK_ARRANGEMENT_LABELS,
} from '@/features/hr/contracts/contract-templates/constants/contract-template-options';

const NATURE_LABELS: Record<string, string> = TEMPLATE_CONTRACT_NATURE_LABELS;
const ARRANGEMENT_LABELS: Record<string, string> = TEMPLATE_WORK_ARRANGEMENT_LABELS;

export function EmployeeContractsSection({ model }: { model: EmployeeProfileModel }) {
  const { employeeContracts } = model;

  return (
    <section>
      <SectionH
        icon={FileSignature}
        title="العقود"
        subtitle="العقود الحالية والسابقة"
        action={(
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
            <Link href={hrContractsRoutes.root}><ExternalLink className="h-3 w-3" />إدارة العقود</Link>
          </Button>
        )}
      />
      {employeeContracts.length > 0 ? (() => {
        const sorted = [...employeeContracts].sort((a, b) => b.startDate.localeCompare(a.startDate));
        return (
          <div className="relative">
            <div className="absolute right-[15px] top-4 bottom-4 w-px bg-border" />
            <div className="space-y-2">
              {sorted.map((c, idx) => {
                const isActive = c.status === 'active';
                const isFirst = idx === sorted.length - 1;
                const allowTotal = c.allowanceLines.reduce((s, l) => s + l.amount, 0);
                return (
                  <div key={c.id} className="relative flex items-start gap-3">
                    <div className="relative z-10 mt-3 flex shrink-0 flex-col items-center" style={{ width: 32 }}>
                      <div className={cn(
                        'h-3 w-3 rounded-full border-2',
                        isActive ? 'border-primary bg-primary' : 'border-border bg-background',
                      )}
                      />
                    </div>
                    <div className={cn(
                      'flex-1 min-w-0 rounded-xl border bg-card transition-colors hover:bg-muted/20 mb-0.5',
                      isActive ? 'border-primary/30' : 'border-border/70',
                    )}
                    >
                      <div className="flex items-start gap-3 px-4 py-3">
                        <div className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums mt-0.5',
                          isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                        )}
                        >
                          {c.startDate.slice(0, 4)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm font-semibold truncate">{c.contractNumber}</span>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                  جارٍ
                                </span>
                              )}
                              {isFirst && c.probationDays && (
                                <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  تجربة {c.probationDays}ي
                                </span>
                              )}
                            </div>
                            <StatusBadge status={c.status} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.startDate} <span className="mx-1 opacity-40">←</span> {c.endDate || 'غير محدد'}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {c.contractType && (
                              <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {NATURE_LABELS[c.contractType] ?? c.contractType}
                              </span>
                            )}
                            {c.workArrangement && (
                              <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {ARRANGEMENT_LABELS[c.workArrangement] ?? c.workArrangement}
                              </span>
                            )}
                            {c.annualLeaveDays != null && (
                              <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                إجازة {c.annualLeaveDays}ي
                              </span>
                            )}
                            {c.branchNameAr && (
                              <span className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {c.branchNameAr}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span className="text-xs text-muted-foreground">
                              أساسي: <MoneyAmount value={c.baseSalary} fractionDigits={0} className="font-semibold text-foreground" />
                            </span>
                            {allowTotal > 0 && (
                              <span className="text-xs text-muted-foreground">
                                بدلات: <MoneyAmount value={allowTotal} fractionDigits={0} prefix="+" className="font-semibold text-foreground" />
                              </span>
                            )}
                            {allowTotal > 0 && (
                              <span className="text-xs font-semibold text-primary tabular-nums">
                                = <MoneyAmount value={c.baseSalary + allowTotal} fractionDigits={0} className="font-semibold text-primary" /> / شهر
                              </span>
                            )}
                          </div>
                          {c.allowanceLines.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {c.allowanceLines.map((al, i) => (
                                <span key={i} className="rounded border border-border bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                                  {al.allowanceTypeNameAr || al.allowanceTypeCode || 'بدل'} {formatNumber(al.amount)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })() : (
        <Empty
          icon={FileSignature}
          text="لا توجد عقود مسجلة"
          action={(
            <Button variant="outline" size="sm" asChild>
              <Link href={hrContractsRoutes.root}>
                <Plus className="h-3.5 w-3.5 ml-1" />
                إضافة عقد
              </Link>
            </Button>
          )}
        />
      )}
    </section>
  );
}
