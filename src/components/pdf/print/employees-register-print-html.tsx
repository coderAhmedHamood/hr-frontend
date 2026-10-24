'use client';

import * as React from 'react';
import { RegisterDocument } from '@/components/pdf/print/register-document';

export type EmployeeRegisterPrintRow = {
  name: string;
  employeeCode: string;
  position: string;
  contractType: string;
  startDate: string;
  statusAr: string;
};

export type EmployeesRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: EmployeeRegisterPrintRow[];
};

/** The employees register — the shared register layout (register-document). */
export const EmployeesRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  EmployeesRegisterPrintHtmlProps
>(function EmployeesRegisterPrintHtml(
  { companyNameAr, companyNameEn, titleAr, filterSummary, rows },
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
      columns={[
        { label: 'الموظف', kind: 'name' },
        // EMP-1783707313731 on one line without being cut.
        { label: 'الرقم', kind: 'code', weight: 2.3 },
        { label: 'المسمى', kind: 'text' },
        { label: 'نوع العقد', kind: 'status' },
        { label: 'الالتحاق', kind: 'date' },
        { label: 'حالة العقد', kind: 'status' },
      ]}
      rows={rows.map((r) => [r.name, r.employeeCode, r.position, r.contractType, r.startDate, r.statusAr])}
    />
  );
});
