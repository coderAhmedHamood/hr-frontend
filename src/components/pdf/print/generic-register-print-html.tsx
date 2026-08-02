'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

export type GenericRegisterPrintProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  headers: string[];
  rows: string[][];
  landscape?: boolean;
  rowsPerPage?: number;
};

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

const PAGE = {
  position: 'relative' as const,
  overflow: 'hidden' as const,
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 8,
  color: '#111',
  boxSizing: 'border-box' as const,
};

export const GenericRegisterPrintHtml = React.forwardRef<HTMLDivElement, GenericRegisterPrintProps>(
  function GenericRegisterPrintHtml(
    { companyNameAr, companyNameEn, titleAr, headers, rows, landscape = false, rowsPerPage },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
    React.useEffect(() => {
      setLogoSrc(getPdfLogoSrc());
    }, []);

    const n = Math.max(1, headers.length);
    const colPct = `${(100 / n).toFixed(3)}%`;
    const rpp = rowsPerPage ?? (landscape ? 14 : 20);
    const pages = chunk(rows, rpp);
    const pageW = landscape ? '297mm' : '210mm';

    return (
      <div ref={ref} dir="rtl" lang="ar" style={{ width: pageW, maxWidth: '100%', margin: '0 auto' }}>
        {pages.map((pageRows, pi) => (
          <div
            key={pi}
            style={{
              ...PAGE,
              minHeight: pi < pages.length - 1 ? (landscape ? '210mm' : '297mm') : undefined,
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
              {headers.map((h, i) => (
                <div
                  key={`h-${i}`}
                  style={{
                    width: colPct,
                    boxSizing: 'border-box',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontSize: 8,
                    padding: '4px 2px',
                    borderInlineStart: i === 0 ? undefined : '1px solid #94a3b8',
                  }}
                >
                  {sanitizePdfText(h)}
                </div>
              ))}
            </div>

            {pageRows.length === 0 && pi === 0 ? (
              <p style={{ marginTop: 14, textAlign: 'center', color: '#64748b' }}>لا توجد بيانات ضمن الفلترة.</p>
            ) : (
              pageRows.map((row, ri) => (
                <div
                  key={`r-${pi}-${ri}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    border: '1px solid #e2e8f0',
                    borderTop: 'none',
                    backgroundColor: ri % 2 === 1 ? '#fafafa' : '#fff',
                  }}
                >
                  {headers.map((_, ci) => (
                    <div
                      key={`c-${ci}`}
                      style={{
                        width: colPct,
                        boxSizing: 'border-box',
                        padding: '4px 2px',
                        fontSize: 7,
                        textAlign: 'center',
                        borderInlineStart: ci === 0 ? undefined : '1px solid #e2e8f0',
                        wordBreak: 'break-word',
                      }}
                    >
                      {sanitizePdfText(clip(row[ci] ?? '', landscape ? 90 : 70))}
                    </div>
                  ))}
                </div>
              ))
            )}

            <div style={{ marginTop: 16, fontSize: 8, color: '#64748b', textAlign: 'center' }}>
              صفحة {pi + 1} / {pages.length}
              {rows.length > 0 ? ` · إجمالي السجلات: ${rows.length}` : ''}
            </div>
            </div>
          </div>
        ))}
      </div>
    );
  },
);
