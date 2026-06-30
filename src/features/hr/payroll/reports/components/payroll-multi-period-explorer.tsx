'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  Loader2,
  UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  ListFilterBar,
  type ListFilterInlineSelect,
} from '@/components/ui/list-filter-bar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { useHRPayrollPeriodsStore, PERIOD_STATUS_LABELS } from '@/features/hr/payroll/lib/payroll-periods-store';
import {
  mapEmployeesPayrollSummaryToPreviews,
  mapPreviewsToPayrollPrintRows,
  sumPayrollPrintRows,
} from '@/features/hr/payroll/lib/compensation-preview';
import { useEmployeesPayrollSummary } from '@/features/hr/payroll/compensation/hooks/useEmployeesPayrollSummary';
import { CompensationReportPanel } from '@/features/hr/payroll/compensation/components/compensation-report-panel';
import { hrPayrollSalaryApprovalsQueryHref, hrPayrollRoutes } from '@/features/hr/payroll/constants/routes';
import { PayrollPrintHtml } from './payroll-print-html';
import { exportDomToPdf } from '@/components/pdf/lib/exportDomToPdf';

const PERIOD_STATUS_LABEL = PERIOD_STATUS_LABELS;

export function PayrollMultiPeriodExplorer() {
  const { periods } = useHRPayrollPeriodsStore();

  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => periods[0]?.id ?? null,
  );
  const { data: payrollSummary } = useEmployeesPayrollSummary(selectedId);
  const [empFilter, setEmpFilter] = React.useState<Set<string>>(() => new Set());
  const [downloading, setDownloading] = React.useState(false);
  const [pdfExporting, setPdfExporting] = React.useState(false);
  const [pdfPrintMounted, setPdfPrintMounted] = React.useState(false);
  const payrollPrintRef = React.useRef<HTMLDivElement>(null);

  const sortedPeriods = React.useMemo(
    () => [...periods].sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '', 'ar')),
    [periods],
  );

  React.useEffect(() => {
    if (selectedId && sortedPeriods.some((p) => p.id === selectedId)) return;
    if (sortedPeriods.length > 0) setSelectedId(sortedPeriods[0]!.id);
  }, [sortedPeriods, selectedId]);

  const selectedPeriod = React.useMemo(
    () => periods.find(p => p.id === selectedId) ?? null,
    [periods, selectedId],
  );

  const periodEmployees = React.useMemo(() => {
    if (!payrollSummary) return [] as { id: string; name: string }[];
    return payrollSummary.employees.map((row) => ({
      id: row.employeeId,
      name: row.employeeNameAr?.trim() || '—',
    }));
  }, [payrollSummary]);

  React.useEffect(() => {
    setEmpFilter(new Set());
  }, [selectedId]);

  const empFilterKey = React.useMemo(() => [...empFilter].sort().join(','), [empFilter]);

  const employeeIdsForFilter = React.useMemo(() => {
    if (!selectedPeriod || periodEmployees.length === 0) return undefined;
    if (empFilter.size === 0 || empFilter.size >= periodEmployees.length) return undefined;
    return [...empFilter];
  }, [selectedPeriod?.id, periodEmployees.length, empFilterKey]);

  const activeFilterCount =
    empFilter.size > 0 && periodEmployees.length > 0 && empFilter.size < periodEmployees.length ? 1 : 0;

  const periodDropdownOptions = React.useMemo(
    () => sortedPeriods.map(p => ({
      value: p.id,
      label: `${(p.nameAr || p.code).trim()} — ${PERIOD_STATUS_LABEL[p.status] ?? p.status}`,
    })),
    [sortedPeriods],
  );

  const inlineSelects = React.useMemo((): ListFilterInlineSelect[] => [
    {
      id: 'period',
      value: selectedId ?? '',
      onChange: (v) => setSelectedId(v && v !== 'all' ? v : null),
      placeholder: 'فترة الراتب',
      className: 'w-[13rem] max-w-[13rem]',
      options: periodDropdownOptions,
    },
  ], [selectedId, periodDropdownOptions]);

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        inlineSelects={inlineSelects}
        empPickerEmployees={periodEmployees}
        selectedEmpIds={empFilter}
        onSelectedEmpIdsChange={setEmpFilter}
        onDateBoundsChange={() => {}}
      />
    ),
    [inlineSelects, periodEmployees, empFilter],
  );

  const payrollPrintData = React.useMemo(() => {
    if (!selectedPeriod || !payrollSummary) return null;
    let previews = mapEmployeesPayrollSummaryToPreviews(payrollSummary);
    if (employeeIdsForFilter?.length) {
      const allow = new Set(employeeIdsForFilter);
      previews = previews.filter(r => allow.has(r.employeeId));
    }
    const rows = mapPreviewsToPayrollPrintRows(previews);
    return {
      monthNameAr: selectedPeriod.nameAr || selectedPeriod.code,
      branchNameAr: 'المقر الرئيسي',
      rows,
      totals: sumPayrollPrintRows(rows),
    };
  }, [selectedPeriod, payrollSummary, employeeIdsForFilter]);

  const handleDownloadPdf = React.useCallback(async () => {
    if (!payrollPrintData || !selectedPeriod) {
      alert('لا توجد بيانات للتصدير');
      return;
    }
    setPdfExporting(true);
    setPdfPrintMounted(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const el = payrollPrintRef.current;
      if (!el) {
        alert('تعذر العثور على منطقة الطباعة');
        return;
      }
      await exportDomToPdf(el, `payroll-${selectedPeriod.code}.pdf`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير PDF');
    } finally {
      setPdfExporting(false);
      setPdfPrintMounted(false);
    }
  }, [payrollPrintData, selectedPeriod]);

  const handleDownloadExcel = React.useCallback(async () => {
    if (!selectedPeriod || !payrollSummary) return;
    setDownloading(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      let previews = mapEmployeesPayrollSummaryToPreviews(payrollSummary);
      if (employeeIdsForFilter?.length) {
        const allow = new Set(employeeIdsForFilter);
        previews = previews.filter(r => allow.has(r.employeeId));
      }
      const headers = [
        '#', 'اسم الموظف', 'الراتب الأساسي', 'البدلات',
        'أوفر تايم', 'مكافآت', 'الإجمالي', 'السلف',
        'غياب', 'تأخير', 'جزاءات', 'إضافة/خصم مباشر', 'الصافي',
      ];
      const rows = previews.map((r, i) => [
        i + 1,
        r.namePrimary,
        r.baseSalary,
        r.allowancesMonthlyTotal,
        r.entitlementOvertimeSar,
        r.entitlementBonusSar,
        r.grossSar,
        r.dedAdvancesSar,
        r.dedAbsenceSar,
        r.dedLateSar,
        r.dedPenaltiesSar,
        r.dedAdminSar,
        r.lineNetSar,
      ]);
      const totalRow = [
        '', 'المجموع',
        previews.reduce((s, r) => s + r.baseSalary, 0),
        previews.reduce((s, r) => s + r.allowancesMonthlyTotal, 0),
        previews.reduce((s, r) => s + r.entitlementOvertimeSar, 0),
        previews.reduce((s, r) => s + r.entitlementBonusSar, 0),
        previews.reduce((s, r) => s + r.grossSar, 0),
        previews.reduce((s, r) => s + r.dedAdvancesSar, 0),
        previews.reduce((s, r) => s + r.dedAbsenceSar, 0),
        previews.reduce((s, r) => s + r.dedLateSar, 0),
        previews.reduce((s, r) => s + r.dedPenaltiesSar, 0),
        previews.reduce((s, r) => s + r.dedAdminSar, 0),
        previews.reduce((s, r) => s + r.lineNetSar, 0),
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, totalRow]);
      ws['!cols'] = [
        { wch: 4 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
        { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, (selectedPeriod.nameAr || selectedPeriod.code).slice(0, 31));
      XLSX.writeFile(wb, `payroll-${selectedPeriod.code}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء ملف Excel');
    } finally {
      setDownloading(false);
    }
  }, [selectedPeriod, payrollSummary, employeeIdsForFilter]);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="secondary" size="sm" className="h-8 gap-1.5 text-xs shrink-0" asChild disabled={!selectedId}>
          <Link
            href={
              selectedId
                ? hrPayrollSalaryApprovalsQueryHref(selectedId)
                : hrPayrollRoutes.payrollSalaryApprovals
            }
          >
            <UserCheck className="h-3.5 w-3.5" />
            كشف موافقة الموظفين
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 shrink-0"
              disabled={!selectedId || downloading || pdfExporting}
              aria-label="تصدير مسير الرواتب"
            >
              {(downloading || pdfExporting)
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <FileDown className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled={pdfExporting || !selectedId} onSelect={() => void handleDownloadPdf()}>
              <FileText className="h-4 w-4" />
              PDF
            </DropdownMenuItem>
            <DropdownMenuItem disabled={downloading || !selectedId} onSelect={() => void handleDownloadExcel()}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    [activeFilterCount, selectedId, downloading, pdfExporting, handleDownloadPdf, handleDownloadExcel],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 animate-fade-in" dir="rtl">
      {pdfPrintMounted && payrollPrintData && (
        <div
          aria-hidden
          className="pointer-events-none fixed start-0 top-0 -z-[9999] size-0 overflow-hidden"
        >
          <PayrollPrintHtml
            ref={payrollPrintRef}
            monthNameAr={payrollPrintData.monthNameAr}
            branchNameAr={payrollPrintData.branchNameAr}
            rows={payrollPrintData.rows}
            totals={payrollPrintData.totals}
          />
        </div>
      )}

      {!selectedPeriod ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">اختر فترة لاستعراض بيانات المسير</p>
        </div>
      ) : (
        <CompensationReportPanel
          periodId={selectedPeriod.id}
          embedded
          employeeIdsFilter={employeeIdsForFilter}
        />
      )}
    </div>
  );
}
