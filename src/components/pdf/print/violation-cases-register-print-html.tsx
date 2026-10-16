'use client';

import * as React from 'react';
import { RegisterDocument } from '@/components/pdf/print/register-document';

export type ViolationCasePrintRow = {
  caseNumber: string;
  employeeNameAr: string;
  typeNameAr: string;
  date: string;
  statusAr: string;
  description: string;
};

export type ViolationCasesRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  rows: ViolationCasePrintRow[];
};

function isRow(r: unknown): r is ViolationCasePrintRow {
  if (r == null || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.caseNumber === 'string' &&
    typeof o.employeeNameAr === 'string' &&
    typeof o.typeNameAr === 'string' &&
    typeof o.date === 'string' &&
    typeof o.statusAr === 'string' &&
    typeof o.description === 'string'
  );
}

/** The violations register — the shared register layout (register-document). */
export const ViolationCasesRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  ViolationCasesRegisterPrintHtmlProps
>(function ViolationCasesRegisterPrintHtml({ companyNameAr, companyNameEn, titleAr, rows }, ref) {
  return (
    <RegisterDocument
      ref={ref}
      companyNameAr={companyNameAr}
      companyNameEn={companyNameEn}
      titleAr={titleAr}
      columns={[
        // Weights ≈ px of a portrait table (676): the case number and the date never wrap.
        { label: 'الرقم', kind: 'code', weight: 14 },
        { label: 'الموظف', kind: 'name', weight: 14 },
        { label: 'نوع المخالفة', kind: 'text', weight: 11.2 },
        { label: 'التاريخ', kind: 'date', weight: 10 },
        { label: 'الحالة', kind: 'status', weight: 7 },
        { label: 'الوصف', kind: 'text', weight: 11.2 },
      ]}
      rows={rows
        .filter(isRow)
        .map((r) => [r.caseNumber, r.employeeNameAr, r.typeNameAr, r.date, r.statusAr, r.description])}
    />
  );
});
