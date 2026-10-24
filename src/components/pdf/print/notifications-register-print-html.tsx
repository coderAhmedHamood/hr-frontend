'use client';

import * as React from 'react';
import { RegisterDocument, type RegisterColumn } from '@/components/pdf/print/register-document';

export type NotificationPrintRow = {
  dateYmd: string;
  titleAr: string;
  recipientNameAr: string;
  readAr: string;
  inboxAr: string;
};

export type NotificationsRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: NotificationPrintRow[];
  includeRecipientColumn: boolean;
};

/** The notifications register — the shared register layout (register-document). */
export const NotificationsRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  NotificationsRegisterPrintHtmlProps
>(function NotificationsRegisterPrintHtml(
  { companyNameAr, companyNameEn, titleAr, filterSummary, rows, includeRecipientColumn },
  ref,
) {
  const columns: RegisterColumn[] = [
    { label: 'التاريخ', kind: 'date', weight: 1.6 },
    { label: 'العنوان', kind: 'text', weight: 3 },
    ...(includeRecipientColumn ? [{ label: 'المستلم', kind: 'name' as const }] : []),
    { label: 'القراءة', kind: 'status' },
    { label: 'الصندوق', kind: 'status' },
  ];
  return (
    <RegisterDocument
      ref={ref}
      companyNameAr={companyNameAr}
      companyNameEn={companyNameEn}
      titleAr={titleAr}
      subtitleLines={filterSummary ? [filterSummary] : []}
      columns={columns}
      rows={rows.map((r) => [
        r.dateYmd,
        r.titleAr,
        ...(includeRecipientColumn ? [r.recipientNameAr] : []),
        r.readAr,
        r.inboxAr,
      ])}
    />
  );
});
