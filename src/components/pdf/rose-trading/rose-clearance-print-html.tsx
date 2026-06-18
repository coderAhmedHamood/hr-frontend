'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';

const CLEARANCE_LEGAL = `أقر أنا الموقعة أدناه بأنني تسلمت جميع مستحقاتي المالية والعينية الناشئة عن علاقة العمل مع مؤسسة روز للتجارة حتى تاريخ إخلاء الطرف، وبأن المؤسسة قد أدت ما عليها تجاهي بالكامل، وأبرئها إبراءً ذمة من أي التزامات أو مطالبات مستقبلية تخص فترة عملي لديها.`;

export type RoseClearancePrintHtmlProps = {
  logoSrc?: string;
  employeeNameAr: string;
  nationalId: string;
  reasonForClearanceAr: string;
  footerName: string;
  footerDateGregorian: string;
};

export const RoseClearancePrintHtml = React.forwardRef<HTMLDivElement, RoseClearancePrintHtmlProps>(
  function RoseClearancePrintHtml(
    {
      logoSrc: logoSrcProp,
      employeeNameAr,
      nationalId,
      reasonForClearanceAr,
      footerName,
      footerDateGregorian,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const ar = { fontFamily: 'Arial, Helvetica, sans-serif' };

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          width: '210mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          padding: '28px 36px 40px',
          fontSize: 9,
          color: '#222222',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          ...ar,
        }}
      >
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 14,
            textDecoration: 'underline',
            ...ar,
          }}
        >
          نموذج إخلاء طرف
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            marginBottom: 8,
            borderBottom: '0.5px solid #ccc',
            paddingBottom: 4,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 9, minWidth: 90, textAlign: 'right', ...ar }}>
            اسم الموظف/ة:
          </span>
          <span style={{ flex: 1, fontSize: 9, textAlign: 'right', ...ar }}>
            {sanitizePdfText(employeeNameAr)}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            marginBottom: 8,
            borderBottom: '0.5px solid #ccc',
            paddingBottom: 4,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 9, minWidth: 90, textAlign: 'right', ...ar }}>
            رقم الهوية:
          </span>
          <span dir="ltr" style={{ flex: 1, fontSize: 9, textAlign: 'right', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            {sanitizePdfText(nationalId)}
          </span>
        </div>

        <p style={{ fontSize: 9, lineHeight: 1.65, textAlign: 'right', color: '#222', margin: '14px 0 0 0', ...ar }}>
          {CLEARANCE_LEGAL}
        </p>

        <div
          style={{
            fontWeight: 700,
            fontSize: 10,
            marginTop: 10,
            marginBottom: 6,
            textAlign: 'right',
            ...ar,
          }}
        >
          سبب إخلاء الطرف:
        </div>
        <div
          style={{
            border: '1px solid #bbb',
            borderRadius: 4,
            padding: 10,
            marginTop: 8,
            backgroundColor: '#fafafa',
            fontSize: 9,
            lineHeight: 1.65,
            textAlign: 'right',
            color: '#222',
            ...ar,
          }}
        >
          {sanitizePdfText(reasonForClearanceAr)}
        </div>

        <div style={{ flex: 1, minHeight: 24 }} aria-hidden />

        <div
          style={{
            paddingTop: 20,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {[
            { label: 'الاسم', value: sanitizePdfText(footerName), lat: false },
            { label: 'التاريخ', value: sanitizePdfText(footerDateGregorian), lat: true },
            { label: 'التوقيع', value: '', lat: false },
          ].map((col) => (
            <div key={col.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 8, marginBottom: 28, textAlign: 'center', ...ar }}>{col.label}</span>
              {col.value ? (
                <span
                  style={{
                    marginBottom: 8,
                    fontSize: col.lat ? 8 : 9,
                    color: col.lat ? '#444' : '#222',
                    textAlign: 'center',
                    fontFamily: col.lat ? 'Arial, Helvetica, sans-serif' : ar.fontFamily,
                    ...(col.lat ? { direction: 'ltr' as const } : {}),
                  }}
                >
                  {col.value}
                </span>
              ) : (
                <div style={{ marginBottom: 8, minHeight: 9 }} />
              )}
              <div style={{ width: '100%', maxWidth: 140, height: 1, backgroundColor: '#000' }} />
            </div>
          ))}
        </div>
      </div>
    );
  },
);
