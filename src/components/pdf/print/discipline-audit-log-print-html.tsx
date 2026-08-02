'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

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

export const DisciplineAuditLogPrintHtml = React.forwardRef<
  HTMLDivElement,
  DisciplineAuditLogPrintHtmlProps
>(function DisciplineAuditLogPrintHtml({ companyNameAr, companyNameEn, titleAr, rows }, ref) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  const pages = chunk(rows, ROWS_PER_PAGE);

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

          <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>
            {sanitizePdfText(titleAr)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#e8f2ef', border: '1px solid #94a3b8' }}>
            {[
              { label: 'الوقت', width: '16%', align: 'center' as const },
              { label: 'المُعدّل', width: '18%', align: 'right' as const, pad: true },
              { label: 'الفئة', width: '14%', align: 'center' as const },
              { label: 'العملية', width: '12%', align: 'center' as const },
              { label: 'المرجع', width: '14%', align: 'center' as const },
              { label: 'الحالة بعد العملية', width: '26%', align: 'right' as const, pad: true },
            ].map((c, idx) => (
              <div
                key={c.label}
                style={{
                  width: c.width,
                  boxSizing: 'border-box',
                  fontWeight: 700,
                  textAlign: c.align,
                  fontSize: 8.5,
                  padding: c.pad ? '4px 3px' : '4px 2px',
                  borderInlineStart: idx === 0 ? undefined : '1px solid #94a3b8',
                  wordBreak: 'break-word',
                }}
              >
                {sanitizePdfText(c.label)}
              </div>
            ))}
          </div>

          {pageRows.length === 0 && pi === 0 ? (
            <p style={{ marginTop: 14, textAlign: 'center', color: '#64748b' }}>لا توجد عمليات ضمن الفلترة.</p>
          ) : (
            pageRows.map((r, ri) => (
              <div
                key={`${r.recordRefAr}-${ri}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  backgroundColor: ri % 2 === 1 ? '#fafafa' : '#fff',
                }}
              >
                <div style={{ width: '16%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7.5, textAlign: 'center' }}>
                  <span dir="ltr">{sanitizePdfText(r.occurredAtDisplay)}</span>
                </div>
                <div
                  style={{
                    width: '18%',
                    boxSizing: 'border-box',
                    padding: '4px 3px',
                    fontSize: 7.5,
                    textAlign: 'right',
                    borderInlineStart: '1px solid #e2e8f0',
                    wordBreak: 'break-word',
                  }}
                >
                  {sanitizePdfText(r.actorNameAr)}
                </div>
                <div style={{ width: '14%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7.5, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  {sanitizePdfText(r.categoryAr)}
                </div>
                <div style={{ width: '12%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7.5, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  {sanitizePdfText(r.actionAr)}
                </div>
                <div style={{ width: '14%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7.5, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  <span dir="ltr">{sanitizePdfText(r.recordRefAr)}</span>
                </div>
                <div
                  style={{
                    width: '26%',
                    boxSizing: 'border-box',
                    padding: '4px 3px',
                    fontSize: 7.5,
                    textAlign: 'right',
                    borderInlineStart: '1px solid #e2e8f0',
                    wordBreak: 'break-word',
                  }}
                >
                  {sanitizePdfText(clip(r.statusAfterAr, 90))}
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: 16, fontSize: 8, color: '#64748b', textAlign: 'center' }}>
            صفحة {pi + 1} / {pages.length}
            {rows.length > 0 ? ` · إجمالي العمليات: ${rows.length}` : ''}
          </div>
          </div>
        </div>
      ))}
    </div>
  );
});

