'use client';

import * as React from 'react';
import { PDF_PRINT_FONT_FAMILY } from '@/components/pdf/lib/pdf-print-font';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { RoseCompanyStamp } from '@/components/pdf/rose-trading/rose-company-stamp';

/**
 * One look for every printed register (employees, attendance, violations,
 * notifications, audit log, discipline lists…): the company letterhead, the
 * title and filter lines, one table, the stamp on the last page and the page
 * count. Every cell — headers included — uses the same font size; what a
 * column holds decides its width and wrapping:
 *
 * - `name`   an employee / person: the widest column, wraps on two lines.
 * - `text`   free text (title, type, reason): wraps normally.
 * - `status` a short label: centred, wraps if it must.
 * - `code`, `date`, `number`: never wrap (EMP-1783707313731 stays on one line).
 */
export type RegisterColumnKind = 'name' | 'text' | 'status' | 'code' | 'date' | 'number';

export type RegisterColumn = {
  label: string;
  kind: RegisterColumnKind;
  /** Relative width; defaults by kind. */
  weight?: number;
};

export type RegisterDocumentProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  titleAr: string;
  /** Lines under the title (period, filters…); text, or an element (e.g. dates kept left-to-right). */
  subtitleLines?: React.ReactNode[];
  columns: RegisterColumn[];
  rows: string[][];
  landscape?: boolean;
  rowsPerPage?: number;
  emptyText?: string;
};

/** The one font size of a register's table (headers and cells). */
export const REGISTER_FONT = 17;

const DEFAULT_WEIGHT: Record<RegisterColumnKind, number> = {
  name: 3,
  text: 2.4,
  status: 1.5,
  code: 1.9,
  date: 1.4,
  number: 1.1,
};

const NO_WRAP: ReadonlySet<RegisterColumnKind> = new Set(['code', 'date', 'number']);

function chunk<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const PX_PER_MM = 96 / 25.4;
const PAGE_PAD_X = 20;
const CELL_PAD = 6;
const LINE_PX = REGISTER_FONT * 1.4;

/** Estimated height of a row: the most lines any of its wrapping cells takes. */
function rowHeightPx(row: string[], columns: RegisterColumn[], tablePx: number): number {
  const weights = columns.map((c) => c.weight ?? DEFAULT_WEIGHT[c.kind]);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let lines = 1;
  columns.forEach((c, i) => {
    if (NO_WRAP.has(c.kind)) return;
    const text = (row[i] ?? '').replace(/\s+/g, ' ').trim();
    const colPx = (weights[i] / total) * tablePx - 2 * CELL_PAD;
    // Arabic in bold Arial averages about 0.45em a character.
    const perLine = Math.max(4, Math.floor(colPx / (REGISTER_FONT * 0.45)));
    lines = Math.max(lines, Math.ceil(text.length / perLine) || 1);
  });
  return lines * LINE_PX + 2 * CELL_PAD + 1;
}

/**
 * Splits rows into pages that each fit one PDF page (printable 281 × 190 mm
 * portrait, 194 × 277 mm landscape) under the letterhead, title, subtitle
 * lines and column header; the last page also keeps room for the stamp.
 */
function paginateByHeight(
  rows: string[][],
  columns: RegisterColumn[],
  landscape: boolean,
  subtitleCount: number,
): string[][][] {
  if (rows.length === 0) return [[]];
  const pageMm = landscape ? 192 : 279;
  const widthMm = landscape ? 277 : 190;
  const tablePx = widthMm * PX_PER_MM - 2 * PAGE_PAD_X;
  // Above the rows: padding, letterhead, title and header row ≈ 235, each
  // subtitle line ≈ 30; below: page number and padding ≈ 55; 20 to spare.
  const budget = pageMm * PX_PER_MM - (235 + subtitleCount * 30 + 55 + 20);
  const stampPx = 150;

  const heights = rows.map((r) => rowHeightPx(r, columns, tablePx));
  const pages: string[][][] = [[]];
  const used: number[] = [0];
  rows.forEach((row, i) => {
    const p = pages.length - 1;
    if (pages[p].length > 0 && used[p] + heights[i] > budget) {
      pages.push([]);
      used.push(0);
    }
    pages[pages.length - 1].push(row);
    used[used.length - 1] += heights[i];
  });
  // No room left for the stamp: move the last page's tail to a page of its own.
  const last = pages.length - 1;
  if (used[last] + stampPx > budget && pages[last].length > 1) {
    const tail: string[][] = [];
    let h = used[last];
    let idx = rows.length - 1;
    while (pages[last].length > 1 && h + stampPx > budget) {
      tail.unshift(pages[last].pop() as string[]);
      h -= heights[idx];
      idx -= 1;
    }
    pages.push(tail);
  }
  return pages;
}

/** Column widths in % from their weights (sum 100). */
export function registerColumnWidths(columns: RegisterColumn[]): string[] {
  const weights = columns.map((c) => c.weight ?? DEFAULT_WEIGHT[c.kind]);
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  return weights.map((w) => `${((w / total) * 100).toFixed(3)}%`);
}

