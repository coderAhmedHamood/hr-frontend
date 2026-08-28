'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { OfficialCircularPrintHtml } from '@/components/pdf/print/official-circular-print-html';

export type DisciplineCircularPrintHtmlProps = {
  logoSrc?: string;
  company: { nameAr: string; nameEn: string };
  titleAr: string;
  issuedDate: string;
  bodyAr: string;
  employeeName?: string | null;
  nationalId?: string | null;
};

function buildSubjectLine(titleAr: string): string {
  const title = titleAr.trim();
  if (!title) return 'الموضوع: تعميم إداري';
  return title.startsWith('الموضوع:')
    ? sanitizePdfText(title)
    : `الموضوع: ${sanitizePdfText(title)}`;
}

/** Discipline circular — official paper layout with DB title/body/date/audience. */
export const DisciplineCircularPrintHtml = React.forwardRef<
  HTMLDivElement,
  DisciplineCircularPrintHtmlProps
>(function DisciplineCircularPrintHtml(
  {
    logoSrc,
    company,
    titleAr,
    issuedDate,
    bodyAr,
    employeeName,
    nationalId,
  },
  ref,
) {
  return (
    <OfficialCircularPrintHtml
      ref={ref}
      logoSrc={logoSrc}
      companyNameAr={company.nameAr}
      companyNameEn={company.nameEn}
      dateIso={issuedDate}
      subjectLine={buildSubjectLine(titleAr)}
      bodyAr={bodyAr}
      employeeName={employeeName}
      nationalId={nationalId}
      showPledge
    />
  );
});
