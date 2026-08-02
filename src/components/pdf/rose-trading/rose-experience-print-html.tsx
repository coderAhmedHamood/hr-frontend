'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { formatGregorianDateAr } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

export type RoseExperiencePrintFields = {
  certificateDate: string;
  employeeName: string;
  companyName: string;
  department: string;
  position: string;
  startDate: string;
  endDate: string;
};

export type RoseExperiencePrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
  /** When null/undefined, blank dotted placeholders for handwritten fill-in. */
  fields?: RoseExperiencePrintFields | null;
};

const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };
const DOTS = '..................................................';
const DOTS_LONG = '........................................................................';

const PERFORMANCE_TEXT =
  'فرد أنيق المظهر، حسن المعاملة، مبادر للعمل وسريع البديهة، قادر على تحمل ضغوط العمل، وفرد ممتاز في فريق العمل';

function Blank({ long }: { long?: boolean }) {
  return <span style={{ letterSpacing: '0.5px', paddingInline: 6 }}>{long ? DOTS_LONG : DOTS}</span>;
}

function Value({ text, blank }: { text?: string; blank?: boolean }) {
  if (blank || !text?.trim()) return <Blank />;
  return (
    <span
      style={{
        fontWeight: 700,
        paddingInline: 10,
        marginInline: 4,
        display: 'inline',
        whiteSpace: 'pre',
      }}
    >
      {`  ${sanitizePdfText(text.trim())}  `}
    </span>
  );
}

/**
 * Experience certificate — matches paper layout.
 * Letterhead kept; `fields` null = blank form, otherwise filled from employee data.
 */
export const RoseExperiencePrintHtml = React.forwardRef<HTMLDivElement, RoseExperiencePrintHtmlProps>(
  function RoseExperiencePrintHtml(
    { logoSrc: logoSrcProp, companyNameAr, companyNameEn, fields },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const blank = !fields;
    const dateLabel = blank ? (
      <Blank />
    ) : (
      <span style={{ fontWeight: 700, paddingInline: 10, marginInlineStart: 6, whiteSpace: 'pre' }}>
        {`  ${sanitizePdfText(fields.certificateDate || formatGregorianDateAr(new Date().toISOString().slice(0, 10)))}  `}
      </span>
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
          padding: '26px 40px 48px',
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

        {/* Date — physical left */}
        <div
          style={{
            alignSelf: 'flex-end',
            fontSize: 15,
            marginTop: 18,
            marginBottom: 28,
            textAlign: 'right',
            ...font,
          }}
        >
          التاريخ: {dateLabel}
        </div>

        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'underline',
            lineHeight: 1.7,
            marginBottom: 36,
            ...font,
          }}
        >
          <div>شهادة خبرة</div>
          <div>إلى من يهمه الأمر</div>
        </div>

        <p
          style={{
            fontSize: 16,
            lineHeight: 2.35,
            textAlign: 'right',
            margin: '0 0 22px',
            ...font,
          }}
        >
          هذه الشهادة لتأكيد أن السيد / ة <Value text={fields?.employeeName} blank={blank} /> قد عمل في شركة{' '}
          <Value text={fields?.companyName} blank={blank} />
          <br />
          بمنصب <Value text={fields?.position} blank={blank} /> منذ <Value text={fields?.startDate} blank={blank} /> وحتى{' '}
          <Value text={fields?.endDate} blank={blank} />
        </p>

        <p style={{ fontSize: 16, lineHeight: 2.2, textAlign: 'right', margin: '0 0 10px', ...font }}>
          خلال فترة عمله معنا، وجدنا أنه:
        </p>
        <p style={{ fontSize: 16, lineHeight: 2.2, textAlign: 'right', margin: '0 0 22px', ...font }}>
          {PERFORMANCE_TEXT}
        </p>

        <p style={{ fontSize: 16, lineHeight: 2.2, textAlign: 'right', margin: '0 0 48px', ...font }}>
          نتمنى له الأفضل في ما سيأتي في حياته المهنية،،،
        </p>

        {/* Signature — physical left */}
        <div
          style={{
            alignSelf: 'flex-end',
            textAlign: 'center',
            marginTop: 'auto',
            paddingTop: 24,
            minWidth: 160,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 36, ...font }}>المدير العام</div>
          <div style={{ borderBottom: '1px dotted #333', width: '100%', minHeight: 1 }} />
        </div>
        </div>
      </div>
    );
  },
);
