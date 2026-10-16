'use client';

import * as React from 'react';
import { PDF_PRINT_FONT_FAMILY } from '@/components/pdf/lib/pdf-print-font';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { RoseCompanyStamp } from '@/components/pdf/rose-trading/rose-company-stamp';

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
  /** The employees' own status shown (e.g. «نشط»); omitted = every status. */
  employeeStatusLabelAr?: string;
  rows: AttendanceRegisterPrintRow[];
};

const ROWS_PER_PAGE = 24;

/** Table text: one size for every row so the columns line up. */
const CELL_FONT = 19;

/**
 * Column widths (sum 100%): the name gets the room (a 4-part Arabic name
 * on at most two lines), the date never wraps.
 */
const COLS = {
  name: '36%',
  date: '16%',
  status: '20%',
  worked: '14%',
  late: '14%',
} as const;

const cell = (width: string, align: 'right' | 'center', extra?: React.CSSProperties): React.CSSProperties => ({
  width,
  boxSizing: 'border-box',
  padding: align === 'right' ? '4px 6px' : '4px 2px',
  fontSize: CELL_FONT,
  lineHeight: 1.35,
  textAlign: align,
  display: 'flex',
  alignItems: 'center',
  justifyContent: align === 'right' ? 'flex-start' : 'center',
  ...extra,
});

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const PAGE_STYLE: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: PDF_PRINT_FONT_FAMILY,
  fontSize: 22,
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
    employeeStatusLabelAr,
    rows,
  },
  ref,
) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  const pages = chunk(rows, ROWS_PER_PAGE);

  const employeesPart = employeesFilterAll
    ? 'الموظفون: جميع الموظفين ضمن البحث'
    : `الموظفون: ${employeesSelectedCount} موظف محدد`;
  const filterLine2 = [
    employeesPart,
    employeeStatusLabelAr ? `حالة الموظف: ${sanitizePdfText(employeeStatusLabelAr)}` : null,
    `حالة الحضور: ${sanitizePdfText(statusFilterLabelAr)}`,
  ]
    .filter(Boolean)
    .join(' · ');

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
          <RosePdfWatermark logoSrc={logoSrc} />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={companyNameAr}
            companyNameEn={companyNameEn}
          />

          <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 6, textDecoration: 'underline' }}>
            {sanitizePdfText(titleAr)}
          </div>

          <div style={{ fontSize: 22, color: '#444', textAlign: 'right', marginBottom: 6, lineHeight: 1.35 }}>
            {sanitizePdfText(`الفترة: ${periodDateFrom} — ${periodDateTo}`)}
          </div>
          <div style={{ fontSize: 22, color: '#444', textAlign: 'right', marginBottom: 8, lineHeight: 1.35 }}>
            {sanitizePdfText(filterLine2)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#e8f2ef', border: '1px solid #94a3b8' }}>
            {[
              { label: 'الموظف', width: COLS.name, align: 'right' as const },
              { label: 'التاريخ', width: COLS.date, align: 'center' as const },
              { label: 'الحالة', width: COLS.status, align: 'right' as const },
              { label: 'دقائق العمل', width: COLS.worked, align: 'center' as const },
              { label: 'التأخير', width: COLS.late, align: 'center' as const },
            ].map((c, idx) => (
              <div
                key={c.label}
                style={cell(c.width, c.align, {
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  borderInlineStart: idx === 0 ? undefined : '1px solid #94a3b8',
                })}
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
                <div style={cell(COLS.name, 'right', { overflowWrap: 'anywhere' })}>
                  {sanitizePdfText(r.employeeName)}
                </div>
                <div style={cell(COLS.date, 'center', { whiteSpace: 'nowrap', borderInlineStart: '1px solid #e2e8f0' })}>
                  <span dir="ltr">{sanitizePdfText(r.date)}</span>
                </div>
                <div style={cell(COLS.status, 'right', { borderInlineStart: '1px solid #e2e8f0' })}>
                  {sanitizePdfText(r.statusLabel)}
                </div>
                <div style={cell(COLS.worked, 'center', { whiteSpace: 'nowrap', borderInlineStart: '1px solid #e2e8f0' })}>
                  <span dir="ltr">{sanitizePdfText(r.worked)}</span>
                </div>
                <div style={cell(COLS.late, 'center', { whiteSpace: 'nowrap', borderInlineStart: '1px solid #e2e8f0' })}>
                  <span dir="ltr">{sanitizePdfText(r.late)}</span>
                </div>
              </div>
            ))
          )}

          {/* Establishment stamp — final page only, so a multi-page register is stamped once. */}
          {pi === pages.length - 1 ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 20 }}>
              <RoseCompanyStamp width={130} compact />
            </div>
          ) : null}

          <div style={{ marginTop: 16, fontSize: 22, color: '#64748b', textAlign: 'center' }}>
            صفحة {pi + 1} / {pages.length}
            {rows.length > 0 ? ` · إجمالي السجلات: ${rows.length}` : ''}
          </div>
          </div>
        </div>
      ))}
    </div>
  );
});

