'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  ExternalLink,
  FileSearch,
  Gavel,
  ChevronDown,
  Paperclip,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, cn } from '@/shared/utils';
import { Empty } from '@/features/hr/organization/employees/components/EmployeeProfilePrimitives';
import { EmployeeProfilePagedList } from '@/features/hr/organization/employees/components/employee-profile-paged-list';
import type { EmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  pending: { label: 'قيد المراجعة', cls: 'border-gold/30 bg-gold/10 text-gold', dot: 'bg-gold' },
  approved: { label: 'معتمد', cls: 'border-success/30 bg-success/10 text-success', dot: 'bg-success' },
  rejected: { label: 'مرفوض', cls: 'border-destructive/30 bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  needs_edit: { label: 'يحتاج تعديل', cls: 'border-warning/30 bg-warning/10 text-warning', dot: 'bg-warning' },
};

function deductionLabel(value: number, kind: 'amount' | 'hours' | 'day'): string {
  const unit = kind === 'amount' ? 'ريال' : kind === 'day' ? 'يوم' : 'ساعة';
  return `${value} ${unit}`;
}

const RESULT_LABELS: Record<string, string> = { proven: 'ثابتة', not_proven: 'غير ثابتة' };
const RECOMMENDATION_LABELS: Record<string, string> = { warning: 'إنذار', deduction: 'خصم' };

export function EmployeeViolationsSection({ model }: { model: EmployeeProfileModel }) {
  const { employee, employeeViolations, violationsLoading, violationsPagination, violationsTotal } = model;
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  if (violationsLoading && employeeViolations.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل المخالفات…
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-arabic-display text-lg font-semibold tracking-tight text-foreground">
            <AlertTriangle className="h-5 w-5 shrink-0 text-primary" />
            المخالفات
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">سجل المخالفات والإنذارات</p>
        </div>
        <Button variant="ghost" size="sm" className="h-9 shrink-0 gap-1.5 text-xs" asChild>
          <Link href="/hr/discipline/cases">
            <ExternalLink className="h-3.5 w-3.5" />
            السجل الكامل
          </Link>
        </Button>
      </div>

      <div className="flex h-[68vh] min-h-[400px] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            سجل المخالفات
            <span className="mr-2 text-xs font-normal text-muted-foreground">
              ({violationsTotal})
            </span>
          </h3>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EmployeeProfilePagedList
            fillParent
            items={employeeViolations}
            serverPagination={violationsPagination}
            loading={violationsLoading}
            empty={(
              <Empty icon={Award} text={`سجل نظيف — لا توجد مخالفات لـ ${employee.name}`} />
            )}
            renderItems={(pageViolations) => (
              <div className="space-y-2.5">
                {pageViolations.map((v) => {
                  const status = STATUS_META[v.status] ?? STATUS_META.pending!;
                  const hasInvestigations = v.investigations.length > 0;
                  const isExpanded = expanded.has(v.id);
                  return (
                    <div
                      key={v.id}
                      className="rounded-xl border border-border/70 bg-card transition-all hover:shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-semibold">{v.typeNameAr}</span>
                              {v.recordNumber && (
                                <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground" dir="ltr">
                                  {v.recordNumber}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {formatDate(v.date)}
                              {v.description && <> <span className="mx-1.5 text-muted-foreground/40">·</span> {v.description}</>}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              {v.typeHasDeduction && (
                                <span className="inline-flex items-center gap-1 text-xs text-destructive">
                                  <Gavel className="h-3 w-3" />
                                  خصم {deductionLabel(v.typeDeductionValue, v.typeDeductionKind)}
                                </span>
                              )}
                              {v.needsInvestigation && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <FileSearch className="h-3 w-3" />
                                  يتطلب تحقيق
                                </span>
                              )}
                              {v.attachmentsNote && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground" title={v.attachmentsNote}>
                                  <Paperclip className="h-3 w-3" />
                                  مرفقات
                                </span>
                              )}
                            </div>
                            {v.notes && (
                              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/90">
                                <span className="text-muted-foreground/60">ملاحظات:</span> {v.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium', status.cls)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                          {status.label}
                        </span>
                      </div>

                      {hasInvestigations && (
                        <div className="border-t border-border/50">
                          <button
                            type="button"
                            onClick={() => toggle(v.id)}
                            className="flex w-full items-center justify-between gap-2 px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30"
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <FileSearch className="h-3.5 w-3.5" />
                              التحقيقات ({v.investigations.length})
                            </span>
                            <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                          </button>
                          {isExpanded && (
                            <div className="space-y-2 px-4 pb-3">
                              {v.investigations.map((inv) => (
                                <div key={inv.id} className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">{inv.investigationDate}</span>
                                    <div className="flex items-center gap-1.5">
                                      {inv.result && (
                                        <span className={cn(
                                          'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                          inv.result === 'proven'
                                            ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                            : 'border-success/30 bg-success/10 text-success',
                                        )}>
                                          {RESULT_LABELS[inv.result] ?? inv.result}
                                        </span>
                                      )}
                                      {inv.recommendation && (
                                        <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                                          التوصية: {RECOMMENDATION_LABELS[inv.recommendation] ?? inv.recommendation}
                                          {inv.recommendation === 'deduction' && inv.deductionValue > 0 && (
                                            <> — {deductionLabel(inv.deductionValue, inv.deductionKind)}</>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {inv.employeeStatement && (
                                    <p className="text-xs leading-relaxed text-foreground/90">
                                      <span className="text-muted-foreground/70">إفادة الموظف:</span> {inv.employeeStatement}
                                    </p>
                                  )}
                                  {inv.witnessStatement && (
                                    <p className="text-xs leading-relaxed text-foreground/90">
                                      <span className="text-muted-foreground/70">إفادة الشاهد:</span> {inv.witnessStatement}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          />
        </div>
      </div>
    </section>
  );
}
