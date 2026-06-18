'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Download, FileSpreadsheet, FileText, Loader2, UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { useHRPayrollPeriodsStore, PERIOD_STATUS_LABELS } from '@/features/hr/payroll/lib/payroll-periods-store';
import { useHRContractsStore } from '@/features/hr/contracts/lib/contracts-store';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import {
  buildCompensationPreviews,
} from '@/features/hr/payroll/lib/compensation-preview';
import { CompensationReportPanel } from '@/features/hr/payroll/compensation/components/compensation-report-panel';
import { hrPayrollSalaryApprovalsQueryHref, hrPayrollRoutes } from '@/features/hr/payroll/constants/routes';
import { MinimalDropdown } from '@/features/hr/requests/components/shared-ui';
import { PayrollPrintHtml } from './payroll-print-html';
import { exportDomToPdf } from '@/components/pdf/lib/exportDomToPdf';

const PERIOD_STATUS_LABEL = PERIOD_STATUS_LABELS;

export function PayrollMultiPeriodExplorer() {
  const { periods } = useHRPayrollPeriodsStore();
  const contracts    = useHRContractsStore(s => s.contracts);
  const allowanceTypes = useHRAllowanceTypesStore(s => s.items);

  const [selectedId, setSelectedId] = React.useState<string | null>(
    () => periods[0]?.id ?? null,
  );
  const [empFilter, setEmpFilter] = React.useState<Set<string>>(() => new Set());
  const [downloading, setDownloading] = React.useState(false);
  const [pdfExporting, setPdfExporting] = React.useState(false);
  const [pdfPrintMounted, setPdfPrintMounted] = React.useState(false);
  const payrollPrintRef = React.useRef<HTMLDivElement>(null);

  const selectedPeriod = React.useMemo(
    () => periods.find(p => p.id === selectedId) ?? null,
    [periods, selectedId],
  );

  const periodEmployees = React.useMemo(() => {
    if (!selectedPeriod) return [] as { id: string; name: string }[];
    const seen = new Map<string, string>();
    for (const l of selectedPeriod.employmentLines) {
      if (!seen.has(l.employeeId)) seen.set(l.employeeId, l.employeeNameAr);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [selectedPeriod]);

  React.useEffect(() => {
    setEmpFilter(new Set());
  }, [selectedId]);

  const empFilterKey = React.useMemo(() => [...empFilter].sort().join(','), [empFilter]);

  const employeeIdsForFilter = React.useMemo(() => {
    if (!selectedPeriod || periodEmployees.length === 0) return undefined;
    if (empFilter.size === 0 || empFilter.size >= periodEmployees.length) return undefined;
    return [...empFilter];
  }, [selectedPeriod?.id, periodEmployees.length, empFilterKey]);

  const payrollPrintData = React.useMemo(() => {
    if (!selectedPeriod) return null;
    const getContract = (id: string) => contracts.find(c => c.id === id);
    const getAlloType = (id: string) => allowanceTypes.find(a => a.id === id);
    let previews = buildCompensationPreviews(selectedPeriod, getContract, getAlloType);
    if (employeeIdsForFilter?.length) {
      const allow = new Set(employeeIdsForFilter);
      previews = previews.filter(r => allow.has(r.employeeId));
    }
    const branchName = selectedPeriod.employmentLines[0]?.departmentSnapshot ?? 'المقر الرئيسي';
    return {
      monthNameAr: selectedPeriod.nameAr || selectedPeriod.code,
      branchNameAr: branchName,
      rows: previews.map((r, i) => ({
        no: i + 1,
        employeeName: r.namePrimary,
        baseSalary: r.baseSalary,
        bonusOrOvertime: r.entitlementOvertimeSar + r.entitlementBonusSar,
        totalSalary: r.lineNetSar,
      })),
    };
  }, [selectedPeriod, contracts, allowanceTypes, employeeIdsForFilter]);

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

  /* ── Excel download ──────────────────────────────────────────────────── */
  const handleDownloadExcel = async () => {
    if (!selectedPeriod) return;
    setDownloading(true);
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      const getContract  = (id: string) => contracts.find(c => c.id === id);
      const getAlloType   = (id: string) => allowanceTypes.find(a => a.id === id);

      let previews = buildCompensationPreviews(selectedPeriod, getContract, getAlloType);
      if (employeeIdsForFilter?.length) {
        const allow = new Set(employeeIdsForFilter);
        previews = previews.filter(r => allow.has(r.employeeId));
      }
      const headers = [
        '#', 'اسم الموظف', 'القسم', 'الراتب الأساسي', 'البدلات',
        'مستحقات (أوفرتايم + مكافآت)', 'خصومات (غياب + تأخير + جزاءات)', 'الصافي',
      ];
      const rows = previews.map((r, i) => [
        i + 1,
        r.namePrimary,
        selectedPeriod.employmentLines.find(l => l.id === r.lineId)?.departmentSnapshot ?? '',
        r.baseSalary,
        r.allowancesMonthlyTotal,
        r.entitlementOvertimeSar + r.entitlementBonusSar,
        r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar,
        r.lineNetSar,
      ]);
      const totalRow = [
        '', 'المجموع', '',
        previews.reduce((s, r) => s + r.baseSalary, 0),
        previews.reduce((s, r) => s + r.allowancesMonthlyTotal, 0),
        previews.reduce((s, r) => s + r.entitlementOvertimeSar + r.entitlementBonusSar, 0),
        previews.reduce((s, r) => s + r.dedAbsenceSar + r.dedLateSar + r.dedPenaltiesSar, 0),
        previews.reduce((s, r) => s + r.lineNetSar, 0),
      ];
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, totalRow]);
      ws['!cols'] = [
        { wch: 4 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 28 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, (selectedPeriod.nameAr || selectedPeriod.code).slice(0, 31));
      XLSX.writeFile(wb, `payroll-${selectedPeriod.code}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إنشاء ملف Excel');
    } finally {
      setDownloading(false);
    }
  };

  const sortedPeriods = React.useMemo(
    () => [...periods].sort((a, b) => (a.code ?? '').localeCompare(b.code ?? '', 'ar')),
    [periods],
  );

  const periodDropdownOptions = React.useMemo(
    () => sortedPeriods.map(p => ({
      value: p.id,
      label: `${(p.nameAr || p.code).trim()} — ${PERIOD_STATUS_LABEL[p.status] ?? p.status}`,
    })),
    [sortedPeriods],
  );

  /* ── UI ──────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5 animate-fade-in" dir="rtl">

      {/* ── Period + employee filters ── */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-end gap-4">
            <div className="w-fit shrink-0 space-y-1.5">
              <span className="block text-xs font-medium text-muted-foreground">فترات الرواتب</span>
              <MinimalDropdown
                value={selectedId ?? ''}
                onChange={(v) => setSelectedId(v || null)}
                options={periodDropdownOptions}
                placeholder="لا توجد فترات"
                disabled={sortedPeriods.length === 0}
                className="h-9 w-[13rem] max-w-[min(13rem,100vw-2rem)] justify-between text-start"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-1.5 sm:max-w-md">
              <span className="block text-xs font-medium text-muted-foreground">تصفية الموظفين</span>
              <EmployeePicker
                employees={periodEmployees}
                selected={empFilter}
                onChange={setEmpFilter}
              />
              {selectedPeriod && periodEmployees.length === 0 && (
                <p className="text-[11px] text-muted-foreground">لا يوجد موظفون في سجلات هذه الفترة.</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" className="gap-2" asChild disabled={!selectedId}>
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={downloading || !selectedId}
              onClick={handleDownloadExcel}
            >
              {downloading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FileSpreadsheet className="h-3.5 w-3.5" />}
              تحميل Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={pdfExporting || !selectedId}
              onClick={handleDownloadPdf}
            >
              {pdfExporting
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FileText className="h-3.5 w-3.5" />}
              تحميل PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden PDF print area — mounted only during export to avoid page scroll bleed */}
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
