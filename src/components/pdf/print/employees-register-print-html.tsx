'use client';

import * as React from 'react';
import {
  RegisterDocument,
  type RegisterColumn,
  type RegisterRow,
} from '@/components/pdf/print/register-document';

/** The register's columns, in the order of each row's cells. */
export const EMPLOYEES_REGISTER_COLUMNS: RegisterColumn[] = [
  { label: 'الموظف', kind: 'name' },
  // EMP-1783707313731 on one line without being cut.
  { label: 'الرقم', kind: 'code', weight: 2.3 },
  { label: 'المسمى', kind: 'text' },
  { label: 'نوع العقد', kind: 'status' },
  { label: 'الالتحاق', kind: 'date' },
  { label: 'حالة العقد', kind: 'status' },
];

export type EmployeesRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  /** The printed columns (all of them by default). */
  columns?: RegisterColumn[];
  /** One cell per column — grouped registers add group headings (see `registerExportRows`). */
  rows: RegisterRow[];
};

/** The employees register — the shared register layout (register-document). */
export const EmployeesRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  EmployeesRegisterPrintHtmlProps
>(function EmployeesRegisterPrintHtml(
  { companyNameAr, companyNameEn, titleAr, filterSummary, columns = EMPLOYEES_REGISTER_COLUMNS, rows },
  ref,
) {
  return (
    <RegisterDocument
      ref={ref}
      landscape
      companyNameAr={companyNameAr}
      companyNameEn={companyNameEn}
      titleAr={titleAr}
      subtitleLines={filterSummary ? [filterSummary] : []}
      columns={columns}
      rows={rows}
    />
  );
});
