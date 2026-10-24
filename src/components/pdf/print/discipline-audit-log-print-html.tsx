'use client';

import * as React from 'react';
import { RegisterDocument } from '@/components/pdf/print/register-document';

export type DisciplineAuditLogPrintRow = {
  occurredAtDisplay: string;
  actorNameAr: string;
  categoryAr: string;
  actionAr: string;
  recordRefAr: string;
  statusAfterAr: string;
};

export type DisciplineAuditLogPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  rows: DisciplineAuditLogPrintRow[];
};

/** The discipline audit log — the shared register layout (register-document). */
export const DisciplineAuditLogPrintHtml = React.forwardRef<
  HTMLDivElement,
  DisciplineAuditLogPrintHtmlProps
>(function DisciplineAuditLogPrintHtml({ companyNameAr, companyNameEn, titleAr, rows }, ref) {
  return (
    <RegisterDocument
      ref={ref}
      companyNameAr={companyNameAr}
      companyNameEn={companyNameEn}
      titleAr={titleAr}
      columns={[
        // Weights ≈ px of a portrait table (676): the date-time (2026/10/14-01:45 م)
        // and the reference (VIO-2026-04003) never wrap, so they get their full width.
        { label: 'الوقت', kind: 'date', weight: 16 },
        { label: 'المُعدّل', kind: 'name', weight: 12 },
        { label: 'الفئة', kind: 'status', weight: 7.5 },
        { label: 'العملية', kind: 'status', weight: 7.2 },
        { label: 'المرجع', kind: 'code', weight: 14 },
        { label: 'الحالة بعد العملية', kind: 'text', weight: 11 },
      ]}
      rows={rows.map((r) => [
        r.occurredAtDisplay,
        r.actorNameAr,
        r.categoryAr,
        r.actionAr,
        r.recordRefAr,
        r.statusAfterAr,
      ])}
    />
  );
});
