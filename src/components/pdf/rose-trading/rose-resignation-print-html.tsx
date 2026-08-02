'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

export type RoseResignationPrintFields = {
  applicantName: string;
  branchName: string;
  jobTitle: string;
  nationality: string;
  /** Multi-line reasons text. */
  reasons: string;
  effectiveDateHijri?: string | null;
  effectiveDateGregorian: string;
  signatureName?: string | null;
  submissionDate: string;
};

export type RoseResignationPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
  /** When null/undefined, blank form for handwritten fill-in. */
  fields?: RoseResignationPrintFields | null;
};

const BORDER = '#111111';
const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };

function InfoCell({
  label,
  value,
  blank,
  showTop,
  showStart,
}: {
  label: string;
  value?: string | null;
  blank?: boolean;
  showTop?: boolean;
  showStart?: boolean;
}) {
  const edge = `1px solid ${BORDER}`;
  const text = value?.trim();
  return (
    <>
      <div
        style={{
          borderBottom: edge,
          borderInlineEnd: edge,
          borderTop: showTop ? edge : 'none',
          borderInlineStart: showStart ? edge : 'none',
          padding: '8px 10px',
          fontWeight: 700,
          fontSize: 14,
          textAlign: 'right',
          backgroundColor: '#fff',
          ...font,
        }}
      >
        {label}
      </div>
      <div
        style={{
          borderBottom: edge,
          borderInlineEnd: edge,
          borderTop: showTop ? edge : 'none',
          borderInlineStart: 'none',
          padding: '8px 10px',
          minHeight: 34,
          backgroundColor: '#fff',
          fontSize: 14,
          fontWeight: blank || !text ? 400 : 700,
          textAlign: 'right',
          ...font,
        }}
      >
        {blank || !text ? null : sanitizePdfText(text)}
      </div>
    </>
  );
}

function FooterRow({
  label,
  value,
  blank,
  isFirst,
}: {
  label: string;
  value?: string | null;
  blank?: boolean;
  isFirst?: boolean;
}) {
  const text = value?.trim();
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div
        style={{
          width: '32%',
          border: `1px solid ${BORDER}`,
          borderTop: isFirst ? `1px solid ${BORDER}` : 'none',
          padding: '10px 12px',
          fontWeight: 700,
          fontSize: 14,
          textAlign: 'right',
          ...font,
        }}
      >
        {label}
      </div>
      <div
        style={{
          flex: 1,
          border: `1px solid ${BORDER}`,
          borderTop: isFirst ? `1px solid ${BORDER}` : 'none',
          borderInlineStart: 'none',
          minHeight: 36,
          padding: '10px 12px',
          fontSize: 14,
          fontWeight: blank || !text ? 400 : 700,
          textAlign: 'right',
          ...font,
        }}
      >
        {blank || !text ? null : sanitizePdfText(text)}
      </div>
    </div>
  );
}

function parseReasonLines(reasons: string): string[] {
  const lines = reasons
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[\d.•\-–]+\s*/, '').trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [reasons.trim()].filter(Boolean);
}

/**
 * Resignation form — blank dotted layout, or filled from a saved record.
 */
export const RoseResignationPrintHtml = React.forwardRef<HTMLDivElement, RoseResignationPrintHtmlProps>(
  function RoseResignationPrintHtml(
    { logoSrc: logoSrcProp, companyNameAr, companyNameEn, fields },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const blank = !fields;
    const company = sanitizePdfText(companyNameAr.trim() || '—');
    const reasonLines = blank
      ? [1, 2, 3].map((n) => `${n}-`)
      : parseReasonLines(fields.reasons).map((line, i) => `${i + 1}- ${sanitizePdfText(line)}`);

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
          padding: '26px 32px 40px',
          fontSize: 15,
          color: '#111111',
          overflow: 'hidden',
          ...font,
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
              width: 'fit-content',
              marginInline: 'auto',
              border: `1.5px solid ${BORDER}`,
              padding: '8px 28px',
              marginTop: 28,
              marginBottom: 48,
              fontSize: 17,
              fontWeight: 700,
              textAlign: 'center',
              ...font,
            }}
          >
            الموضوع / استقالة
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '18% 32% 18% 32%',
              marginBottom: 48,
            }}
          >
            <InfoCell
              label="الاسم"
              value={fields?.applicantName}
              blank={blank}
              showTop
              showStart
            />
            <InfoCell label="الفرع" value={fields?.branchName} blank={blank} showTop />
            <InfoCell label="الوظيفة" value={fields?.jobTitle} blank={blank} showStart />
            <InfoCell label="الجنسية" value={fields?.nationality} blank={blank} />
          </div>

          <div style={{ fontSize: 15, lineHeight: 1.9, textAlign: 'right', marginBottom: 12, ...font }}>
            إلى السيد مدير/{' '}
            <span style={{ fontWeight: 700 }}>{company}</span>
          </div>
          <div style={{ fontSize: 15, textAlign: 'center', marginBottom: 48, ...font }}>
            بعد التحية ،،،
          </div>

          <div
            style={{
              border: `1.5px solid ${BORDER}`,
              padding: '12px 14px 16px',
              marginBottom: 48,
              minHeight: 120,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'right', marginBottom: 10, ...font }}>
              نظراً للأسباب التالية :
            </div>
            {reasonLines.map((line) => (
              <div
                key={line}
                style={{
                  fontSize: 15,
                  lineHeight: 2.2,
                  textAlign: 'right',
                  minHeight: 26,
                  ...font,
                }}
              >
                {line}
              </div>
            ))}
          </div>

          <p style={{ fontSize: 15, lineHeight: 2, textAlign: 'right', margin: '0 0 16px', ...font }}>
            أتقدم لسيادتكم بطلب استقالتي عن العمل اعتباراً من تاريخ :{' '}
            {blank || !fields.effectiveDateHijri?.trim() ? (
              <>&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;هـ</>
            ) : (
              <span style={{ fontWeight: 700 }}>{sanitizePdfText(fields.effectiveDateHijri.trim())} هـ</span>
            )}
          </p>
          <p style={{ fontSize: 15, lineHeight: 2, textAlign: 'right', margin: '0 0 72px', ...font }}>
            الموافق :{' '}
            {blank ? (
              <>&nbsp;&nbsp;/&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;م</>
            ) : (
              <span style={{ fontWeight: 700 }}>{sanitizePdfText(fields.effectiveDateGregorian)} م</span>
            )}{' '}
            راجياً من سيادتكم قبول طلبي هذا متمنية لكم التوفيق .
          </p>

          <div>
            <FooterRow
              label="اسم مقدمة الطلب"
              value={fields?.applicantName || fields?.signatureName}
              blank={blank}
              isFirst
            />
            <FooterRow label="التوقيع" blank />
            <FooterRow label="التاريخ" value={fields?.submissionDate} blank={blank} />
          </div>
        </div>
      </div>
    );
  },
);
