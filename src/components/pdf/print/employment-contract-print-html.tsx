'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { fmtPrintDate, PDF_PRINT_C } from '@/features/hr/payroll/reports/components/pdf-print-shared';

export type EmploymentContractPrintArticleLine = {
  code: string;
  titleAr: string;
  bodySnippet: string;
};

export type EmploymentContractPrintAllowanceRow = {
  labelAr: string;
  amount: string;
};

export type EmploymentContractPrintHtmlProps = {
  logoSrc?: string;
  company: { nameAr: string; nameEn?: string | null };
  employeeNameAr: string;
  contractNumber: string;
  natureLabelAr: string;
  arrangementLabelAr: string;
  startDate: string;
  endDate: string;
  probationDaysLabel: string;
  annualLeaveDaysLabel: string;
  baseSalary: string;
  currency: string;
  allowancesNote: string;
  deductionsNote: string;
  allowanceRows: EmploymentContractPrintAllowanceRow[];
  articles: EmploymentContractPrintArticleLine[];
};

const PAGE_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 9,
  color: '#111',
  boxSizing: 'border-box',
  minHeight: '297mm',
};

function RowKV({ label, value }: { label: string; value: string }) {
  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'row', borderBottom: `0.5px solid ${PDF_PRINT_C.border}`, padding: '6px 0' }}>
      <div style={{ width: '32%', fontSize: 9, fontWeight: 700, textAlign: 'right', paddingInlineEnd: 6, boxSizing: 'border-box' }}>
        {sanitizePdfText(label)}
        <span dir="ltr" style={{ unicodeBidi: 'embed' }}>
          :
        </span>
      </div>
      <div style={{ flex: 1, fontSize: 9, textAlign: 'right', lineHeight: 1.55, wordBreak: 'break-word' }} dir="auto">
        {sanitizePdfText(value || '—')}
      </div>
    </div>
  );
}

function LabeledField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 9, fontWeight: 700, textAlign: 'right', marginBottom: 4 }}>{sanitizePdfText(label)}</div>
      <div style={{ border: `0.75px solid ${PDF_PRINT_C.border}`, backgroundColor: '#fafafa', padding: 10, fontSize: 9, lineHeight: 1.7, textAlign: 'right', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {sanitizePdfText(value)}
      </div>
    </div>
  );
}

export const EmploymentContractPrintHtml = React.forwardRef<HTMLDivElement, EmploymentContractPrintHtmlProps>(
  function EmploymentContractPrintHtml(
    {
      logoSrc: logoSrcProp,
      company,
      employeeNameAr,
      contractNumber,
      natureLabelAr,
      arrangementLabelAr,
      startDate,
      endDate,
      probationDaysLabel,
      annualLeaveDaysLabel,
      baseSalary,
      currency,
      allowancesNote,
      deductionsNote,
      allowanceRows,
      articles,
    },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const title = `عقد عمل رقم ${sanitizePdfText(contractNumber)}`;

    return (
      <div ref={ref} dir="rtl" lang="ar" style={{ width: '210mm', maxWidth: '100%', margin: '0 auto' }}>
        <div style={PAGE_STYLE}>
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={company.nameAr}
            companyNameEn={company.nameEn ?? undefined}
          />

          <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>
            {title}
          </div>

          <div style={{ marginTop: 12 }}>
            <RowKV label="المستفيد من العقد" value={employeeNameAr} />
            <RowKV label="رقم العقد" value={contractNumber} />
            <RowKV label="نوع العقد" value={natureLabelAr} />
            <RowKV label="نمط الدوام" value={arrangementLabelAr} />
            <RowKV label="تاريخ البداية" value={fmtPrintDate(startDate)} />
            <RowKV label="تاريخ الانتهاء" value={fmtPrintDate(endDate)} />
            <RowKV label="أيام التجربة" value={probationDaysLabel} />
            <RowKV label="إجمالي أيام الإجازة السنوية (سنوياً)" value={annualLeaveDaysLabel} />
            <RowKV label="الراتب الأساسي المتفق عليه" value={`${baseSalary} ${currency}`.trim()} />
          </div>

          {allowanceRows.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', marginBottom: 6 }}>البدلات المتفق عليها</div>
              <div style={{ borderTop: `0.5px solid ${PDF_PRINT_C.border}` }}>
                {allowanceRows.map((row, idx) => (
                  <RowKV key={`${row.labelAr}-${idx}`} label={row.labelAr} value={`${row.amount} ${currency}`.trim()} />
                ))}
              </div>
            </div>
          ) : null}

          {allowancesNote.trim() || deductionsNote.trim() ? (
            <div style={{ marginTop: 14 }}>
              {allowancesNote.trim() ? <LabeledField label="ملاحظات البدلات" value={allowancesNote} /> : null}
              {deductionsNote.trim() ? <LabeledField label="ملاحظات الخصومات" value={deductionsNote} /> : null}
            </div>
          ) : null}

          {articles.length > 0 ? (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', marginBottom: 6 }}>مواد وبنود العقد</div>
              {articles.map((a, i) => (
                <div key={`${a.code}-${i}`} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, textAlign: 'right', wordBreak: 'break-word' }}>
                    {sanitizePdfText(`${i + 1}. ${a.code} — ${a.titleAr}`)}
                  </div>
                  <div style={{ fontSize: 8.5, textAlign: 'right', marginTop: 3, color: PDF_PRINT_C.muted, lineHeight: 1.6, wordBreak: 'break-word' }}>
                    {sanitizePdfText(a.bodySnippet)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div style={{ marginTop: 20, borderTop: `0.75px solid ${PDF_PRINT_C.border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 8, textAlign: 'center', color: PDF_PRINT_C.muted }}>
              هذا المستند صادر من نظام إدارة العقود — يُعتمَد بتوقيع الطرفين عند الإبرام وفق سياسات المنظمة.
            </div>
          </div>
        </div>
      </div>
    );
  },
);