function cellStyle(
  column: RegisterColumn,
  width: string,
  index: number,
  header: boolean,
): React.CSSProperties {
  const startAligned = column.kind === 'name' || column.kind === 'text';
  const noWrap = NO_WRAP.has(column.kind);
  return {
    width,
    // Flex items default to `min-width: auto`, which keeps them at least as
    // wide as their (unbreakable, nowrap) content no matter what `width` is
    // set to — a long date/time then refuses to shrink and visually bleeds
    // into the next cell instead of being clipped. `minWidth: 0` lets the
    // explicit `width` win, so `overflow: hidden` below actually applies.
    minWidth: 0,
    flexShrink: 0,
    boxSizing: 'border-box',
    padding: '6px 6px',
    fontSize: REGISTER_FONT,
    lineHeight: 1.4,
    fontWeight: header ? 700 : column.kind === 'name' ? 600 : 400,
    // A plain block: html2canvas drops the spaces of Arabic text laid out
    // inside flex cells («عادل هلال» → «عادلهلال»).
    display: 'block',
    textAlign: startAligned ? 'right' : 'center',
    whiteSpace: noWrap || header ? 'nowrap' : 'normal',
    overflowWrap: noWrap ? 'normal' : 'anywhere',
    overflow: 'hidden',
    // A clipped nowrap value (too long for its column) shows «…» instead of
    // silently cutting the text off mid-character with no sign of data loss.
    textOverflow: noWrap || header ? 'ellipsis' : undefined,
    borderInlineStart:
      index === 0 ? undefined : `1px solid ${header ? '#94a3b8' : '#e2e8f0'}`,
  };
}

/** The table alone, for documents that add their own sections (KPIs…). */
export function RegisterTable({
  columns,
  rows,
  emptyText = 'لا توجد بيانات ضمن الفلترة.',
}: {
  columns: RegisterColumn[];
  rows: string[][];
  emptyText?: string;
}) {
  const widths = registerColumnWidths(columns);
  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          // See-through, so the logo background shows under the table.
          backgroundColor: 'rgba(232, 242, 239, 0.75)',
          border: '1px solid #94a3b8',
        }}
      >
        {columns.map((c, i) => (
          <div key={`h-${i}`} style={cellStyle(c, widths[i], i, true)}>
            {sanitizePdfText(c.label)}
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p style={{ marginTop: 14, textAlign: 'center', color: '#64748b', fontSize: REGISTER_FONT }}>
          {emptyText}
        </p>
      ) : (
        rows.map((row, ri) => (
          <div
            key={`r-${ri}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              border: '1px solid #e2e8f0',
              borderTop: 'none',
              backgroundColor: ri % 2 === 1 ? 'rgba(15, 23, 42, 0.03)' : 'transparent',
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
            }}
          >
            {columns.map((c, ci) => {
              const value = sanitizePdfText((row[ci] ?? '').replace(/\s+/g, ' ').trim() || '—');
              return (
                <div key={`c-${ci}`} style={cellStyle(c, widths[ci], ci, false)}>
                  {NO_WRAP.has(c.kind) ? <span dir="ltr">{value}</span> : value}
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

export const RegisterDocument = React.forwardRef<HTMLDivElement, RegisterDocumentProps>(
  function RegisterDocument(
    {
      companyNameAr,
      companyNameEn,
      titleAr,
      subtitleLines = [],
      columns,
      rows,
      landscape = false,
      rowsPerPage,
      emptyText,
    },
    ref,
  ) {
    // Rows go to pages by their estimated height (a two-line name or text
    // takes two lines): the export moves a table that does not fit to the
    // next page whole, leaving a near-empty page behind.
    const pages = rowsPerPage
      ? chunk(rows, rowsPerPage)
      : paginateByHeight(rows, columns, landscape, subtitleLines.length);
    const pageWidth = landscape ? '297mm' : '210mm';
    // One register page = one PDF page: the export lays the document out at
    // the printable width (A4 minus its 10 mm side margins), so a page is the
    // printable height (281 / 194 mm, a hair less to stay inside). Every page
    // then holds its own centred logo background.
    const pageHeight = landscape ? '192mm' : '279mm';

    return (
      <div ref={ref} dir="rtl" lang="ar" style={{ width: pageWidth, maxWidth: '100%', margin: '0 auto' }}>
        {pages.map((pageRows, pi) => (
          <div
            key={pi}
            style={{
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#ffffff',
              fontFamily: PDF_PRINT_FONT_FAMILY,
              fontSize: REGISTER_FONT,
              color: '#111',
              boxSizing: 'border-box',
              minHeight: pageHeight,
              pageBreakAfter: pi < pages.length - 1 ? 'always' : 'auto',
              breakAfter: pi < pages.length - 1 ? 'page' : 'auto',
            }}
          >
            <RosePdfWatermark />
            <div style={{ position: 'relative', zIndex: 1, padding: '22px 20px 12px' }}>
              <RoseTradingLetterheadPrint companyNameAr={companyNameAr} companyNameEn={companyNameEn} />
              <div
                style={{
                  fontSize: REGISTER_FONT + 5,
                  fontWeight: 700,
                  textAlign: 'center',
                  marginBottom: 8,
                  textDecoration: 'underline',
                }}
              >
                {sanitizePdfText(titleAr)}
              </div>
              {subtitleLines.map((line, li) => (
                <div
                  key={li}
                  style={{
                    fontSize: REGISTER_FONT,
                    color: '#444',
                    textAlign: 'right',
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {typeof line === 'string' ? sanitizePdfText(line) : line}
                </div>
              ))}
              <div style={{ height: 4 }} />
              <RegisterTable
                columns={columns}
                rows={pi === 0 || pageRows.length > 0 ? pageRows : []}
                emptyText={emptyText}
              />

              {/* The establishment stamp: last page only, once per register. */}
              {pi === pages.length - 1 ? (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 20 }}>
                  <RoseCompanyStamp width={130} compact />
                </div>
              ) : null}

              <div style={{ marginTop: 16, fontSize: REGISTER_FONT - 2, color: '#64748b', textAlign: 'center' }}>
                صفحة {pi + 1} / {pages.length}
                {rows.length > 0 ? ` · إجمالي السجلات: ${rows.length}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  },
);
