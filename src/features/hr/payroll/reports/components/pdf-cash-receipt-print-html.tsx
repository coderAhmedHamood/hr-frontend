'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import type { CashReceiptVoucherPurpose } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';

/** Kept for legacy dialog imports — blank form no longer uses reasons. */
export type CashReceiptReason =
  | 'salary'
  | 'advance'
  | 'allowance'
  | 'overtime'
  | 'storage_deficit'
  | 'other';

export const CASH_RECEIPT_REASON_LABELS: Record<CashReceiptReason, string> = {
  salary: 'راتب شهر',
  advance: 'سلفة',
  allowance: 'بدل',
  overtime: 'بدل إضافي لمدة',
  storage_deficit: 'بدل تحمل عجز مخزون شهر',
  other: 'أخرى',
};

/** @deprecated Use `CASH_RECEIPT_REASON_LABELS` */
export const REASON_LABELS = CASH_RECEIPT_REASON_LABELS;

export type CashReceiptPrintFields = {
  recipientName: string;
  institutionName: string;
  branchName: string;
  amount: string;
  /** @deprecated Not printed — kept optional for older saved payloads. */
  amountInWords?: string;
  purpose: CashReceiptVoucherPurpose | string;
  purposeMonth?: number | null;
  purposeYear?: number | null;
  overtimeDays?: number | null;
  otherDescription?: string | null;
  signatureName?: string | null;
  /** Display-ready date string (e.g. Arabic gregorian). */
  receiptDate: string;
  branchManagerSignatureName?: string | null;
  hrAffairsSignatureName?: string | null;
  generalSupervisorSignatureName?: string | null;
  financialManagerSignatureName?: string | null;
};

export type CashReceiptPrintHtmlProps = {
  logoSrc?: string;
  companyNameAr: string;
  companyNameEn?: string | null;
  /** When null/undefined, blank dotted placeholders for handwritten fill-in. */
  fields?: CashReceiptPrintFields | null;
};

const font: React.CSSProperties = { fontFamily: 'Arial, Helvetica, sans-serif' };
const DOTS = '........................................................................';
const DOTS_SHORT = '....................................';
const DOTS_MED = '....................';

function Checkbox({ checked }: { checked?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 12,
        height: 12,
        border: '1.5px solid #111',
        marginInlineStart: 8,
        marginInlineEnd: 2,
        flexShrink: 0,
        verticalAlign: 'middle',
        boxSizing: 'border-box',
        fontSize: 10,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {checked ? '✓' : null}
    </span>
  );
}

function ReasonRow({ children, checked }: { children: React.ReactNode; checked?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        fontSize: 14,
        lineHeight: 1.85,
        marginBottom: 6,
        textAlign: 'right',
        fontWeight: checked ? 700 : 400,
        ...font,
      }}
    >
      <Checkbox checked={checked} />
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

function DottedField({
  label,
  value,
  blank,
}: {
  label: string;
  value?: string | null;
  blank?: boolean;
}) {
  const text = value?.trim();
  return (
    <div style={{ fontSize: 15, lineHeight: 2.1, textAlign: 'right', marginBottom: 4, ...font }}>
      {label}{' '}
      {blank || !text ? (
        DOTS
      ) : (
        <span style={{ fontWeight: 700, paddingInline: 6 }}>{sanitizePdfText(text)}</span>
      )}
    </div>
  );
}

function Slot({
  blank,
  value,
  dots = DOTS_MED,
}: {
  blank: boolean;
  value?: string | number | null;
  dots?: string;
}) {
  if (blank || value == null || String(value).trim() === '') {
    return <span>{dots}</span>;
  }
  return <span style={{ fontWeight: 700, paddingInline: 4 }}>{sanitizePdfText(String(value))}</span>;
}

function periodSlots(
  blank: boolean,
  month?: number | null,
  year?: number | null,
) {
  const yearShort =
    year != null && Number.isFinite(year) ? String(year).slice(-2) : null;
  return (
    <>
      <Slot blank={blank} value={month} />/<Slot blank={blank} value={yearShort} dots={DOTS_MED} /> م
    </>
  );
}

/**
 * Cash receipt form — blank dotted layout, or filled from a saved voucher.
 */
