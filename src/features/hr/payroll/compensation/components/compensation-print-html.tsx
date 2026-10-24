'use client';

import * as React from 'react';
import { PDF_PRINT_FONT_FAMILY } from '@/components/pdf/lib/pdf-print-font';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { RoseCompanyStamp } from '@/components/pdf/rose-trading/rose-company-stamp';
import type { CompensationExportTable } from '@/features/hr/payroll/lib/compensation-period-export';

export type CompensationPrintHtmlProps = {
  logoSrc?: string;
  monthNameAr: string;
  branchNameAr: string;
  table: CompensationExportTable;
};

/**
 * The payroll sheet (مسير الرواتب), landscape A4.
 *
 * Every cell uses one font size, chosen so the widest amount fits its column
 * (no «7,000.00» running into the next cell). The rows are split into pages
 * that each fit one PDF page — letterhead, title, column headers and the logo
 * background on every page; the totals row and the stamp on the last one.
 */

const CELL_BORDER = '1px solid #222';

/** The table's width in CSS px: 277 mm printable width minus the page padding. */
const TABLE_PX = 277 * (96 / 25.4) - 2 * 16;
/** Body height a page has for rows (192 mm page minus letterhead, title, header, footer). */
const PAGE_ROWS_PX = 450;
/** Room the totals row and the stamp need on the last page. */
const LAST_PAGE_EXTRA_PX = 170;

const MAX_FONT = 15;
const MIN_FONT = 10;
const CELL_PAD_X = 4;
const CELL_PAD_Y = 6;
const LINE_HEIGHT = 1.35;

function weightOf(header: string, colIdx: number): number {
  if (colIdx === 0) return 0.55;
  if (colIdx === 1) return 2.1;
  if (colIdx === 2) return 2.6;
  if (header === 'الصافي' || header === 'الراتب الأساسي') return 1.4;
  if (header === 'التوقيع') return 1.1;
  return 1.2;
}

function formatCell(value: string | number, fractionDigits = 2): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  }
  return sanitizePdfText(value);
}

/** Width of a Latin number in em (Arial: digits ≈ 0.556em, «,» «.» ≈ 0.278em). */
function numberEm(text: string): number {
  let em = 0;
  for (const ch of text) em += /[0-9]/.test(ch) ? 0.556 : ch === '-' || ch === '+' ? 0.584 : 0.278;
  return em;
}

type AllowanceLine = { label: string; amount: string; isTotal: boolean };

function parseAllowances(text: string): AllowanceLine[] {
  if (text === '—') return [];
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [label, amount] = line.split('|');
      return { label: label ?? '', amount: amount ?? '', isTotal: label === '__TOTAL__' };
    });
}

