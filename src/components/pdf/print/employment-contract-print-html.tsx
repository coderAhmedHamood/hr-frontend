'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import {
  buildEmploymentContractPrintModel,
  type EmploymentContractPrintModelInput,
} from '@/components/pdf/print/build-employment-contract-print-model';

export type EmploymentContractPrintArticleLine = {
  code: string;
  titleAr: string;
  bodyAr?: string;
  bodySnippet?: string;
};

export type EmploymentContractPrintAllowanceRow = {
  labelAr: string;
  amount: string;
};

export type EmploymentContractPrintHtmlProps = {
  logoSrc?: string;
  company: { nameAr: string; nameEn?: string | null };
  /** Optional — from company/settings, not a hardcoded person. */
  employerRepresentativeName?: string | null;
  employerRepresentativeTitle?: string | null;
  employeeNameAr: string;
  employeeGender?: 'male' | 'female' | null;
  nationalId?: string | null;
  nationality?: string | null;
  jobTitleAr?: string | null;
  workCityAr?: string | null;
  branchNameAr?: string | null;
  contractNumber: string;
  natureLabelAr: string;
  arrangementLabelAr: string;
  agreementDate?: string;
  startDate: string;
  endDate: string;
  probationDaysLabel: string;
  annualLeaveDaysLabel: string;
  baseSalary: string;
  currency: string;
  allowancesNote: string;
  deductionsNote: string;
  allowanceRows: EmploymentContractPrintAllowanceRow[];
  /** Legal wording from selected catalog articles (dynamic). */
  articles: EmploymentContractPrintArticleLine[];
};

const ARTICLE_BAR_BG = '#e8e8e8';
const ARTICLE_BAR_FG = '#111111';

const PAGE_STYLE: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  padding: '20px 22px 40px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 12,
  color: '#111111',
  boxSizing: 'border-box',
  minHeight: '297mm',
};

function ArticleBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ marginBottom: 8, pageBreakInside: 'avoid' }}>
      <div
        style={{
          backgroundColor: ARTICLE_BAR_BG,
          color: ARTICLE_BAR_FG,
          padding: '5px 12px',
          fontSize: 12.5,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.5,
        }}
      >
        {sanitizePdfText(title)}
      </div>
      {body.trim() ? (
        <div
          style={{
            padding: '8px 4px 6px',
            fontSize: 12,
            lineHeight: 1.85,
            textAlign: 'justify',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {sanitizePdfText(body)}
        </div>
      ) : null}
    </div>
  );
}

function CompensationBlock({
  baseSalary,
  currency,
  allowanceRows,
  allowancesNote,
  deductionsNote,
}: {
  baseSalary: string;
  currency: string;
  allowanceRows: EmploymentContractPrintAllowanceRow[];
  allowancesNote: string;
  deductionsNote: string;
}) {
  const cur = sanitizePdfText(currency || 'SAR');
  const rows = allowanceRows.filter((r) => r.labelAr.trim());
  const allowancesParagraph = rows.length > 0
    ? rows
      .map((row) => `${sanitizePdfText(row.labelAr)} ${sanitizePdfText(row.amount || '0')} ${cur}`)
      .join('، ')
    : '—';

  return (
    <div style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
      <div
        style={{
          backgroundColor: ARTICLE_BAR_BG,
          color: ARTICLE_BAR_FG,
          padding: '5px 12px',
          fontSize: 12.5,
          fontWeight: 700,
          textAlign: 'center',
          lineHeight: 1.5,
          marginBottom: 8,
        }}
      >
        التعويضات
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.9, textAlign: 'justify' }}>
        <p style={{ margin: '0 0 6px' }}>
          <span style={{ fontWeight: 700 }}>الراتب الأساسي:</span>{' '}
          {sanitizePdfText(baseSalary || '—')} {cur}
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <span style={{ fontWeight: 700 }}>البدلات:</span>{' '}
          {allowancesParagraph}
        </p>
        {allowancesNote.trim() ? (
          <p style={{ margin: '0 0 6px' }}>
            <span style={{ fontWeight: 700 }}>ملاحظات البدلات:</span>{' '}
            {sanitizePdfText(allowancesNote.trim())}
          </p>
        ) : null}
        {deductionsNote.trim() ? (
          <p style={{ margin: 0 }}>
            <span style={{ fontWeight: 700 }}>ملاحظات الخصومات:</span>{' '}
            {sanitizePdfText(deductionsNote.trim())}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SignatureFooter({ employeeRoleNounAr }: { employeeRoleNounAr: string }) {
  return (
    <div
      style={{
        marginTop: 36,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 40,
        pageBreakInside: 'avoid',
      }}
    >
      <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
        الطرف الأول /صاحب العمل
      </div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
        الطرف الثاني / {sanitizePdfText(employeeRoleNounAr)}
      </div>
    </div>
  );
}

function PartiesBlock({
  lead,
  party1,
  party2,
}: {
  lead: string;
  party1: string;
  party2: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, lineHeight: 1.85, textAlign: 'right', marginBottom: 6 }}>
        {sanitizePdfText(lead)}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.9, textAlign: 'justify', marginBottom: 4 }}>
        {sanitizePdfText(party1)}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.9, textAlign: 'justify' }}>
        {sanitizePdfText(party2)}
      </div>
    </div>
  );
}

