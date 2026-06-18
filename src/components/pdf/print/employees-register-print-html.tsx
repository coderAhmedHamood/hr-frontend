'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';

export type EmployeeRegisterPrintRow = {
  name: string;
  employeeCode: string;
  position: string;
  department: string;
  branchCity: string;
  contractType: string;
  startDate: string;
  baseSalary: string;
  statusAr: string;
};

export type EmployeesRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: EmployeeRegisterPrintRow[];
};

const ROWS_PER_PAGE = 18;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const PAGE_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '20px 18px 40px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 7,
  color: '#111',
  boxSizing: 'border-box',
};

export const EmployeesRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  EmployeesRegisterPrintHtmlProps
>(function EmployeesRegisterPrintHtml({ companyNameAr, companyNameEn, titleAr, filterSummary, rows }, ref) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  const pages = chunk(rows, ROWS_PER_PAGE);

  return (
    <div ref={ref} dir="rtl" lang="ar" style={{ width: '297mm', maxWidth: '100%', margin: '0 auto' }}>
      {pages.map((pageRows, pi) => (
        <div
          key={pi}
          style={{
            ...PAGE_STYLE,
            minHeight: pi < pages.length - 1 ? '210mm' : undefined,
            marginBottom: pi < pages.length - 1 ? 16 : 0,
            borderBottom: pi < pages.length - 1 ? '1px dashed #ddd' : undefined,
          }}
        >
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={companyNameAr}
            companyNameEn={companyNameEn}
          />

          <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 8, textDecoration: 'underline' }}>
            {sanitizePdfText(titleAr)}
          </div>
          <div style={{ fontSize: 8, color: '#444', textAlign: 'right', marginBottom: 8, lineHeight: 1.35 }}>
            {sanitizePdfText(filterSummary)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#e8f2ef', border: '1px solid #94a3b8' }}>
            {[
              { label: 'الموظف', width: '16%', align: 'right' as const, pad: true },
              { label: 'الرقم', width: '9%', align: 'center' as const },
              { label: 'المسمى', width: '14%', align: 'right' as const, pad: true },
              { label: 'القسم', width: '12%', align: 'right' as const, pad: true },
              { label: 'الفرع', width: '10%', align: 'right' as const, pad: true },
              { label: 'العقد', width: '10%', align: 'center' as const },
              { label: 'الالتحاق', width: '9%', align: 'center' as const },
              { label: 'الراتب', width: '10%', align: 'center' as const },
              { label: 'الحالة', width: '10%', align: 'center' as const },
            ].map((c, idx) => (
              <div
                key={c.label}
                style={{
                  width: c.width,
                  boxSizing: 'border-box',
                  fontWeight: 700,
                  textAlign: c.align,
                  fontSize: 7.5,
                  padding: c.pad ? '4px 2px' : '4px 2px',
                  borderInlineStart: idx === 0 ? undefined : '1px solid #94a3b8',
                  wordBreak: 'break-word',
                }}
              >
                {sanitizePdfText(c.label)}
              </div>
            ))}
          </div>

          {pageRows.length === 0 && pi === 0 ? (
            <p style={{ marginTop: 14, textAlign: 'center', color: '#64748b' }}>لا يوجد موظفون ضمن الفلترة.</p>
          ) : (
            pageRows.map((r, ri) => (
              <div
                key={`${r.employeeCode}-${ri}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  backgroundColor: ri % 2 === 1 ? '#fafafa' : '#fff',
                }}
              >
                <div style={{ width: '16%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'right', borderInlineStart: undefined, wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.name)}
                </div>
                <div style={{ width: '9%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  <span dir="ltr">{sanitizePdfText(r.employeeCode)}</span>
                </div>
                <div style={{ width: '14%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 6.5, textAlign: 'right', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.position)}
                </div>
                <div style={{ width: '12%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 6.5, textAlign: 'right', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.department)}
                </div>
                <div style={{ width: '10%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 6.5, textAlign: 'right', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.branchCity)}
                </div>
                <div style={{ width: '10%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 6.5, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.contractType)}
                </div>
                <div style={{ width: '9%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 6.5, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  <span dir="ltr">{sanitizePdfText(r.startDate)}</span>
                </div>
                <div style={{ width: '10%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  <span dir="ltr">{sanitizePdfText(r.baseSalary)}</span>
                </div>
                <div style={{ width: '10%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 6.5, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.statusAr)}
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: 16, fontSize: 7, color: '#64748b', textAlign: 'center' }}>
            صفحة {pi + 1} / {pages.length}
            {rows.length > 0 ? ` · إجمالي الموظفين: ${rows.length}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
});

