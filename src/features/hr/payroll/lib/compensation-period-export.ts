import { exportDomToPdf } from '@/components/pdf/lib/exportDomToPdf';
import type { HRPayrollPeriodRecord } from './payroll-periods-store';
import {
  editAmount,
  editSignedAmount,
  formatLatinNumber,
  type CompensationColumnVisibility,
  type CompensationEditValues,
  type PayrollLineCompensationPreview,
  type PayrollSummaryFooterTotals,
} from './compensation-preview';

export type CompensationExportLine = {
  preview: PayrollLineCompensationPreview;
  edit: CompensationEditValues;
  net: number;
  department: string;
};

export type CompensationExportTable = {
  headers: string[];
  rows: (string | number)[][];
  totalRow: (string | number)[];
};

function defaultEditRow(row: PayrollLineCompensationPreview): CompensationEditValues {
  return {
    overtime: String(row.entitlementOvertimeSar),
    bonus: String(row.entitlementBonusSar),
    absenceSar: String(row.dedAbsenceSar),
    late: String(row.dedLateSar),
    penalties: String(row.dedPenaltiesSar),
    advances: String(row.dedAdvancesSar),
    admin: String(row.dedAdminSar),
  };
}

function formatAllowancesCell(preview: PayrollLineCompensationPreview): string {
  if (preview.allowanceLines.length === 0) return '—';
  const lines = preview.allowanceLines.map(
    (a) => `${a.labelAr}|${formatLatinNumber(a.amount, 2)}`,
  );
  lines.push(`__TOTAL__|${formatLatinNumber(preview.allowancesMonthlyTotal, 2)}`);
  return lines.join('\n');
}

/** Builds table data matching the on-screen compensation report (column toggles respected). */
export function buildCompensationExportTable(
  lines: CompensationExportLine[],
  cols: CompensationColumnVisibility,
  footerTotals?: PayrollSummaryFooterTotals | null,
): CompensationExportTable {
  const headers: string[] = ['#', 'الموظف', 'البدلات (شهري)', 'الراتب الأساسي'];
  if (cols.colOvertime) headers.push('أوفر تايم');
  if (cols.colBonus) headers.push('مكافآت');
  if (cols.colDedAdvances) headers.push('السلف');
  if (cols.colDedAbsence) headers.push('غياب');
  if (cols.colDedLate) headers.push('تأخير');
  if (cols.colDedPenalties) headers.push('جزاءات');
  if (cols.colDedAdmin) headers.push('خصم او اضافة مباشرة');
  headers.push('الصافي');

  const rows = lines.map((line, i) => {
    const r = line.preview;
    const row: (string | number)[] = [
      i + 1,
      r.namePrimary,
      formatAllowancesCell(r),
      r.baseSalary,
    ];
    if (cols.colOvertime) row.push(editAmount(line.edit.overtime));
    if (cols.colBonus) row.push(editAmount(line.edit.bonus));
    if (cols.colDedAdvances) row.push(editAmount(line.edit.advances));
    if (cols.colDedAbsence) row.push(editAmount(line.edit.absenceSar));
    if (cols.colDedLate) row.push(editAmount(line.edit.late));
    if (cols.colDedPenalties) row.push(editAmount(line.edit.penalties));
    if (cols.colDedAdmin) row.push(editSignedAmount(line.edit.admin));
    row.push(line.net);
    return row;
  });

  const totalRow: (string | number)[] = ['المجموع الكلي', '', ''];
  totalRow.push(footerTotals?.baseSalary ?? lines.reduce((s, l) => s + l.preview.baseSalary, 0));
  if (cols.colOvertime) totalRow.push(footerTotals?.overtime ?? lines.reduce((s, l) => s + editAmount(l.edit.overtime), 0));
  if (cols.colBonus) totalRow.push(footerTotals?.bonuses ?? lines.reduce((s, l) => s + editAmount(l.edit.bonus), 0));
  if (cols.colDedAdvances) totalRow.push(footerTotals?.advances ?? lines.reduce((s, l) => s + editAmount(l.edit.advances), 0));
  if (cols.colDedAbsence) totalRow.push(footerTotals?.absence ?? lines.reduce((s, l) => s + editAmount(l.edit.absenceSar), 0));
  if (cols.colDedLate) totalRow.push(footerTotals?.lateness ?? lines.reduce((s, l) => s + editAmount(l.edit.late), 0));
  if (cols.colDedPenalties) totalRow.push(footerTotals?.penalties ?? lines.reduce((s, l) => s + editAmount(l.edit.penalties), 0));
  if (cols.colDedAdmin) totalRow.push(footerTotals?.manualAdminSigned ?? lines.reduce((s, l) => s + editSignedAmount(l.edit.admin), 0));
  totalRow.push(footerTotals?.net ?? lines.reduce((s, l) => s + l.net, 0));

  return { headers, rows, totalRow };
}

export function buildCompensationExportLines(
  previews: PayrollLineCompensationPreview[],
): CompensationExportLine[] {
  return previews.map((row) => ({
    preview: row,
    edit: defaultEditRow(row),
    net: row.lineNetSar,
    department: '',
  }));
}

export type CompensationPrintPayload = {
  monthNameAr: string;
  branchNameAr: string;
  table: CompensationExportTable;
};

export function buildCompensationPrintPayload(
  period: HRPayrollPeriodRecord,
  lines: CompensationExportLine[],
  cols: CompensationColumnVisibility,
  footerTotals?: PayrollSummaryFooterTotals | null,
): CompensationPrintPayload {
  return {
    monthNameAr: period.nameAr || period.code,
    branchNameAr: 'المقر الرئيسي',
    table: buildCompensationExportTable(lines, cols, footerTotals),
  };
}

export async function downloadCompensationExcel(
  period: HRPayrollPeriodRecord,
  lines: CompensationExportLine[],
  cols: CompensationColumnVisibility,
  footerTotals?: PayrollSummaryFooterTotals | null,
): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const { headers, rows, totalRow } = buildCompensationExportTable(lines, cols, footerTotals);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows, totalRow]);
  ws['!cols'] = headers.map((_, i) => ({
    wch: i === 1 ? 22 : i === 2 ? 28 : 14,
  }));
  XLSX.utils.book_append_sheet(wb, ws, (period.nameAr || period.code).slice(0, 31));
  XLSX.writeFile(wb, `payroll-${period.code}.xlsx`);
}

export async function downloadCompensationPdf(
  element: HTMLElement,
  periodCode: string,
): Promise<void> {
  await exportDomToPdf(element, `payroll-${periodCode}.pdf`, { orientation: 'landscape' });
}
