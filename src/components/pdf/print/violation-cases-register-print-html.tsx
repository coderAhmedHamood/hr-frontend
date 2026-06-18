'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';

export type ViolationCasePrintRow = {
  caseNumber: string;
  employeeNameAr: string;
  typeNameAr: string;
  date: string;
  statusAr: string;
  description: string;
};

export type ViolationCasesRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  filterSummary: string;
  rows: ViolationCasePrintRow[];
};

const ROWS_PER_PAGE = 20;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function clip(s: string, max: number): string {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function isRow(r: unknown): r is ViolationCasePrintRow {
  if (r == null || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.caseNumber === 'string' &&
    typeof o.employeeNameAr === 'string' &&
    typeof o.typeNameAr === 'string' &&
    typeof o.date === 'string' &&
    typeof o.statusAr === 'string' &&
    typeof o.description === 'string'
  );
}

const PAGE_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 8,
  color: '#111',
  boxSizing: 'border-box',
};

export const ViolationCasesRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  ViolationCasesRegisterPrintHtmlProps
>(function ViolationCasesRegisterPrintHtml({ companyNameAr, companyNameEn, titleAr, filterSummary, rows }, ref) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  const cleanRows = React.useMemo(() => rows.filter(isRow), [rows]);
  const pages = chunk(cleanRows, ROWS_PER_PAGE);

  return (
    <div ref={ref} dir="rtl" lang="ar" style={{ width: '210mm', maxWidth: '100%', margin: '0 auto' }}>
      {pages.map((pageRows, pi) => (
        <div
          key={pi}
          style={{
            ...PAGE_STYLE,
            minHeight: pi < pages.length - 1 ? '297mm' : undefined,
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
              { label: 'الرقم', width: '14%', align: 'center' as const },
              { label: 'الموظف', width: '22%', align: 'right' as const, pad: true },
              { label: 'نوع المخالفة', width: '20%', align: 'right' as const, pad: true },
              { label: 'التاريخ', width: '12%', align: 'center' as const },
              { label: 'الحالة', width: '18%', align: 'center' as const },
            ].map((c, idx) => (
              <div
                key={c.label}
                style={{
                  width: c.width,
                  boxSizing: 'border-box',
                  fontWeight: 700,
                  textAlign: c.align,
                  fontSize: 8,
                  padding: c.pad ? '4px 4px' : '4px 2px',
                  borderInlineStart: idx === 0 ? undefined : '1px solid #94a3b8',
                  wordBreak: 'break-word',
                }}
              >
                {sanitizePdfText(c.label)}
              </div>
            ))}
          </div>

          {pageRows.length === 0 && pi === 0 ? (
            <p style={{ marginTop: 14, textAlign: 'center', color: '#64748b' }}>لا توجد مخالفات ضمن الفلترة.</p>
          ) : (
            pageRows.map((r, ri) => (
              <div
                key={`${r.caseNumber}-${ri}`}
                style={{
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  backgroundColor: ri % 2 === 1 ? '#fafafa' : '#fff',
                }}
              >
                <div dir="rtl" style={{ display: 'flex', flexDirection: 'row' }}>
                  <div style={{ width: '14%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center' }}>
                    <span dir="ltr">{sanitizePdfText(r.caseNumber)}</span>
                  </div>
                  <div style={{ width: '22%', boxSizing: 'border-box', padding: '4px 4px', fontSize: 7, textAlign: 'right', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    {sanitizePdfText(r.employeeNameAr)}
                  </div>
                  <div style={{ width: '20%', boxSizing: 'border-box', padding: '4px 4px', fontSize: 7, textAlign: 'right', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    {sanitizePdfText(r.typeNameAr)}
                  </div>
                  <div style={{ width: '12%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                    <span dir="ltr">{sanitizePdfText(r.date)}</span>
                  </div>
                  <div style={{ width: '18%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    {sanitizePdfText(r.statusAr)}
                  </div>
                </div>
                {r.description ? (
                  <div style={{ padding: '2px 4px 6px', fontSize: 7, color: '#475569', textAlign: 'right', lineHeight: 1.35 }}>
                    {sanitizePdfText(clip(r.description, 160))}
                  </div>
                ) : null}
              </div>
            ))
          )}

          <div style={{ marginTop: 16, fontSize: 7, color: '#64748b', textAlign: 'center' }}>
            صفحة {pi + 1} / {pages.length}
            {cleanRows.length > 0 ? ` · إجمالي السجلات: ${cleanRows.length}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
});

