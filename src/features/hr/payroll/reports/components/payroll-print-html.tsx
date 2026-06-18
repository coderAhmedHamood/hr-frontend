'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';

export type PayrollPrintHtmlProps = {
  logoSrc?: string;
  monthNameAr: string;
  branchNameAr: string;
  rows: {
    no: number;
    employeeName: string;
    baseSalary: number;
    bonusOrOvertime: number;
    totalSalary: number;
  }[];
};

const TH_STYLE: React.CSSProperties = {
  border: '1px solid #111',
  padding: '8px 6px',
  fontSize: 10,
  fontWeight: 700,
  textAlign: 'center',
  backgroundColor: '#a8d5a2',
};

const TD_STYLE: React.CSSProperties = {
  border: '1px solid #111',
  padding: '6px 4px',
  fontSize: 9.5,
  textAlign: 'center',
};

const TD_NAME_STYLE: React.CSSProperties = {
  border: '1px solid #111',
  padding: '6px 4px',
  fontSize: 9.5,
  textAlign: 'right',
};

export const PayrollPrintHtml = React.forwardRef<HTMLDivElement, PayrollPrintHtmlProps>(
  function PayrollPrintHtml({ logoSrc: logoSrcProp, monthNameAr, branchNameAr, rows }, ref) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const emptyRows = Array.from({ length: Math.max(0, 10 - rows.length) }, (_, i) => rows.length + i + 1);

    return (
      <div
        ref={ref}
        dir="rtl"
        lang="ar"
        style={{
          width: '210mm',
          maxWidth: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          padding: '28px 24px 44px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#111',
          minHeight: '297mm',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <RoseTradingLetterheadPrint logoSrc={logoSrc} />

        {/* Title */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 20,
          }}
        >
          مسير رواتب العاملين ( شهر{' '}
          <span style={{ fontWeight: 700 }}>{sanitizePdfText(monthNameAr)}</span> ) فرع{' '}
          <span style={{ fontWeight: 700 }}>{sanitizePdfText(branchNameAr)}</span>
        </div>

        {/* Table */}
        <table
          dir="rtl"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <thead>
            <tr>
              <th style={{ ...TH_STYLE, width: '8%' }}>م</th>
              <th style={{ ...TH_STYLE, width: '28%' }}>اسم الموظف</th>
              <th style={{ ...TH_STYLE, width: '18%' }}>الراتب الأساسي</th>
              <th style={{ ...TH_STYLE, width: '18%' }}>المكافأة أو الإضافي</th>
              <th style={{ ...TH_STYLE, width: '18%' }}>إجمالي الراتب</th>
              <th style={{ ...TH_STYLE, width: '10%' }}>التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.no}>
                <td style={TD_STYLE}>{r.no}</td>
                <td style={TD_NAME_STYLE}>{sanitizePdfText(r.employeeName)}</td>
                <td style={TD_STYLE}>
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r.baseSalary)}
                </td>
                <td style={TD_STYLE}>
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r.bonusOrOvertime)}
                </td>
                <td style={TD_STYLE}>
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(r.totalSalary)}
                </td>
                <td style={TD_STYLE} />
              </tr>
            ))}
            {emptyRows.map((n) => (
              <tr key={`empty-${n}`}>
                <td style={TD_STYLE}>{n}</td>
                <td style={TD_NAME_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
                <td style={TD_STYLE} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
