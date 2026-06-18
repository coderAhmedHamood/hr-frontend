'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';

export type AttendanceRegisterPrintRow = {
  employeeName: string;
  date: string;
  statusLabel: string;
  worked: string;
  late: string;
};

export type AttendanceRegisterPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
  periodDateFrom: string;
  periodDateTo: string;
  employeesFilterAll: boolean;
  employeesSelectedCount: number;
  statusFilterLabelAr: string;
  rows: AttendanceRegisterPrintRow[];
};

const ROWS_PER_PAGE = 24;

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const PAGE_STYLE: React.CSSProperties = {
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 8,
  color: '#111',
  boxSizing: 'border-box',
};

export const AttendanceRegisterPrintHtml = React.forwardRef<
  HTMLDivElement,
  AttendanceRegisterPrintHtmlProps
>(function AttendanceRegisterPrintHtml(
  {
    companyNameAr,
    companyNameEn,
    titleAr,
    periodDateFrom,
    periodDateTo,
    employeesFilterAll,
    employeesSelectedCount,
    statusFilterLabelAr,
    rows,
  },
  ref,
) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  const pages = chunk(rows, ROWS_PER_PAGE);

  const filterLine2 = employeesFilterAll
    ? `الموظفون: جميع الموظفين ضمن البحث · الحالة: ${sanitizePdfText(statusFilterLabelAr)}`
    : `الموظفون: ${employeesSelectedCount} موظف محدد · الحالة: ${sanitizePdfText(statusFilterLabelAr)}`;

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

          <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', marginBottom: 6, textDecoration: 'underline' }}>
            {sanitizePdfText(titleAr)}
          </div>

          <div style={{ fontSize: 8, color: '#444', textAlign: 'right', marginBottom: 6, lineHeight: 1.35 }}>
            {sanitizePdfText(`الفترة: ${periodDateFrom} — ${periodDateTo}`)}
          </div>
          <div style={{ fontSize: 8, color: '#444', textAlign: 'right', marginBottom: 8, lineHeight: 1.35 }}>
            {sanitizePdfText(filterLine2)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#e8f2ef', border: '1px solid #94a3b8' }}>
            {[
              { label: 'الموظف', width: '22%', align: 'right' as const, pad: true },
              { label: 'التاريخ', width: '14%', align: 'center' as const },
              { label: 'الحالة', width: '36%', align: 'right' as const, pad: true },
              { label: 'دقائق العمل', width: '14%', align: 'center' as const },
              { label: 'التأخير', width: '14%', align: 'center' as const },
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
            <p style={{ marginTop: 14, textAlign: 'center', color: '#64748b' }}>لا توجد سجلات ضمن الفلترة.</p>
          ) : (
            pageRows.map((r, ri) => (
              <div
                key={`${r.date}-${r.employeeName}-${ri}`}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  border: '1px solid #e2e8f0',
                  borderTop: 'none',
                  backgroundColor: ri % 2 === 1 ? '#fafafa' : '#fff',
                }}
              >
                <div style={{ width: '22%', boxSizing: 'border-box', padding: '4px 4px', fontSize: 7, textAlign: 'right', wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.employeeName)}
                </div>
                <div style={{ width: '14%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  <span dir="ltr">{sanitizePdfText(r.date)}</span>
                </div>
                <div style={{ width: '36%', boxSizing: 'border-box', padding: '4px 4px', fontSize: 7, textAlign: 'right', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                  {sanitizePdfText(r.statusLabel)}
                </div>
                <div style={{ width: '14%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  <span dir="ltr">{sanitizePdfText(r.worked)}</span>
                </div>
                <div style={{ width: '14%', boxSizing: 'border-box', padding: '4px 2px', fontSize: 7, textAlign: 'center', borderInlineStart: '1px solid #e2e8f0' }}>
                  <span dir="ltr">{sanitizePdfText(r.late)}</span>
                </div>
              </div>
            ))
          )}

          <div style={{ marginTop: 16, fontSize: 7, color: '#64748b', textAlign: 'center' }}>
            صفحة {pi + 1} / {pages.length}
            {rows.length > 0 ? ` · إجمالي السجلات: ${rows.length}` : ''}
          </div>
        </div>
      ))}
    </div>
  );
});

