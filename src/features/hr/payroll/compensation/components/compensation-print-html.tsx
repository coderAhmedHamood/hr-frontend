'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import type { CompensationExportTable } from '@/features/hr/payroll/lib/compensation-period-export';

export type CompensationPrintHtmlProps = {
  logoSrc?: string;
  monthNameAr: string;
  branchNameAr: string;
  table: CompensationExportTable;
};

const CELL_BORDER = '1px solid #222';

const TH_STYLE: React.CSSProperties = {
  border: CELL_BORDER,
  padding: '10px 8px',
  fontSize: 9.5,
  fontWeight: 700,
  textAlign: 'center',
  verticalAlign: 'middle',
  backgroundColor: '#a8d5a2',
  lineHeight: 1.35,
};

const TD_BASE: React.CSSProperties = {
  border: CELL_BORDER,
  padding: '10px 8px',
  fontSize: 9.5,
  verticalAlign: 'middle',
  lineHeight: 1.4,
};

const LTR_NUM: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'center',
  direction: 'ltr',
  unicodeBidi: 'isolate',
  fontVariantNumeric: 'tabular-nums',
};

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

function NumericCell({
  value,
  fractionDigits = 2,
  bold,
  bg,
}: {
  value: string | number;
  fractionDigits?: number;
  bold?: boolean;
  bg?: string;
}) {
  return (
    <td
      style={{
        ...TD_BASE,
        textAlign: 'center',
        fontWeight: bold ? 700 : 400,
        backgroundColor: bg,
      }}
    >
      <span style={LTR_NUM}>{formatCell(value, fractionDigits)}</span>
    </td>
  );
}

function AllowancesCellContent({ text }: { text: string }) {
  if (text === '—') {
    return <span style={{ display: 'block', textAlign: 'center', color: '#666' }}>—</span>;
  }

  const lines = text.split('\n').filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 4px' }}>
      {lines.map((line, i) => {
        const [label, amount] = line.split('|');
        const isTotal = label === '__TOTAL__';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: isTotal ? '4px 2px 0' : '2px 2px',
              borderTop: isTotal ? '1px solid #bbb' : undefined,
              marginTop: isTotal ? 2 : 0,
              fontWeight: isTotal ? 700 : 400,
            }}
          >
            <span style={{ textAlign: 'right', flex: '1 1 auto' }}>
              {isTotal ? 'المجموع:' : sanitizePdfText(label ?? '')}
            </span>
            <span style={{ ...LTR_NUM, flex: '0 0 auto', width: 'auto', minWidth: 48 }}>
              {sanitizePdfText(amount ?? '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function columnWidth(header: string, colIdx: number, totalCols: number): string | undefined {
  if (colIdx === 0) return '4%';
  if (colIdx === 1) return '12%';
  if (header === 'البدلات (شهري)') return '16%';
  if (header === 'الصافي') return '8%';
  if (header === 'خصم او اضافة مباشرة') return '9%';
  const numericCols = totalCols - 3;
  if (numericCols > 0 && colIdx >= 3) return `${Math.floor(61 / numericCols)}%`;
  return undefined;
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

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          width: '277mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          padding: '20px 16px 32px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#111',
          minHeight: '190mm',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 12,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          مسير رواتب العاملين ( شهر{' '}
          <span style={{ fontWeight: 700 }}>{sanitizePdfText(monthNameAr)}</span> ) فرع{' '}
          <span style={{ fontWeight: 700 }}>{sanitizePdfText(branchNameAr)}</span>
        </div>

        <table
          dir="rtl"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <colgroup>
            {headers.map((h, i) => (
              <col key={h} style={{ width: columnWidth(h, i, headers.length) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} style={TH_STYLE}>{sanitizePdfText(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => {
                  const header = headers[colIdx] ?? '';
                  if (colIdx === 0) {
                    return (
                      <NumericCell key={colIdx} value={cell} fractionDigits={0} />
                    );
                  }
                  if (colIdx === 1) {
                    return (
                      <td
                        key={colIdx}
                        style={{
                          ...TD_BASE,
                          textAlign: 'right',
                          fontWeight: 600,
                          paddingInline: 10,
                        }}
                      >
                        {formatCell(cell)}
                      </td>
                    );
                  }
                  if (colIdx === 2) {
                    return (
                      <td key={colIdx} style={{ ...TD_BASE, textAlign: 'right', padding: '8px 10px' }}>
                        <AllowancesCellContent text={String(cell)} />
                      </td>
                    );
                  }
                  const isNet = header === 'الصافي';
                  return (
                    <NumericCell
                      key={colIdx}
                      value={cell}
                      bold={isNet}
                      bg={isNet ? '#f0f7ef' : undefined}
                    />
                  );
                })}
              </tr>
            ))}
            <tr>
              <td
                colSpan={labelColSpan}
                style={{
                  ...TD_BASE,
                  textAlign: 'right',
                  fontWeight: 700,
                  paddingInline: 12,
                  backgroundColor: '#f5f5f5',
                }}
              >
                {formatCell(totalRow[0] ?? 'المجموع الكلي')}
              </td>
              {totalRow.slice(labelColSpan).map((cell, i, arr) => {
                const isNet = i === arr.length - 1;
                return (
                  <NumericCell
                    key={i}
                    value={cell}
                    bold
                    bg={isNet ? '#e8f5e6' : '#f5f5f5'}
                  />
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    );
  },
);
