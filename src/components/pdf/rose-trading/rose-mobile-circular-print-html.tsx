'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import {
  formatGregorianDateAr,
} from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

export type RoseMobileCircularPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
  /** Overrides today's date (yyyy-mm-dd) */
  dateIso?: string;
  /** Optional — fills تعهد وإقرار when provided */
  employeeName?: string | null;
  nationalId?: string | null;
};

const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };

/** Local calendar date as yyyy-mm-dd (avoids UTC shift). */
function localTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function Bullet({ children, hollow }: { children: React.ReactNode; hollow?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 4,
        fontSize: 15,
        lineHeight: 1.85,
        textAlign: 'right',
        ...font,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 8,
          height: 8,
          marginTop: 8,
          borderRadius: '50%',
          backgroundColor: hollow ? 'transparent' : '#111',
          border: hollow ? '1.5px solid #111' : 'none',
          boxSizing: 'border-box',
        }}
      />
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

/**
 * Mobile phone use circular — matches paper layout.
 * Dynamic header: التاريخ + الموضوع / رقم التعميم.
 */
export const RoseMobileCircularPrintHtml = React.forwardRef<HTMLDivElement, RoseMobileCircularPrintHtmlProps>(
  function RoseMobileCircularPrintHtml(
    {
      logoSrc: logoSrcProp,
      companyNameAr,
      companyNameEn,
      dateIso,
      employeeName,
      nationalId,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const iso = dateIso?.trim() || localTodayIso();
    const dateLabel = formatGregorianDateAr(iso);
    const name = employeeName?.trim() ? sanitizePdfText(employeeName.trim()) : '';
    const id = nationalId?.trim() ? sanitizePdfText(nationalId.trim()) : '';

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
          padding: '24px 36px 40px',
          fontSize: 15,
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

        {/* Dynamic top header */}
        <div style={{ marginTop: 14, marginBottom: 18, textAlign: 'right', ...font }}>
          <div style={{ fontSize: 15, marginBottom: 10, textDecoration: 'underline' }}>
            التاريخ: {sanitizePdfText(dateLabel)}
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              textDecoration: 'underline',
              textAlign: 'center',
              marginBottom: 18,
              ...font,
            }}
          >
            الموضوع: تعميم إداري
          </div>
        </div>

        {/* Recipients — right aligned, same line */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 40,
            marginBottom: 18,
            fontSize: 17,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            textAlign: 'right',
            ...font,
          }}
        >
          <span>السادة / مدراء الفروع</span>
          <span>السادة / الموظفين</span>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.9, textAlign: 'right', margin: '0 0 10px', ...font }}>
          إشارة إلى التنبيهات الشفوية السابقة، ونظراً لمخاطر استخدام الجوال أثناء ساعات العمل وهي:
        </p>

        <div style={{ marginBottom: 12, paddingInlineStart: 4 }}>
          <Bullet>ضعف التركيز على المهام الموكلة.</Bullet>
          <Bullet>إزعاج الزملاء في العمل.</Bullet>
          <Bullet>تأخير إنجاز الأعمال وانخفاض المبيعات.</Bullet>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.9, textAlign: 'right', margin: '0 0 8px', ...font }}>
          فإنه يمنع استخدام الجوال أثناء ساعات العمل إلا في الحالات التالية:
        </p>

        <div style={{ marginBottom: 16, paddingInlineStart: 4 }}>
          <Bullet hollow>الاتصال بالعائلة لمدة لا تتجاوز ثلاث دقائق.</Bullet>
          <Bullet hollow>حالات الطوارئ.</Bullet>
          <Bullet hollow>بعد أخذ الإذن من الإدارة.</Bullet>
        </div>

        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'underline',
            marginBottom: 12,
            ...font,
          }}
        >
          حالات استخدام الجوال والعقوبات:
        </div>

        <div style={{ marginBottom: 22, fontSize: 15, lineHeight: 2, textAlign: 'right', ...font }}>
          <div>1- في المرة الأولى يتم توجيه الإنذار الأول مع خصم ساعة من الراتب.</div>
          <div>2- في المرة الثانية يتم توجيه الإنذار الثاني مع خصم نصف يوم من الراتب.</div>
          <div>3- في المرة الثالثة يتم توجيه الإنذار الثالث مع خصم يوم كامل من الراتب.</div>
          <div>4- في المرة الرابعة يتم فصل الموظف وإنهاء عقده دون تعويض.</div>
        </div>

        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center',
            textDecoration: 'underline',
            marginBottom: 16,
            ...font,
          }}
        >
          تعهد وإقرار:
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: 14,
            fontSize: 15,
            ...font,
          }}
        >
          <div style={{ flex: 1, textAlign: 'right' }}>
            أنا الموظف:{' '}
            {name ? (
              <span style={{ fontWeight: 700 }}>{name}</span>
            ) : (
              <span style={{ letterSpacing: 2 }}>..............................</span>
            )}
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            هوية رقم:{' '}
            {id ? (
              <span style={{ fontWeight: 700 }}>{id}</span>
            ) : (
              <span style={{ letterSpacing: 2 }}>..............................</span>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            marginTop: 8,
            fontSize: 15,
            lineHeight: 1.9,
            ...font,
          }}
        >
          <div style={{ flex: 1, textAlign: 'right' }}>
            أقر بأنني قرأت وفهمت ما ورد بهذه التعميم وألتزم بما فيه من بنود.
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center', minWidth: 120 }}>
            <div style={{ fontWeight: 700, marginBottom: 28 }}>التوقيع</div>
            <div style={{ borderBottom: '1px dotted #333', width: '100%' }} />
          </div>
        </div>
        </div>
      </div>
    );
  },
);
