'use client';

import * as React from 'react';
import { RegisterDocument } from '@/components/pdf/print/register-document';

export type AttendanceRegisterPrintRow = {
  employeeName: string;
  date: string;
  statusLabel: string;
  worked: string;
  late: string;
  branchName?: string;
};

export type AttendanceRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  periodDateFrom: string;
  periodDateTo: string;
  employeesFilterAll: boolean;
  employeesSelectedCount: number;
  statusFilterLabelAr: string;
  /** The employees' own status shown (e.g. «نشط»); omitted = every status. */
  employeeStatusLabelAr?: string;
  /** Printed in the header when the register is filtered to one branch. */
  branchFilterNameAr?: string | null;
  /** When every branch is included, print each employee's branch as a column. */
  includeBranchColumn?: boolean;
  rows: AttendanceRegisterPrintRow[];
};

/** The attendance register — the shared register layout (register-document). */
export const AttendanceRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  AttendanceRegisterPrintHtmlProps
>(function AttendanceRegisterPrintHtml(
  {
    companyNameAr,
    companyNameEn,
    titleAr,
    periodDateFrom,
    periodDateTo,
    employeesFilterAll,
    employeesSelectedCount,
    statusFilterLabelAr,
    employeeStatusLabelAr,
    branchFilterNameAr,
    includeBranchColumn = false,
    rows,
  },
  ref,
) {
  const filterLine = [
    employeesFilterAll
      ? 'الموظفون: جميع الموظفين ضمن البحث'
      : 'الموظفون: ' + employeesSelectedCount + ' موظف محدد',
    employeeStatusLabelAr ? 'حالة الموظف: ' + employeeStatusLabelAr : null,
    branchFilterNameAr ? 'الفرع: ' + branchFilterNameAr : includeBranchColumn ? 'الفرع: كل الفروع' : null,
    'حالة الحضور: ' + statusFilterLabelAr,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <RegisterDocument
      ref={ref}
      companyNameAr={companyNameAr}
      companyNameEn={companyNameEn}
      titleAr={titleAr}
      subtitleLines={[
        <>
          الفترة: <span dir="ltr">{periodDateFrom}</span> — <span dir="ltr">{periodDateTo}</span>
        </>,
        filterLine,
      ]}

      columns={
        includeBranchColumn
          ? [
              { label: 'الموظف', kind: 'name' },
              { label: 'الفرع', kind: 'text', weight: 1.8 },
              { label: 'التاريخ', kind: 'date' },
              { label: 'الحالة', kind: 'status' },
              { label: 'دقائق العمل', kind: 'number', weight: 1.3 },
              { label: 'التأخير', kind: 'number', weight: 1.2 },
            ]
          : [
              { label: 'الموظف', kind: 'name' },
              { label: 'التاريخ', kind: 'date' },
              { label: 'الحالة', kind: 'status' },
              { label: 'دقائق العمل', kind: 'number', weight: 1.3 },
              { label: 'التأخير', kind: 'number', weight: 1.2 },
            ]
      }
      rows={rows.map((r) =>
        includeBranchColumn
          ? [r.employeeName, r.branchName || '—', r.date, r.statusLabel, r.worked, r.late]
          : [r.employeeName, r.date, r.statusLabel, r.worked, r.late],
      )}
      emptyText="لا توجد سجلات ضمن الفلترة."
    />
  );
});
