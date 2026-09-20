'use client';

import * as React from 'react';
import { PDF_PRINT_FONT_FAMILY } from '@/components/pdf/lib/pdf-print-font';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';

const TITLE_BG = '#e8e8e8';

export type DisciplineLetterPrintRow = {
  label: string;
  value: string;
};

export type DisciplineLetterPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr?: string;
  companyNameEn?: string | null;
  titleAr: string;
  rows: DisciplineLetterPrintRow[];
  bodyAr?: string;
};

export const DisciplineLetterPrintHtml = React.forwardRef<
  HTMLDivElement,
  DisciplineLetterPrintHtmlProps
>(function DisciplineLetterPrintHtml(
  { logoSrc: logoSrcProp, companyNameAr, companyNameEn, titleAr, rows, bodyAr },
  ref,
) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
  React.useEffect(() => {
    if (logoSrcProp) setLogoSrc(logoSrcProp);
    else setLogoSrc(getPdfLogoSrc());
  }, [logoSrcProp]);

  return (
    <div
      ref={ref}
      dir="rtl"
      lang="ar"
      style={{
        position: 'relative',
        width: '210mm',
        maxWidth: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        padding: '20px 28px 44px',
        color: '#111',
        minHeight: '297mm',
        overflow: 'hidden',
        fontFamily: PDF_PRINT_FONT_FAMILY,
        fontSize: 26,
      }}
    >
      <RosePdfWatermark logoSrc={logoSrc} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <RoseTradingLetterheadPrint
          logoSrc={logoSrc}
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn ?? undefined}
        />

        <div
          style={{
            backgroundColor: TITLE_BG,
            fontSize: 26,
            fontWeight: 700,
            textAlign: 'center',
            margin: '8px 0 18px',
            padding: '10px 12px',
          }}
        >
          {sanitizePdfText(titleAr)}
        </div>

        <div style={{ lineHeight: 2, fontWeight: 700 }}>
          {rows.map((row) => (
            <p key={row.label} style={{ margin: '0 0 6px', textAlign: 'right' }}>
              <span>{sanitizePdfText(row.label)}: </span>
              <span style={{ fontWeight: 600 }}>{sanitizePdfText(row.value || '—')}</span>
            </p>
          ))}
        </div>

        {bodyAr?.trim() ? (
          <p
            style={{
              marginTop: 18,
              lineHeight: 1.9,
              textAlign: 'justify',
              whiteSpace: 'pre-wrap',
            }}
          >
            {sanitizePdfText(bodyAr.trim())}
          </p>
        ) : null}
      </div>
    </div>
  );
});
