'use client';

import * as React from 'react';
import {
  RegisterDocument,
  type RegisterColumn,
  type RegisterColumnKind,
} from '@/components/pdf/print/register-document';

export type GenericRegisterPrintProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  headers: string[];
  rows: string[][];
  landscape?: boolean;
  rowsPerPage?: number;
};

/** What a column holds, read from its header (lists that only pass headers). */
function kindOf(header: string): RegisterColumnKind {
  const h = header.trim();
  if (/الموظف|الاسم|المستلم|المُعدّل|المعدل/.test(h)) return 'name';
  if (/تاريخ|الالتحاق|الوقت|^من$|^إلى$/.test(h)) return 'date';
  if (/رقم|الرمز|الكود|المرجع/.test(h)) return 'code';
  if (/أيام|دقائق|المبلغ|العدد|الكمية/.test(h)) return 'number';
  if (/الحالة|النوع|الفئة|العملية/.test(h)) return 'status';
  return 'text';
}

/** Any list printed as a register — the shared register layout (register-document). */
export const GenericRegisterPrintHtml = React.forwardRef<HTMLDivElement, GenericRegisterPrintProps>(
  function GenericRegisterPrintHtml(
    { companyNameAr, companyNameEn, titleAr, headers, rows, landscape = false, rowsPerPage },
    ref,
  ) {
    const columns: RegisterColumn[] = headers.map((label) => ({ label, kind: kindOf(label) }));
    return (
      <RegisterDocument
        ref={ref}
        companyNameAr={companyNameAr}
        companyNameEn={companyNameEn}
        titleAr={titleAr}
        columns={columns}
        rows={rows}
        landscape={landscape}
        rowsPerPage={rowsPerPage}
      />
    );
  },
);