export const CashReceiptPrintHtml = React.forwardRef<HTMLDivElement, CashReceiptPrintHtmlProps>(
  function CashReceiptPrintHtml(
    { logoSrc: logoSrcProp, companyNameAr, companyNameEn, fields },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const blank = !fields;
    const purpose = fields?.purpose ?? null;
    const is = (p: CashReceiptVoucherPurpose) => !blank && purpose === p;

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
          padding: '26px 36px 40px',
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

          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              textAlign: 'center',
              marginTop: 12,
              marginBottom: 28,
              ...font,
            }}
          >
            {blank || fields?.purposeMonth == null || fields?.purposeYear == null
              ? 'سند راتب'
              : `سند راتب شهر ${fields.purposeMonth}/${String(fields.purposeYear).slice(-2)} م`}
          </div>

          <div style={{ fontSize: 15, lineHeight: 2.15, textAlign: 'right', marginBottom: 6, ...font }}>
            أقرّ أنا / <Slot blank={blank} value={fields?.recipientName} dots={DOTS} /> الموقع أدناه
          </div>
          <div style={{ fontSize: 15, lineHeight: 2.15, textAlign: 'right', marginBottom: 6, ...font }}>
            بأن راتبي المستحق من مؤسسة{' '}
            <Slot
              blank={blank}
              value={fields?.institutionName || companyNameAr}
              dots={DOTS}
            />{' '}
            ، فرع <Slot blank={blank} value={fields?.branchName} dots={DOTS_SHORT} />
          </div>
          <div style={{ fontSize: 15, lineHeight: 2.15, textAlign: 'right', marginBottom: 18, ...font }}>
            مبلغ وقدره ( <Slot blank={blank} value={fields?.amount} dots={DOTS_SHORT} /> ريال )
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'right', marginBottom: 12, ...font }}>
            وذلك مقابل :
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 28px',
              marginBottom: 8,
            }}
          >
            <div>
              <ReasonRow checked={is('salary')}>
                راتب شهر {periodSlots(blank || !is('salary'), fields?.purposeMonth, fields?.purposeYear)}
              </ReasonRow>
              <ReasonRow checked={is('overtime')}>
                بدل إضافي لمدة{' '}
                <Slot
                  blank={blank || !is('overtime')}
                  value={fields?.overtimeDays}
                  dots={DOTS_MED}
                />{' '}
                يوم
              </ReasonRow>
              <ReasonRow checked={is('cash_withdrawal')}>
                سحب نقدي يخصم من راتب شهر{' '}
                {periodSlots(
                  blank || !is('cash_withdrawal'),
                  fields?.purposeMonth,
                  fields?.purposeYear,
                )}
              </ReasonRow>
            </div>
            <div>
              <ReasonRow checked={is('transport_allowance')}>
                بدل مواصلات شهر{' '}
                {periodSlots(
                  blank || !is('transport_allowance'),
                  fields?.purposeMonth,
                  fields?.purposeYear,
                )}
              </ReasonRow>
              <ReasonRow checked={is('inventory_shortage')}>
                بدل تحمل عجز مخزون شهر{' '}
                {periodSlots(
                  blank || !is('inventory_shortage'),
                  fields?.purposeMonth,
                  fields?.purposeYear,
                )}
              </ReasonRow>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <ReasonRow checked={is('other')}>
              اخرى حدد البيان :{' '}
              <Slot
                blank={blank || !is('other')}
                value={fields?.otherDescription}
                dots={DOTS}
              />
            </ReasonRow>
            {blank || !is('other') ? (
              <>
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 2.2,
                    textAlign: 'right',
                    paddingInlineStart: 22,
                    ...font,
                  }}
                >
                  {DOTS}
                  {DOTS}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    lineHeight: 2.2,
                    textAlign: 'right',
                    paddingInlineStart: 22,
                    ...font,
                  }}
                >
                  {DOTS}
                  {DOTS}
                </div>
              </>
            ) : null}
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              textAlign: 'right',
              marginTop: 28,
              marginBottom: 16,
              ...font,
            }}
          >
            وعلى ذلك جرى التوقيع ،،،،
          </div>

          <div style={{ marginBottom: 28 }}>
            <DottedField
              label="الاسم :"
              value={fields?.signatureName || fields?.recipientName}
              blank={blank}
            />
            <DottedField label="التوقيع :" blank />
            <DottedField label="التاريخ :" value={fields?.receiptDate} blank={blank} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginTop: 40,
            }}
          >
            {(
              [
                ['توقيع مسئول الفرع', fields?.branchManagerSignatureName],
                ['توقيع ادارة شؤون الموظفين', fields?.hrAffairsSignatureName],
                ['توقيع المشرف العام', fields?.generalSupervisorSignatureName],
                ['توقيع المدير المالي', fields?.financialManagerSignatureName],
              ] as const
            ).map(([label, name]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 28, ...font }}>{label}</div>
                {blank || !name?.trim() ? (
                  <div
                    style={{
                      borderBottom: '1px dotted #333',
                      width: '85%',
                      margin: '0 auto',
                      minHeight: 1,
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 12, fontWeight: 600, ...font }}>
                    {sanitizePdfText(name.trim())}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
);
