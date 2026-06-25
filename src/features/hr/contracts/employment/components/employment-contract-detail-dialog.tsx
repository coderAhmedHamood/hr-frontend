'use client';

import * as React from 'react';
import {
  Loader2, User, FileDown, PenLine, CalendarRange, Coins, Briefcase, FileText, Building2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DisplayDate } from '@/components/ui/table-cells';
import { employeeContractsApi, type ApiContractArticleRef } from '@/features/hr/contracts/lib/contracts-api';
import {
  mapEmployeeContractFromApi,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  contractNatureLabel,
  workArrangementLabel,
  type HRContractRecord,
} from '@/features/hr/contracts/lib/contracts-store';
import { EmploymentContractSignatureCard } from '@/features/hr/contracts/employment/components/employment-contract-signature-card';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { cn, formatNumber } from '@/shared/utils';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-2.5 last:border-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 text-left text-xs font-medium">{value ?? '—'}</span>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/10">
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-2.5">
        {Icon ? <Icon className="h-3.5 w-3.5 text-primary" /> : null}
        <p className="text-xs font-bold text-foreground">{title}</p>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

type Props = {
  contractId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditDraft?: (contract: HRContractRecord) => void;
  onDownloadPdf?: (contract: HRContractRecord) => void;
  onLoaded?: (contract: HRContractRecord) => void;
  refreshKey?: number;
};

