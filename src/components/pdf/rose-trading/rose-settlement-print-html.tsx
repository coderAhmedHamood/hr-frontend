'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { formatGregorianDateAr } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

export type RoseSettlementPrintFields = {
  employeeName: string;
  nationality: string;
  nationalId: string;
  /** Gregorian end/settlement date — shown in الموافق slot when filled */
  endDateGregorian: string;
  /** Optional Hijri date for تاريخ : … هـ */
  endDateHijri?: string | null;
  companyName: string;
};

export type RoseSettlementPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
  /** When null/undefined, blank dotted placeholders for handwritten fill-in. */
  fields?: RoseSettlementPrintFields | null;
};

const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };
const DOTS = '..................................................';
const DOTS_MED = '..............................';

function Blank({ med }: { med?: boolean }) {
  return <span style={{ letterSpacing: '0.5px', paddingInline: 4 }}>{med ? DOTS_MED : DOTS}</span>;
}

function Value({ text, blank, med }: { text?: string; blank?: boolean; med?: boolean }) {
  if (blank || !text?.trim()) return <Blank med={med} />;
  return (
    <span style={{ fontWeight: 700, paddingInline: 8, marginInline: 2, whiteSpace: 'pre' }}>
      {`  ${sanitizePdfText(text.trim())}  `}
    </span>
  );
}

function DateBlank() {
  return <span>&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;</span>;
}

/**
 * Final settlement — matches paper layout.
 * No outer square borders; letterhead kept.
 * `fields` null = blank form, otherwise filled from employee data.
 */
export const RoseSettlementPrintHtml = React.forwardRef<HTMLDivElement, RoseSettlementPrintHtmlProps>(
  function RoseSettlementPrintHtml(
    { logoSrc: logoSrcProp, companyNameAr, companyNameEn, fields },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const blank = !fields;
    const company = sanitizePdfText(
      (fields?.companyName || companyNameAr || '').trim() || '—',
    );

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
          padding: '26px 40px 40px',
          fontSize: 16,
          color: '#111111',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          overflow: 'hidden',
          ...font,
        }}
      >
        <RosePdfWatermark logoSrc={logoSrc} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          }}
        >
        <RoseTradingLetterheadPrint
          logoSrc={logoSrc}
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn ?? undefined}
        />

        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'underline',
            marginTop: 16,
            marginBottom: 36,
            ...font,
          }}
        >
          مخالصة موظفات
        </div>

        {/* Body — full width, no border box */}
        <div style={{ width: '100%', fontSize: 16, lineHeight: 2.35, textAlign: 'right', ...font }}>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            اقر أنا / <Value text={fields?.employeeName} blank={blank} /> ،{' '}
            <Value text={fields?.nationality} blank={blank} med /> الجنسية
          </p>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            بموجب بطاقة أحوال رقم ( <Value text={fields?.nationalId} blank={blank} med /> ) الموقعة أدناه بأنه إعتباراً من
          </p>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            تاريخ :{' '}
            {blank ? (
              <>
                <DateBlank />
                14هـ الموافق : <DateBlank />
                20م
              </>
            ) : (
              <>
                {fields.endDateHijri?.trim() ? (
                  <>
                    <Value text={fields.endDateHijri} blank={false} /> هـ الموافق :{' '}
                  </>
                ) : (
                  <>
                    <DateBlank />
                    14هـ الموافق :{' '}
                  </>
                )}
                <Value
                  text={fields.endDateGregorian || formatGregorianDateAr(new Date().toISOString().slice(0, 10))}
                  blank={false}
                />{' '}
                م
              </>
            )}
            ، قد وصلني جميع الأموال
          </p>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            والمبالغ المستحقة لي وكافة حقوقي على مختلف أنواعها وحتى إنهاء فترة خدمتي .
          </p>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            وتبعاً لذلك فإنني ابرئ ذمة{' '}
            <span style={{ fontWeight: 700 }}>{company}</span>
            {' '}إبراءاً شاملاً عاماً لا رجوع منه مطلقاً لأي
          </p>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            حق أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان .
          </p>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            وبذلك فإننا نبرئ ذمة الموظفة المذكورة أعلاه إبراءاً شاملاً عاماً لا رجوع منه مطلقاً لأي حق
          </p>
          <p style={{ margin: '0 0 4px', width: '100%' }}>
            أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان .
          </p>
        </div>

        {/* Signature — full width dotted lines (fills left side too) */}
        <div style={{ width: '100%', marginTop: 56 }}>
          {[
            { label: 'الاسم', value: blank ? null : fields?.employeeName },
            { label: 'التوقيع', value: null },
            {
              label: 'التاريخ',
              value: blank
                ? null
                : fields?.endDateGregorian || formatGregorianDateAr(new Date().toISOString().slice(0, 10)),
            },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'baseline',
                width: '100%',
                gap: 16,
                marginBottom: 18,
                fontSize: 16,
                ...font,
              }}
            >
              <span style={{ fontWeight: 700, width: 64, flexShrink: 0, textAlign: 'right' }}>{row.label}</span>
              {row.value ? (
                <span style={{ flex: 1, fontWeight: 700, paddingInline: 6, textAlign: 'right' }}>
                  {sanitizePdfText(row.value)}
                </span>
              ) : (
                <span
                  style={{
                    flex: 1,
                    letterSpacing: 3,
                    color: '#333',
                    textAlign: 'right',
                  }}
                >
                  ....................................................................................
                </span>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>
    );
  },
);
