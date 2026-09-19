'use client';

import * as React from 'react';
import { OfficialCircularPrintHtml } from '@/components/pdf/print/official-circular-print-html';
export type RoseMobileCircularPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
  dateIso?: string;
  circularNumber?: string | null;
  /** Document body from DB — not static boilerplate */
  bodyAr?: string | null;
  employeeName?: string | null;
  nationalId?: string | null;
};

function localTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildSubjectLine(): string {
  return 'الموضوع: تعميم إداري';
}

/** Per-employee mobile circular — same paper layout, dynamic body from DB. */
export const RoseMobileCircularPrintHtml = React.forwardRef<
  HTMLDivElement,
  RoseMobileCircularPrintHtmlProps
>(function RoseMobileCircularPrintHtml(
  {
    logoSrc,
    companyNameAr,
    companyNameEn,
    dateIso,
    circularNumber,
    bodyAr,
    employeeName,
    nationalId,
  },
  ref,
) {
  const iso = dateIso?.trim() || localTodayIso();

  return (
    <OfficialCircularPrintHtml
      ref={ref}
      logoSrc={logoSrc}
      companyNameAr={companyNameAr}
      companyNameEn={companyNameEn}
      dateIso={iso}
      subjectLine={buildSubjectLine()}
      bodyAr={bodyAr?.trim() ?? ''}
      employeeName={employeeName}
      nationalId={nationalId}
      showPledge
    />
  );
});