function AllowancesCellContent({ text }: { text: string }) {
  const lines = parseAllowances(text);
  if (lines.length === 0) {
    return <span style={{ display: 'block', textAlign: 'center', color: '#666' }}>—</span>;
  }
  return (
    <div style={{ display: 'block' }}>
      {lines.map((l, i) => (
        // Block lines (not flex): html2canvas keeps Arabic word spaces, and the
        // amount wraps under its label instead of overlapping it.
        <div
          key={i}
          style={{
            display: 'block',
            textAlign: 'right',
            fontWeight: l.isTotal ? 700 : 400,
            borderTop: l.isTotal ? '1px solid #bbb' : undefined,
            marginTop: l.isTotal ? 3 : 0,
            paddingTop: l.isTotal ? 3 : 0,
          }}
        >
          {l.isTotal ? 'المجموع:' : sanitizePdfText(l.label)}{' '}
          <span dir="ltr" style={{ whiteSpace: 'nowrap', unicodeBidi: 'isolate' }}>
            {sanitizePdfText(l.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export const CompensationPrintHtml = React.forwardRef<HTMLDivElement, CompensationPrintHtmlProps>(
  function CompensationPrintHtml({ logoSrc: logoSrcProp, monthNameAr, branchNameAr, table }, ref) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const { headers, rows, totalRow } = table;
    const labelColSpan = 3;

    const layout = React.useMemo(() => {
      const weights = headers.map((h, i) => weightOf(h, i));
      const total = weights.reduce((a, b) => a + b, 0) || 1;
      const px = weights.map((w) => (w / total) * TABLE_PX);
      const widths = weights.map((w) => `${((w / total) * 100).toFixed(3)}%`);

      // One font for the whole table: the largest that lets every amount fit.
      let font = MAX_FONT;
      const fit = (text: string, colPx: number) => {
        const em = numberEm(text);
        if (em > 0) font = Math.min(font, (colPx - 2 * CELL_PAD_X - 2) / em);
      };
      const isAmountCol = (i: number) =>
        i >= labelColSpan && headers[i] !== 'التوقيع';
      for (const row of rows) {
        row.forEach((cell, i) => {
          if (isAmountCol(i)) fit(formatCell(cell), px[i]);
        });
        for (const l of parseAllowances(String(row[2] ?? ''))) fit(l.amount, px[2]);
      }
      totalRow.forEach((cell, i) => {
        if (i >= labelColSpan && isAmountCol(i)) fit(formatCell(cell), px[i]);
      });
      font = Math.max(MIN_FONT, Math.floor(font * 10) / 10);

      // Rows per page by their estimated height (allowance lines, wrapped names).
      const lineH = font * LINE_HEIGHT;
      const nameCharsPerLine = Math.max(8, Math.floor((px[1] - 2 * CELL_PAD_X) / (font * 0.55)));
      const rowHeight = (row: (string | number)[]) => {
        const nameLines = Math.ceil(String(row[1] ?? '').length / nameCharsPerLine) || 1;
        const allowances = parseAllowances(String(row[2] ?? ''));
        const allowanceLines = allowances.length === 0 ? 1 : allowances.length * 1.25 + 0.3;
        return Math.max(nameLines, allowanceLines, 1) * lineH + 2 * CELL_PAD_Y + 1;
      };
      const pages: number[][] = [[]];
      let used = 0;
      rows.forEach((row, ri) => {
        const h = rowHeight(row);
        if (pages[pages.length - 1].length > 0 && used + h > PAGE_ROWS_PX) {
          pages.push([]);
          used = 0;
        }
        pages[pages.length - 1].push(ri);
        used += h;
      });
      // The last page also holds the totals row and the stamp.
      const lastUsed = pages[pages.length - 1].reduce((s, ri) => s + rowHeight(rows[ri]), 0);
      if (lastUsed + LAST_PAGE_EXTRA_PX > PAGE_ROWS_PX && pages[pages.length - 1].length > 1) {
        const last = pages[pages.length - 1];
        let keep = lastUsed;
        const moved: number[] = [];
        while (last.length > 1 && keep + LAST_PAGE_EXTRA_PX > PAGE_ROWS_PX) {
          const ri = last.pop() as number;
          keep -= rowHeight(rows[ri]);
          moved.unshift(ri);
        }
        pages.push(moved);
      }
      return { widths, font, pages };
    }, [headers, rows, totalRow]);

    const { widths, font, pages } = layout;

    const th: React.CSSProperties = {
      border: CELL_BORDER,
      padding: `${CELL_PAD_Y}px ${CELL_PAD_X}px`,
      fontSize: font,
      fontWeight: 700,
      textAlign: 'center',
      verticalAlign: 'middle',
      backgroundColor: 'rgba(168, 213, 162, 0.85)',
      lineHeight: LINE_HEIGHT,
    };
    const td: React.CSSProperties = {
      border: CELL_BORDER,
      padding: `${CELL_PAD_Y}px ${CELL_PAD_X}px`,
      fontSize: font,
      verticalAlign: 'middle',
      lineHeight: LINE_HEIGHT,
      overflow: 'hidden',
    };
    const amount = (value: string | number, opts?: { bold?: boolean; bg?: string; digits?: number }) => (
      <td style={{ ...td, textAlign: 'center', fontWeight: opts?.bold ? 700 : 400, backgroundColor: opts?.bg }}>
        <span dir="ltr" style={{ whiteSpace: 'nowrap', unicodeBidi: 'isolate', fontVariantNumeric: 'tabular-nums' }}>
          {formatCell(value, opts?.digits ?? 2)}
        </span>
      </td>
    );

    return (
      <div ref={ref} dir="rtl" lang="ar" style={{ width: '277mm', maxWidth: '100%', margin: '0 auto' }}>
        {pages.map((pageRows, pi) => {
          const isLast = pi === pages.length - 1;
          return (
            <div
              key={pi}
              style={{
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
                padding: '20px 16px 12px',
                fontFamily: PDF_PRINT_FONT_FAMILY,
                color: '#111',
                // One sheet page = one PDF page (194 mm printable height).
                minHeight: '192mm',
                pageBreakAfter: isLast ? 'auto' : 'always',
                breakAfter: isLast ? 'auto' : 'page',
              }}
            >
              <RosePdfWatermark logoSrc={logoSrc} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <RoseTradingLetterheadPrint logoSrc={logoSrc} />

                <div
                  style={{
                    fontSize: font + 5,
                    fontWeight: 700,
                    textAlign: 'center',
                    marginTop: 10,
                    marginBottom: 12,
                    lineHeight: 1.5,
                  }}
                >
                  مسير رواتب العاملين ( شهر {sanitizePdfText(monthNameAr)} ) فرع {sanitizePdfText(branchNameAr)}
                </div>

                <table
                  dir="rtl"
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    tableLayout: 'fixed',
                    fontFamily: PDF_PRINT_FONT_FAMILY,
                  }}
                >
                  <colgroup>
                    {headers.map((h, i) => (
                      <col key={h} style={{ width: widths[i] }} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th key={h} style={th}>{sanitizePdfText(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((ri) => {
                      const row = rows[ri];
                      return (
                        <tr key={ri} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                          {row.map((cell, colIdx) => {
                            const header = headers[colIdx] ?? '';
                            if (colIdx === 0) {
                              return <React.Fragment key={colIdx}>{amount(cell, { digits: 0 })}</React.Fragment>;
                            }
                            if (colIdx === 1) {
                              return (
                                <td
                                  key={colIdx}
                                  style={{ ...td, textAlign: 'right', fontWeight: 600, overflowWrap: 'anywhere' }}
                                >
                                  {formatCell(cell)}
                                </td>
                              );
                            }
                            if (colIdx === 2) {
                              return (
                                <td key={colIdx} style={{ ...td, textAlign: 'right' }}>
                                  <AllowancesCellContent text={String(cell)} />
                                </td>
                              );
                            }
                            if (header === 'التوقيع') {
                              return <td key={colIdx} style={{ ...td, backgroundColor: 'rgba(0, 0, 0, 0.02)' }} />;
                            }
                            const isNet = header === 'الصافي';
                            return (
                              <React.Fragment key={colIdx}>
                                {amount(cell, {
                                  bold: isNet,
                                  bg: isNet ? 'rgba(232, 245, 230, 0.8)' : undefined,
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {isLast ? (
                      <tr style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <td
                          colSpan={labelColSpan}
                          style={{ ...td, textAlign: 'right', fontWeight: 700, backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                        >
                          {formatCell(totalRow[0] ?? 'المجموع الكلي')}
                        </td>
                        {totalRow.slice(labelColSpan).map((cell, i) => {
                          const header = headers[labelColSpan + i] ?? '';
                          if (header === 'التوقيع') {
                            return <td key={i} style={{ ...td, backgroundColor: 'rgba(0, 0, 0, 0.04)' }} />;
                          }
                          const isNet = header === 'الصافي';
                          return (
                            <React.Fragment key={i}>
                              {amount(cell, {
                                bold: true,
                                bg: isNet ? 'rgba(232, 245, 230, 0.9)' : 'rgba(0, 0, 0, 0.04)',
                              })}
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                {/* Establishment stamp — «ختم المنشأة», last page only. */}
                {isLast ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 16 }}>
                    <RoseCompanyStamp width={130} compact />
                  </div>
                ) : null}

                {pages.length > 1 ? (
                  <div style={{ marginTop: 10, fontSize: Math.max(font - 2, 10), color: '#64748b', textAlign: 'center' }}>
                    صفحة {pi + 1} / {pages.length}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
