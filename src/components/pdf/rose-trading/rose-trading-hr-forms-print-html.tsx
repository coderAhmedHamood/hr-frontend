'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

const PAGE_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '210mm',
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  padding: '28px 24px 44px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#111',
  minHeight: '297mm',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

export type RoseResignationFormPrintHtmlProps = {
  logoSrc?: string;
  employeeNameAr: string;
  companyNameAr: string;
  branchAr: string;
  positionAr: string;
  nationalityAr: string;
  absenceStartHijri: string;
  absenceStartGregorian: string;
  footerApplicantName: string;
  footerDateGregorian: string;
};

export const RoseResignationFormPrintHtml = React.forwardRef<HTMLDivElement, RoseResignationFormPrintHtmlProps>(
  function RoseResignationFormPrintHtml(
    {
      logoSrc: logoSrcProp,
      employeeNameAr,
      companyNameAr,
      branchAr,
      positionAr,
      nationalityAr,
      absenceStartHijri,
      absenceStartGregorian,
      footerApplicantName,
      footerDateGregorian,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    return (
      <div ref={ref} dir="rtl" lang="ar" style={PAGE_STYLE}>
        <RosePdfWatermark logoSrc={logoSrc} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />

        {/* Subject box */}
        <div
          dir="rtl"
          style={{
            border: '1px solid #111',
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            textAlign: 'center',
            marginBottom: 16,
            width: '60%',
            marginInline: 'auto',
          }}
        >
          الموضوع / استقالة
        </div>

        {/* Info table 2x2 */}
        <div
          dir="rtl"
          style={{
            border: '1px solid #111',
            fontSize: 11,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الاسم</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(employeeNameAr)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الفرع</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(branchAr)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الوظيفة</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(positionAr)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الجنسية</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(nationalityAr)}</div>
          </div>
        </div>

        {/* Addressed to */}
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right', marginBottom: 4 }}>
          إلى السيد مدير / {sanitizePdfText(companyNameAr)}
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right', marginBottom: 12 }}>
          بعد التحية ،،،
        </p>

        {/* Reasons box */}
        <div
          dir="rtl"
          style={{
            border: '1px solid #111',
            padding: '10px 12px',
            fontSize: 12,
            lineHeight: 1.85,
            textAlign: 'right',
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>نظراً للأسباب التالية :</div>
          <div>–1</div>
          <div>–2</div>
          <div>–3</div>
        </div>

        {/* Body text */}
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          أتقدم لسيادتكم بطلب استقالتي عن العمل اعتبارً من تاريخ :{' '}
          <span dir="ltr">{sanitizePdfText(absenceStartHijri)}</span>
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right', marginTop: 6 }}>
          الموافق :{' '}
          <span dir="ltr">{sanitizePdfText(absenceStartGregorian)}</span>{' '}
          م راجياً من سيادتكم قبول طلبي هذا متمنية لكم التوفيق .
        </p>

        {/* Footer table */}
        <div
          dir="rtl"
          style={{
            marginTop: 24,
            border: '1px solid #111',
            fontSize: 11,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '35%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 10.5 }}>
              اسم مقدمة الطلب
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 10.5 }}>
              {sanitizePdfText(footerApplicantName)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '35%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 10.5 }}>
              التوقيع
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 10.5 }}>
              .....................................................................
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ width: '35%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 10.5 }}>
              التاريخ
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 10.5 }}>
              <span dir="ltr">{sanitizePdfText(footerDateGregorian)}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  },
);

export type RoseFinalSettlementFormPrintHtmlProps = {
  logoSrc?: string;
  employeeNameAr: string;
  nationalityAr: string;
  nationalId: string;
  serviceStartGregorian: string;
  serviceStartHijri: string;
  endDateGregorian: string;
  endDateHijri: string;
  footerName: string;
  footerDateGregorian: string;
};

export const RoseFinalSettlementFormPrintHtml = React.forwardRef<HTMLDivElement, RoseFinalSettlementFormPrintHtmlProps>(
  function RoseFinalSettlementFormPrintHtml(
    {
      logoSrc: logoSrcProp,
      employeeNameAr,
      nationalityAr,
      nationalId,
      endDateGregorian,
      endDateHijri,
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

    return (
      <div ref={ref} dir="rtl" lang="ar" style={PAGE_STYLE}>
        <RosePdfWatermark logoSrc={logoSrc} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />

        {/* Body */}
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          أقر أنا /{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(employeeNameAr)}
          </span>{' '}
          ، الجنسية{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(nationalityAr)}
          </span>{' '}
          بموجب بطاقة أحوال رقم ({' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(nationalId)}
          </span>{' '}
          ) الموقعة أدناه بأنه إعتباراً من{' '}
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          تاريخ:{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(endDateHijri)}
          </span>{' '}
          الموافق:{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(endDateGregorian)}
          </span>
          ، قد وصلني جميع الأموال
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right', marginTop: 8 }}>
          والمبالغ المستحقة لي وكافة حقوقي على مختلف أنواعها وحتى إنهاء فترة خدمتي .
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right', marginTop: 8 }}>
          وتبعاً لذلك فإنني أبرئ ذمة مؤسسة روز للتجارة إبراءً شاملاً عاماً لا رجوع منه مطلقاً لأي
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          حق أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان .
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right', marginTop: 8 }}>
          وبذلك فإننا نبرئ ذمة الموظفة المذكورة أعلاه إبراءً شاملاً عاماً لا رجوع منه مطلقاً لأي حق
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان .
        </p>

        {/* Data table */}
        <div
          dir="rtl"
          style={{
            marginTop: 24,
            border: '1px solid #111',
            fontSize: 11,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              borderBottom: '1px solid #111',
            }}
          >
            <div style={{ width: '28%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 10.5 }}>
              الاسم
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 10.5 }}>
              {sanitizePdfText(footerName)}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              borderBottom: '1px solid #111',
            }}
          >
            <div style={{ width: '28%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 10.5 }}>
              التوقيع
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 10.5 }}>
              ....................................................................
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <div style={{ width: '28%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 10.5 }}>
              التاريخ
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 10.5 }}>
              <span dir="ltr">{sanitizePdfText(footerDateGregorian)}</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  },
);

export type RoseExperienceCertificatePrintHtmlProps = {
  logoSrc?: string;
  certificateDateGregorian: string;
  companyNameAr: string;
  recipientLineAr: string;
  departmentAr: string;
  jobTitleAr: string;
  startDateGregorian: string;
  endDateGregorian: string;
  workedVerbAr: 'عمل' | 'عملت';
  performanceClosingAr: string;
};

export const RoseExperienceCertificatePrintHtml = React.forwardRef<HTMLDivElement, RoseExperienceCertificatePrintHtmlProps>(
  function RoseExperienceCertificatePrintHtml(
    {
      logoSrc: logoSrcProp,
      certificateDateGregorian,
      companyNameAr,
      recipientLineAr,
      departmentAr,
      jobTitleAr,
      startDateGregorian,
      endDateGregorian,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    return (
      <div ref={ref} dir="rtl" lang="ar" style={PAGE_STYLE}>
        <RosePdfWatermark logoSrc={logoSrc} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 700, textAlign: 'center', marginBottom: 16, textDecoration: 'underline' }}>
          شهادة خبرة
        </div>

        {/* Main body with blanks */}
        <p style={{ fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          هذه الشهادة لتأكيد أن{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(recipientLineAr)}
          </span>{' '}
          قد عمل في شركة{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(companyNameAr)}
          </span>{' '}
          بمنصب{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(jobTitleAr)}
          </span>{' '}
          منذ{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(startDateGregorian)}
          </span>{' '}
          وحتى{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(endDateGregorian)}
          </span>
          .
        </p>

        {/* Performance header */}
        <div style={{ marginTop: 16, fontSize: 12, lineHeight: 1.85, textAlign: 'right', fontWeight: 700 }}>
          خلال فترة عمله معنا، وجدنا أنه:
        </div>

        {/* Traits */}
        <div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          فرد أنيق المظهر، حسن المعاملة، مبادر للعمل وسريع البديهة، قادر على تحمل ضغوط العمل، وفرد ممتاز في فريق العمل.
        </div>

        {/* Closing wish */}
        <div style={{ marginTop: 16, fontSize: 12, lineHeight: 1.85, textAlign: 'right' }}>
          نتمنى له الأفضل في ما سيأتي في حياته المهنية،،،
        </div>

        <div style={{ flex: 1, minHeight: 10 }} aria-hidden />

        {/* Manager signature */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>المدير العام</div>
          <div style={{ width: 220, height: 1, backgroundColor: '#000', marginTop: 8 }} />
          <div style={{ marginTop: 4, fontSize: 10, color: '#64748b', textAlign: 'center' }}>
            ............................................
          </div>
        </div>
        </div>
      </div>
    );
  },
);