export function EmploymentContractDetailDialog({
  contractId,
  open,
  onOpenChange,
  onEditDraft,
  onDownloadPdf,
  onLoaded,
  refreshKey = 0,
}: Props) {
  const [contract, setContract] = React.useState<HRContractRecord | null>(null);
  const [articles, setArticles] = React.useState<ApiContractArticleRef[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !contractId) {
      setContract(null);
      setArticles([]);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    void employeeContractsApi.get(contractId)
      .then((data) => {
        if (cancelled) return;
        const record = mapEmployeeContractFromApi(data);
        setContract(record);
        setArticles(data.articles ?? []);
        onLoaded?.(record);
      })
      .catch((err) => {
        if (cancelled) return;
        const { displayMessage } = handleApiError(err, 'employment-contract.detail');
        setLoadError(displayMessage);
        setContract(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [open, contractId, refreshKey, onLoaded]);

  const allowanceTotal = contract?.allowanceLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0) ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border-border p-0"
        dir="rtl"
      >
        <div className="shrink-0 border-b border-border/60 bg-linear-to-b from-primary/6 to-transparent px-6 pb-4 pt-6">
          <DialogHeader className="space-y-2 text-right">
            <DialogTitle className="font-display text-lg leading-tight">
              {contract?.employeeNameAr || 'عقد العمل'}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs" dir="ltr">
              {contract?.contractNumber ?? 'جاري التحميل…'}
            </DialogDescription>
          </DialogHeader>

          {contract ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn('rounded-lg px-2 py-0.5 text-[10px] font-semibold', CONTRACT_STATUS_COLORS[contract.status])}
              >
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
              <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[10px] font-medium">
                {contractNatureLabel(contract.contractType)}
              </Badge>
              <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[10px] font-medium">
                {workArrangementLabel(contract.workArrangement)}
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : loadError ? (
            <p className="py-12 text-center text-sm text-destructive">{loadError}</p>
          ) : !contract ? (
            <p className="py-12 text-center text-sm text-muted-foreground">تعذر تحميل تفاصيل العقد.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-border/60 bg-card px-3 py-3 text-center">
                  <Coins className="mx-auto mb-1 h-4 w-4 text-gold" />
                  <p className="text-[10px] text-muted-foreground">الراتب الأساسي</p>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums">
                    {formatNumber(contract.baseSalary)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{contract.currency}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card px-3 py-3 text-center">
                  <Briefcase className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-[10px] text-muted-foreground">إجمالي البدلات</p>
                  <p className="mt-0.5 font-mono text-sm font-bold tabular-nums">
                    {formatNumber(allowanceTotal)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{contract.currency}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-3 text-center sm:col-span-1">
                  <CalendarRange className="mx-auto mb-1 h-4 w-4 text-primary" />
                  <p className="text-[10px] text-muted-foreground">مدة العقد</p>
                  <p className="mt-0.5 text-xs font-semibold tabular-nums">
                    {contract.startDate}
                    {contract.endDate ? ` → ${contract.endDate}` : ''}
                  </p>
                </div>
              </div>

              <EmploymentContractSignatureCard
                signed={contract.employeeSigned}
                rejectionReason={contract.rejectionReason}
                contractStatus={contract.status}
                variant="detailed"
              />

              <Section title="الموظف والفرع" icon={User}>
                <DetailRow label="الموظف" value={contract.employeeNameAr || contract.employeeId} />
                <DetailRow label="الفرع" value={contract.branchNameAr || '—'} />
              </Section>

              <Section title="بيانات العقد" icon={FileText}>
                <DetailRow label="نوع العقد" value={contractNatureLabel(contract.contractType)} />
                <DetailRow label="نوع الدوام" value={workArrangementLabel(contract.workArrangement)} />
                <DetailRow label="تاريخ البداية" value={contract.startDate} />
                <DetailRow label="تاريخ الانتهاء" value={contract.endDate || '—'} />
                <DetailRow
                  label="فترة التجربة"
                  value={contract.probationDays != null ? `${contract.probationDays} يوم` : '—'}
                />
                <DetailRow
                  label="الإجازات السنوية"
                  value={contract.annualLeaveDays != null ? `${contract.annualLeaveDays} يوم` : '—'}
                />
                {contract.signedAt ? (
                  <DetailRow
                    label="تاريخ الموافقة"
                    value={<DisplayDate value={contract.signedAt} mode="datetime" />}
                  />
                ) : null}
                <DetailRow
                  label="آخر تحديث"
                  value={<DisplayDate value={contract.updatedAt} mode="datetime" />}
                />
              </Section>

              {contract.allowanceLines.length > 0 ? (
                <Section title="البدلات" icon={Building2}>
                  <ul className="divide-y divide-border/40">
                    {contract.allowanceLines
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((line) => (
                        <li key={line.allowanceTypeId} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-xs font-medium">{line.allowanceTypeNameAr || line.allowanceTypeCode}</p>
                            {line.allowanceTypeCode ? (
                              <p className="font-mono text-[10px] text-muted-foreground">{line.allowanceTypeCode}</p>
                            ) : null}
                          </div>
                          <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">
                            {formatNumber(Number(line.amount) || 0)} {contract.currency}
                          </span>
                        </li>
                      ))}
                  </ul>
                </Section>
              ) : null}

              {(contract.allowancesNote || contract.deductionsNote) ? (
                <Section title="ملاحظات">
                  {contract.allowancesNote ? (
                    <DetailRow label="ملاحظات البدلات" value={contract.allowancesNote} />
                  ) : null}
                  {contract.deductionsNote ? (
                    <DetailRow label="ملاحظات الخصومات" value={contract.deductionsNote} />
                  ) : null}
                </Section>
              ) : null}

              {articles.length > 0 ? (
                <Section title={`مواد العقد (${articles.length})`} icon={FileText}>
                  <ul className="divide-y divide-border/40">
                    {articles
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((article) => (
                        <li key={article.id} className="py-2.5">
                          <div className="flex items-center gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">{article.articleCode}</span>
                          </div>
                          <p className="text-xs font-medium">{article.titleAr}</p>
                        </li>
                      ))}
                  </ul>
                </Section>
              ) : null}

              {contract.earlyTerminationReason ? (
                <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                  سبب الإنهاء: {contract.earlyTerminationReason}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {contract ? (
          <DialogFooter className={dialogFormFooterClass}>
            {onEditDraft ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => onEditDraft(contract)}
              >
                <PenLine className="h-3.5 w-3.5 shrink-0" />
                تعديل المسودة
              </Button>
            ) : null}
            {onDownloadPdf ? (
              <Button
                type="button"
                variant="luxe"
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => onDownloadPdf(contract)}
              >
                <FileDown className="h-3.5 w-3.5 shrink-0" />
                معاينة / تنزيل PDF
              </Button>
            ) : null}
            <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
