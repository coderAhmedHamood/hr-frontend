'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { PDF_PRINT_C } from '@/features/hr/payroll/reports/components/pdf-print-shared';

export type DisciplineCircularPrintHtmlProps = {
  logoSrc?: string;
  company: { nameAr: string; nameEn: string };
  titleAr: string;
  issuedDate: string;
  audienceSummaryAr: string;
  bodyAr: string;
  /** «لم يُرسل» أو تاريخ الإرسال */
  sendFooterAr?: string;
};

const PAGE_STYLE: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 10,
  color: '#111',
  boxSizing: 'border-box',
  minHeight: '297mm',
  display: 'flex',
  flexDirection: 'column',
};

export const DisciplineCircularPrintHtml = React.forwardRef<HTMLDivElement, DisciplineCircularPrintHtmlProps>(
  function DisciplineCircularPrintHtml(
    { logoSrc: logoSrcProp, company, titleAr, issuedDate, audienceSummaryAr, bodyAr, sendFooterAr },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const head = titleAr.trim() ? sanitizePdfText(titleAr) : 'تعميم إداري';

    return (
      <div ref={ref} dir="rtl" lang="ar" style={{ width: '210mm', maxWidth: '100%', margin: '0 auto' }}>
        <div style={PAGE_STYLE}>
          <RosePdfWatermark logoSrc={logoSrc} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={company.nameAr}
            companyNameEn={company.nameEn}
          />

          <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>
            تعميم
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 10,
              borderBottom: `0.5px solid ${PDF_PRINT_C.border}`,
              paddingBottom: 8,
              marginTop: 8,
            }}
          >
            <div style={{ flex: 1, fontSize: 11, fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>
              {head}
            </div>
            <div style={{ flexShrink: 0, fontSize: 10, color: '#444', textAlign: 'left' }}>
              <span dir="ltr">{sanitizePdfText(issuedDate)}</span>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', marginBottom: 4 }}>الفئة المستهدفة</div>
            <div style={{ fontSize: 10.5, textAlign: 'right', lineHeight: 1.55, color: '#222' }}>
              {sanitizePdfText(audienceSummaryAr)}
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              backgroundColor: '#fafafa',
              border: `0.75px solid ${PDF_PRINT_C.border}`,
              borderRadius: 2,
              padding: 12,
              fontSize: 11,
              lineHeight: 1.8,
              textAlign: 'right',
              color: '#111',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {sanitizePdfText(bodyAr)}
          </div>

          <div style={{ flex: 1, minHeight: 10 }} aria-hidden />

          <div style={{ marginTop: 18, borderTop: `0.75px solid ${PDF_PRINT_C.border}`, paddingTop: 8 }}>
            <div style={{ fontSize: 9, textAlign: 'center', color: PDF_PRINT_C.muted }}>
              {sanitizePdfText(sendFooterAr ?? '— مستند نظام الانضباط الإداري —')}
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  },
);

