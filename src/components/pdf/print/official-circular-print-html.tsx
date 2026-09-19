'use client';

import * as React from 'react';
import {
  PDF_BODY_FONT,
  PDF_LINE_HEIGHT,
  PDF_PAGE_FONT,
  PDF_PAGE_PADDING,
  PDF_RECIPIENTS_FONT,
  PDF_SECTION_FONT,
  pdfOfficialFont,
} from '@/components/pdf/lib/official-document-typography';
import {
  parseCircularBodyBlocks,
  type CircularBodyBlock,
} from '@/components/pdf/lib/parse-circular-body-blocks';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { RoseCompanyStamp } from '@/components/pdf/rose-trading/rose-company-stamp';
import {
  formatGregorianDateAr,
} from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

/** Fixed recipient lines on official circular paper. */
export const CIRCULAR_RECIPIENT_PRIMARY_AR = 'السادة / مدراء الفروع';
export const CIRCULAR_RECIPIENT_SECONDARY_AR = 'السادة / الموظفين';

export type OfficialCircularPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
  /** ISO date yyyy-mm-dd */
  dateIso: string;
  /** Full subject line e.g. «الموضوع: عنوان التعميم» */
  subjectLine: string;
  recipientPrimaryAr?: string;
  recipientSecondaryAr?: string;
  /** Main document body — from DB / form */
  bodyAr: string;
  employeeName?: string | null;
  nationalId?: string | null;
  /** Show pledge + signature block (default true) */
  showPledge?: boolean;
};

function Bullet({
  children,
  hollow,
}: {
  children: React.ReactNode;
  hollow?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginBottom: 6,
        fontSize: PDF_BODY_FONT,
        lineHeight: PDF_LINE_HEIGHT,
        textAlign: 'right',
        ...pdfOfficialFont,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 10,
          height: 10,
          marginTop: 10,
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

function BodyBlocks({ blocks }: { blocks: CircularBodyBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      {blocks.map((block, i) => {
        const key = `${block.type}-${i}`;
        if (block.type === 'section') {
          return (
            <div
              key={key}
              style={{
                fontSize: PDF_SECTION_FONT,
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'underline',
                marginTop: i > 0 ? 14 : 0,
                marginBottom: 14,
                ...pdfOfficialFont,
              }}
            >
              {sanitizePdfText(block.text)}
            </div>
          );
        }
        if (block.type === 'bullet') {
          return (
            <div key={key} style={{ paddingInlineStart: 4 }}>
              <Bullet hollow={block.hollow}>{sanitizePdfText(block.text)}</Bullet>
            </div>
          );
        }
        if (block.type === 'numbered') {
          return (
            <div
              key={key}
              style={{
                fontSize: PDF_BODY_FONT,
                lineHeight: PDF_LINE_HEIGHT,
                textAlign: 'right',
                marginBottom: 4,
                ...pdfOfficialFont,
              }}
            >
              {sanitizePdfText(block.label)} {sanitizePdfText(block.text)}
            </div>
          );
        }
        return (
          <p
            key={key}
            style={{
              fontSize: PDF_BODY_FONT,
              lineHeight: PDF_LINE_HEIGHT,
              textAlign: 'right',
              margin: '0 0 12px',
              ...pdfOfficialFont,
            }}
          >
            {sanitizePdfText(block.text)}
          </p>
        );
      })}
    </div>
  );
}

/** Official circular layout — paper structure with dynamic DB/form content. */
export const OfficialCircularPrintHtml = React.forwardRef<
  HTMLDivElement,
  OfficialCircularPrintHtmlProps
>(function OfficialCircularPrintHtml(
  {
    logoSrc: logoSrcProp,
    companyNameAr,
    companyNameEn,
    dateIso,
    subjectLine,
    recipientPrimaryAr = CIRCULAR_RECIPIENT_PRIMARY_AR,
    recipientSecondaryAr = CIRCULAR_RECIPIENT_SECONDARY_AR,
    bodyAr,
    employeeName,
    nationalId,
    showPledge = true,
  },
  ref,
) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
  React.useEffect(() => {
    if (logoSrcProp) setLogoSrc(logoSrcProp);
    else setLogoSrc(getPdfLogoSrc());
  }, [logoSrcProp]);

  const dateLabel = formatGregorianDateAr(dateIso);
  const subject = subjectLine.trim()
    ? sanitizePdfText(subjectLine.trim())
    : 'الموضوع: تعميم إداري';
  const name = employeeName?.trim() ? sanitizePdfText(employeeName.trim()) : '';
  const id = nationalId?.trim() ? sanitizePdfText(nationalId.trim()) : '';
  const bodyBlocks = React.useMemo(
    () => parseCircularBodyBlocks(bodyAr),
    [bodyAr],
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
        padding: PDF_PAGE_PADDING,
        fontSize: PDF_PAGE_FONT,
        fontWeight: 700,
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '297mm',
        overflow: 'hidden',
        ...pdfOfficialFont,
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

        <div style={{ marginTop: 14, marginBottom: 18, textAlign: 'right', ...pdfOfficialFont }}>
          <div style={{ fontSize: PDF_BODY_FONT, marginBottom: 12, textDecoration: 'underline' }}>
            التاريخ: {sanitizePdfText(dateLabel)}
          </div>
          <div
            style={{
              fontSize: PDF_BODY_FONT,
              fontWeight: 700,
              textDecoration: 'underline',
              marginBottom: 18,
              ...pdfOfficialFont,
            }}
          >
            {subject}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'nowrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
            fontSize: PDF_RECIPIENTS_FONT,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            ...pdfOfficialFont,
          }}
        >
          <span>{sanitizePdfText(recipientPrimaryAr)}</span>
          <span>{sanitizePdfText(recipientSecondaryAr)}</span>
        </div>

        <BodyBlocks blocks={bodyBlocks} />

        {showPledge ? (
          <>
            <div
              style={{
                fontSize: PDF_SECTION_FONT,
                fontWeight: 700,
                textAlign: 'center',
                textDecoration: 'underline',
                marginBottom: 18,
                marginTop: 10,
                ...pdfOfficialFont,
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
                marginBottom: 16,
                fontSize: PDF_BODY_FONT,
                ...pdfOfficialFont,
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
                marginTop: 10,
                fontSize: PDF_BODY_FONT,
                lineHeight: PDF_LINE_HEIGHT,
                ...pdfOfficialFont,
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
          </>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 20 }}>
          <RoseCompanyStamp width={130} />
        </div>
      </div>
    </div>
  );
});
