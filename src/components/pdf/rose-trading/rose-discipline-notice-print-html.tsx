'use client';

import * as React from 'react';
import { PDF_PRINT_FONT_FAMILY } from '@/components/pdf/lib/pdf-print-font';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import type { HRDisciplineNoticeKind } from '@/features/hr/discipline/lib/types';

const TITLE_BG = '#d9d9d9';

const INTRO_PARAGRAPH =
  'هذا الإنذار الرسمي بعد الإنذار الشفهي يتعلق بالمخالفة التي أرتكبتها أثناء الدوام وساعات العمل الرسمية ، فكما تعلم أنه من أهم مبادئ مؤسستنا الحفاظ على الأداء الجيد المتكافئ لتحقيق أهداف المؤسسة وضمان استمرارية نجاحها.';

export type RoseDisciplineNoticePrintFields = {
  noticeDate: string;
  employeeNameAr: string;
  nationalId: string;
  nationality: string;
  jobTitle: string;
  branchNameAr: string;
  kind: HRDisciplineNoticeKind;
  violationDetail: string;
};

export type RoseDisciplineNoticePrintHtmlProps = {
  logoSrc?: string;
  companyNameAr?: string;
  companyNameEn?: string | null;
  fields: RoseDisciplineNoticePrintFields;
};

function formatGregorianDateAr(iso: string): string {
  const trimmed = iso.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (!m) return sanitizePdfText(trimmed || '—');
  return `${m[1]}/${m[2]}/${m[3]}`;
}

function fieldValue(value: string | undefined | null): string {
  const text = value?.trim();
  return text ? sanitizePdfText(text) : '—';
}

function Checkbox({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        aria-hidden
        style={{
          width: 13,
          height: 13,
          border: '1.5px solid #111',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {checked ? '✓' : ''}
      </span>
      {label}
    </span>
  );
}

export const RoseDisciplineNoticePrintHtml = React.forwardRef<
  HTMLDivElement,
  RoseDisciplineNoticePrintHtmlProps
>(function RoseDisciplineNoticePrintHtml(
  { logoSrc: logoSrcProp, companyNameAr, companyNameEn, fields },
  ref,
) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
  React.useEffect(() => {
    if (logoSrcProp) setLogoSrc(logoSrcProp);
    else setLogoSrc(getPdfLogoSrc());
  }, [logoSrcProp]);

  const font: React.CSSProperties = { fontFamily: PDF_PRINT_FONT_FAMILY };

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
        fontSize: 22.5,
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
            margin: '0 auto 22px',
            background: TITLE_BG,
            borderRadius: 10,
            padding: '8px 34px',
            fontSize: 26,
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          إنذار موظف / ـة
        </div>

        <p style={{ lineHeight: 2.1, textAlign: 'right', margin: '0 0 2px' }}>
          <strong>التاريخ :</strong>{' '}
          <span style={{ borderBottom: '1px dotted #666', paddingInline: 4 }}>
            {formatGregorianDateAr(fields.noticeDate)}
          </span>{' '}
          <strong> م</strong>
        </p>

        <p style={{ lineHeight: 2.1, textAlign: 'right', margin: '0 0 2px' }}>
          <strong>إلى الموظف / ـة :</strong>{' '}
          <span style={{ borderBottom: '1px dotted #666', paddingInline: 4 }}>
            {fieldValue(fields.employeeNameAr)}
          </span>
          <strong> ، هوية رقم :</strong>{' '}
          <span style={{ borderBottom: '1px dotted #666', paddingInline: 4 }}>
            {fieldValue(fields.nationalId)}
          </span>
          <strong> ، الجنسية :</strong>{' '}
          <span style={{ borderBottom: '1px dotted #666', paddingInline: 4 }}>
            {fieldValue(fields.nationality)}
          </span>
        </p>

        <p style={{ lineHeight: 2.1, textAlign: 'right', margin: '0 0 2px' }}>
          <strong>المسمى الوظيفي :</strong>{' '}
          <span style={{ borderBottom: '1px dotted #666', paddingInline: 4 }}>
            {fieldValue(fields.jobTitle)}
          </span>
        </p>

        <p style={{ lineHeight: 2.1, textAlign: 'right', margin: '0 0 2px' }}>
          <strong>الفرع :</strong>{' '}
          <span
            style={{
              display: 'inline-block',
              minWidth: '72%',
              borderBottom: '1px dotted #666',
              paddingInline: 4,
            }}
          >
            {fieldValue(fields.branchNameAr)}
          </span>
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 18,
            alignItems: 'center',
            margin: '10px 0 18px',
            fontWeight: 700,
          }}
        >
          <strong>درجة الإنذار :</strong>
          <Checkbox label="إنذار أول" checked={fields.kind === 'first'} />
          <Checkbox label="إنذار ثاني" checked={fields.kind === 'second'} />
          <Checkbox label="إنذار نهائي" checked={fields.kind === 'final'} />
        </div>

        <p style={{ lineHeight: 2, textAlign: 'right', margin: '18px 0 16px' }}>
          {INTRO_PARAGRAPH}
        </p>

        <p style={{ lineHeight: 2.2, textAlign: 'right', margin: '0 0 18px' }}>
          <span>•</span>
          <strong> نوع المخالفة بالتفصيل :</strong>{' '}
          <span
            style={{
              display: 'inline-block',
              minWidth: '68%',
              borderBottom: '1px dotted #666',
              paddingInline: 4,
              fontWeight: 700,
            }}
          >
            {fieldValue(fields.violationDetail)}
          </span>
        </p>

        <p style={{ lineHeight: 2, textAlign: 'right', margin: '0 0 8px', fontWeight: 700 }}>
          ملاحظة : تكرار المخالفة مستقبلاً يؤدي إلى الفصل .
        </p>
        <p style={{ lineHeight: 2, textAlign: 'right', margin: '0 0 8px' }}>
          شكراً لتعاونك ..
        </p>
        <p style={{ lineHeight: 2, textAlign: 'right', margin: '0 0 36px' }}>
          مع خالص التحية ..
        </p>

        <div style={{ marginTop: 12 }}>
          <p style={{ lineHeight: 2.6, textAlign: 'right', fontWeight: 700, margin: 0 }}>
            توقيع المدير أو المشرف :
            <span
              style={{
                display: 'inline-block',
                minWidth: '52%',
                borderBottom: '1px dotted #666',
                marginInlineStart: 6,
              }}
            >
              &nbsp;
            </span>
          </p>
          <p style={{ lineHeight: 2.6, textAlign: 'right', fontWeight: 700, margin: 0 }}>
            توقيع الموظف / ـة :
            <span
              style={{
                display: 'inline-block',
                minWidth: '52%',
                borderBottom: '1px dotted #666',
                marginInlineStart: 6,
              }}
            >
              &nbsp;
            </span>
          </p>
        </div>
      </div>
    </div>
  );
});
