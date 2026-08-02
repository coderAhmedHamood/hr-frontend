'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

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

const ROWS_PER_PAGE = 22;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function clip(s: string, max: number): string {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

const PAGE_STYLE: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 9,
  color: '#111',
  boxSizing: 'border-box',
};

export const NotificationsRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  NotificationsRegisterPrintHtmlProps
>(function NotificationsRegisterPrintHtml(
  { companyNameAr, companyNameEn, titleAr, filterSummary, rows, includeRecipientColumn },
  ref,
) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  const pages = chunk(rows, ROWS_PER_PAGE);

  const colDate = includeRecipientColumn ? '11%' : '12%';
  const colTitle = includeRecipientColumn ? '38%' : '48%';
  const colRecip = includeRecipientColumn ? '22%' : '0%';
  const colRead = includeRecipientColumn ? '14%' : '18%';
  const colInbox = includeRecipientColumn ? '15%' : '22%';

  return (
    <div ref={ref} dir="rtl" lang="ar" style={{ width: '210mm', maxWidth: '100%', margin: '0 auto' }}>
      {pages.map((pageRows, pi) => (
        <div
          key={pi}
          style={{
            ...PAGE_STYLE,
            minHeight: pi < pages.length - 1 ? '297mm' : undefined,
            marginBottom: pi < pages.length - 1 ? 16 : 0,
            borderBottom: pi < pages.length - 1 ? '1px dashed #ddd' : undefined,
          }}
        >
          <RosePdfWatermark logoSrc={logoSrc} />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={companyNameAr}
            companyNameEn={companyNameEn}
          />

          <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 8, textDecoration: 'underline' }}>
            {sanitizePdfText(titleAr)}
          </div>
          <div style={{ fontSize: 9, color: '#444', textAlign: 'right', marginBottom: 8, lineHeight: 1.35 }}>
            {sanitizePdfText(filterSummary)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#e8f2ef', border: '1px solid #94a3b8' }}>
            <div style={{ width: colDate, boxSizing: 'border-box', fontWeight: 700, textAlign: 'center', fontSize: 9, padding: '4px 2px' }}>
              التاريخ
            </div>
            <div
              style={{
                width: colTitle,
                boxSizing: 'border-box',
                fontWeight: 700,
                textAlign: 'right',
                fontSize: 9,
                padding: '4px 4px',
                borderInlineStart: '1px solid #94a3b8',
              }}
            >
              التنبيه
            </div>
            {includeRecipientColumn ? (
              <div
                style={{
                  width: colRecip,
                  boxSizing: 'border-box',
                  fontWeight: 700,
                  textAlign: 'right',
                  fontSize: 9,
                  padding: '4px 4px',
                  borderInlineStart: '1px solid #94a3b8',
                }}
              >
                المستلم
              </div>
            ) : null}
            <div
              style={{
                width: colRead,
                boxSizing: 'border-box',
                fontWeight: 700,
                textAlign: 'center',
                fontSize: 9,
                padding: '4px 2px',
                borderInlineStart: '1px solid #94a3b8',
              }}
            >
              القراءة
            </div>
            <div
              style={{
                width: colInbox,
                boxSizing: 'border-box',
                fontWeight: 700,
                textAlign: 'center',
                fontSize: 9,
                padding: '4px 2px',
                borderInlineStart: '1px solid #94a3b8',
              }}
            >
              الصندوق
            </div>
          </div>

          {pageRows.length === 0 && pi === 0 ? (
            <p style={{ marginTop: 14, textAlign: 'center', color: '#64748b' }}>لا توجد تنبيهات ضمن الفلترة.</p>
          ) : (
            pageRows.map((r, ri) => (
              <div
                key={`${r.dateYmd}-${ri}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  backgroundColor: ri % 2 === 1 ? '#fafafa' : '#fff',
                }}
              >
                <div style={{ width: colDate, boxSizing: 'border-box', padding: '4px 2px', fontSize: 8, textAlign: 'center' }}>
                  <span dir="ltr">{sanitizePdfText(r.dateYmd)}</span>
                </div>
                <div
                  style={{
                    width: colTitle,
                    boxSizing: 'border-box',
                    padding: '4px 4px',
                    fontSize: 8,
                    textAlign: 'right',
                    borderInlineStart: '1px solid #e2e8f0',
                    wordBreak: 'break-word',
                  }}
                >
                  {sanitizePdfText(clip(r.titleAr, 90))}
                </div>
                {includeRecipientColumn ? (
                  <div
                    style={{
                      width: colRecip,
                      boxSizing: 'border-box',
                      padding: '4px 4px',
                      fontSize: 8,
                      textAlign: 'right',
                      borderInlineStart: '1px solid #e2e8f0',
                      wordBreak: 'break-word',
                    }}
                  >
                    {sanitizePdfText(r.recipientNameAr)}
                  </div>
                ) : null}
                <div
                  style={{
                    width: colRead,
                    boxSizing: 'border-box',
                    padding: '4px 2px',
                    fontSize: 8,
                    textAlign: 'center',
                    borderInlineStart: '1px solid #e2e8f0',
                    wordBreak: 'break-word',
                  }}
                >
                  {sanitizePdfText(r.readAr)}
                </div>
                <div
                  style={{
                    width: colInbox,
                    boxSizing: 'border-box',
                    padding: '4px 2px',
                    fontSize: 8,
                    textAlign: 'center',
                    borderInlineStart: '1px solid #e2e8f0',
                    wordBreak: 'break-word',
                  }}
                >
                  {sanitizePdfText(r.inboxAr)}
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: 16, fontSize: 8, color: '#64748b', textAlign: 'center' }}>
            صفحة {pi + 1} / {pages.length}
            {rows.length > 0 ? ` · عدد السجلات: ${rows.length}` : ''}
          </div>
          </div>
        </div>
      ))}
    </div>
  );
});

