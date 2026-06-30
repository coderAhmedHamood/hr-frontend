'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import type { PayrollPrintRow, PayrollPrintTotals } from '@/features/hr/payroll/lib/compensation-preview';

export type PayrollPrintHtmlProps = {
  logoSrc?: string;
  monthNameAr: string;
  branchNameAr: string;
  rows: PayrollPrintRow[];
  totals?: PayrollPrintTotals;
};

const TH_STYLE: React.CSSProperties = {
  border: '1px solid #111',
  padding: '5px 3px',
  fontSize: 7.5,
  fontWeight: 700,
  textAlign: 'center',
  backgroundColor: '#a8d5a2',
  verticalAlign: 'middle',
};

const TD_STYLE: React.CSSProperties = {
  border: '1px solid #111',
  padding: '4px 3px',
  fontSize: 7,
  textAlign: 'center',
  verticalAlign: 'middle',
};

const TD_NAME_STYLE: React.CSSProperties = {
  ...TD_STYLE,
  textAlign: 'right',
};

const TD_ALLOWANCE_STYLE: React.CSSProperties = {
  ...TD_STYLE,
  textAlign: 'right',
  fontSize: 6.5,
  lineHeight: 1.35,
};

function fmtPdf(n: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function AllowancesPdfCell({ row }: { row: PayrollPrintRow }) {
  if (row.allowanceLines.length === 0) {
    return <td style={TD_ALLOWANCE_STYLE}>—</td>;
  }
  return (
    <td style={TD_ALLOWANCE_STYLE}>
      {row.allowanceLines.map((a) => (
        <div key={a.labelAr} style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          <span>{sanitizePdfText(a.labelAr)}</span>
          <span style={{ fontWeight: 600 }}>{fmtPdf(a.amount)}</span>
        </div>
      ))}
      <div style={{ marginTop: 2, borderTop: '1px solid #ccc', paddingTop: 2, fontWeight: 700 }}>
        {fmtPdf(row.allowancesTotal)}
      </div>
    </td>
  );
}

export const PayrollPrintHtml = React.forwardRef<HTMLDivElement, PayrollPrintHtmlProps>(
  function PayrollPrintHtml({ logoSrc: logoSrcProp, monthNameAr, branchNameAr, rows, totals }, ref) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const emptyRows = Array.from({ length: Math.max(0, 8 - rows.length) }, (_, i) => rows.length + i + 1);

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          width: '297mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          padding: '20px 16px 32px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#111',
          minHeight: '210mm',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 12,
            marginBottom: 14,
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
            fontFamily: 'Arial, Helvetica, sans-serif',
            tableLayout: 'fixed',
          }}
        >
          <thead>
            <tr>
              <th style={{ ...TH_STYLE, width: '4%' }}>م</th>
              <th style={{ ...TH_STYLE, width: '11%' }}>اسم الموظف</th>
              <th style={{ ...TH_STYLE, width: '12%' }}>البدلات</th>
              <th style={{ ...TH_STYLE, width: '7%' }}>الأساسي</th>
              <th style={{ ...TH_STYLE, width: '6%' }}>أوفر تايم</th>
              <th style={{ ...TH_STYLE, width: '6%' }}>مكافآت</th>
              <th style={{ ...TH_STYLE, width: '7%' }}>الإجمالي</th>
              <th style={{ ...TH_STYLE, width: '6%' }}>السلف</th>
              <th style={{ ...TH_STYLE, width: '5%' }}>غياب</th>
              <th style={{ ...TH_STYLE, width: '5%' }}>تأخير</th>
              <th style={{ ...TH_STYLE, width: '5%' }}>جزاءات</th>
              <th style={{ ...TH_STYLE, width: '7%' }}>إضافة/خصم</th>
              <th style={{ ...TH_STYLE, width: '7%' }}>الصافي</th>
              <th style={{ ...TH_STYLE, width: '6%' }}>التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no}>
                <td style={TD_STYLE}>{r.no}</td>
                <td style={TD_NAME_STYLE}>{sanitizePdfText(r.employeeName)}</td>
                <AllowancesPdfCell row={r} />
                <td style={TD_STYLE}>{fmtPdf(r.baseSalary)}</td>
                <td style={TD_STYLE}>{fmtPdf(r.overtime)}</td>
                <td style={TD_STYLE}>{fmtPdf(r.bonuses)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(r.gross)}</td>
                <td style={TD_STYLE}>{fmtPdf(r.advances)}</td>
                <td style={TD_STYLE}>{fmtPdf(r.absence)}</td>
                <td style={TD_STYLE}>{fmtPdf(r.lateness)}</td>
                <td style={TD_STYLE}>{fmtPdf(r.penalties)}</td>
                <td style={TD_STYLE}>{fmtPdf(r.manualNet)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(r.net)}</td>
                <td style={TD_STYLE} />
              </tr>
            ))}
            {emptyRows.map((n) => (
              <tr key={`empty-${n}`}>
                <td style={TD_STYLE}>{n}</td>
                <td style={TD_NAME_STYLE} />
                <td style={TD_ALLOWANCE_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr>
                <td colSpan={3} style={{ ...TD_STYLE, fontWeight: 700, textAlign: 'right' }}>
                  المجموع الكلي
                </td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.baseSalary)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.overtime)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.bonuses)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.gross)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.advances)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.absence)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.lateness)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.penalties)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.manualNet)}</td>
                <td style={{ ...TD_STYLE, fontWeight: 700 }}>{fmtPdf(totals.net)}</td>
                <td style={TD_STYLE} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  },
);