function parseDaysFromLabel(label: string): string | null {
  const m = label.match(/(\d+)/);
  return m ? m[1] : null;
}

export const EmploymentContractPrintHtml = React.forwardRef<HTMLDivElement, EmploymentContractPrintHtmlProps>(
  function EmploymentContractPrintHtml(props, ref) {
    const {
      logoSrc: logoSrcProp,
      company,
      employerRepresentativeName,
      employerRepresentativeTitle,
      employeeNameAr,
      employeeGender,
      nationalId,
      nationality,
      jobTitleAr,
      workCityAr,
      branchNameAr,
      contractNumber,
      natureLabelAr,
      arrangementLabelAr,
      agreementDate,
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
    } = props;

    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const modelInput = React.useMemo((): EmploymentContractPrintModelInput => ({
      companyNameAr: company.nameAr,
      companyNameEn: company.nameEn,
      employerRepresentativeName: employerRepresentativeName?.trim() || null,
      employerRepresentativeTitle: employerRepresentativeTitle?.trim() || null,
      employeeNameAr,
      employeeGender,
      nationalId,
      nationality,
      jobTitleAr,
      workCityAr,
      branchNameAr,
      contractNumber,
      natureLabelAr,
      arrangementLabelAr,
      agreementDateIso: agreementDate?.trim() || startDate,
      startDate,
      endDate,
      probationDays: parseDaysFromLabel(probationDaysLabel),
      annualLeaveDays: parseDaysFromLabel(annualLeaveDaysLabel),
      baseSalary,
      currency,
      allowancesNote,
      deductionsNote,
      allowanceRows,
      articles: articles.map((a) => ({
        code: a.code,
        titleAr: a.titleAr,
        bodyAr: (a.bodyAr ?? a.bodySnippet ?? '').trim(),
      })),
    }), [
      company.nameAr,
      company.nameEn,
      employerRepresentativeName,
      employerRepresentativeTitle,
      employeeNameAr,
      employeeGender,
      nationalId,
      nationality,
      jobTitleAr,
      workCityAr,
      branchNameAr,
      contractNumber,
      natureLabelAr,
      arrangementLabelAr,
      agreementDate,
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
    ]);

    const model = React.useMemo(
      () => buildEmploymentContractPrintModel(modelInput),
      [modelInput],
    );

    const title = `عقــد عمل رقم(${sanitizePdfText(model.contractNumber)})`;
    const hasAnnex = Boolean(model.annexPreambleAr.trim() || model.annexArticles.length > 0);

    return (
      <div ref={ref} dir="rtl" lang="ar" style={{ width: '210mm', maxWidth: '100%', margin: '0 auto' }}>
        <div style={PAGE_STYLE}>
          <RosePdfWatermark logoSrc={logoSrc} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <RoseTradingLetterheadPrint
              logoSrc={logoSrc}
              companyNameAr={company.nameAr}
              companyNameEn={company.nameEn ?? undefined}
            />

            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                textAlign: 'center',
                marginTop: 4,
                marginBottom: 14,
                textDecoration: 'underline',
              }}
            >
              {title}
            </div>

            <PartiesBlock
              lead={model.agreementLeadAr}
              party1={model.party1LineAr}
              party2={model.party2LineAr}
            />

            <CompensationBlock
              baseSalary={baseSalary}
              currency={currency}
              allowanceRows={allowanceRows}
              allowancesNote={allowancesNote}
              deductionsNote={deductionsNote}
            />

            {model.mainArticles.map((a, i) => (
              <ArticleBlock
                key={`${a.code}-${i}`}
                title={a.titleAr.trim() || `المادة (${i + 1})`}
                body={a.bodyAr}
              />
            ))}

            <SignatureFooter employeeRoleNounAr={model.employeeRoleNounAr} />
          </div>
        </div>

        {hasAnnex ? (
          <div style={{ ...PAGE_STYLE, marginTop: 12 }}>
            <RosePdfWatermark logoSrc={logoSrc} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <RoseTradingLetterheadPrint
                logoSrc={logoSrc}
                companyNameAr={company.nameAr}
                companyNameEn={company.nameEn ?? undefined}
              />

              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700, 
                  textAlign: 'center',
                  marginTop: 4,
                  marginBottom: 14,
                  textDecoration: 'underline',
                }}
              >
                {`ملحق لعقد العمل رقم (${sanitizePdfText(model.contractNumber)})`}
              </div>

              <PartiesBlock
                lead={model.annexLeadAr}
                party1={model.annexParty1LineAr}
                party2={model.annexParty2LineAr}
              />

              {model.annexPreambleAr.trim() ? (
                <ArticleBlock title="تمهيد" body={model.annexPreambleAr} />
              ) : null}

              {model.annexArticles.map((a, i) => (
                <ArticleBlock
                  key={`annex-${a.code}-${i}`}
                  title={a.titleAr.trim() || `البند (${i + 1})`}
                  body={a.bodyAr}
                />
              ))}

              <div
                style={{
                  marginTop: 36,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 40,
                  pageBreakInside: 'avoid',
                }}
              >
                <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                  الطرف الأول (صاحب العمل)
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700 }}>
                  الطرف الثاني ({sanitizePdfText(model.employeeRoleNounAr)})
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);
