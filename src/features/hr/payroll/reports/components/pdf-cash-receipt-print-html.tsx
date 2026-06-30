'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { fmtPrintDate, fmtPrintNumber, PDF_PRINT_C, type CompanyInfo } from './pdf-print-shared';

export type CashReceiptReason =
  | 'salary'
  | 'advance'
  | 'allowance'
  | 'overtime'
  | 'storage_deficit'
  | 'other';

export const CASH_RECEIPT_REASON_LABELS: Record<CashReceiptReason, string> = {
  salary: 'استلام راتب شهر',
  advance: 'سلفة',
  allowance: 'بدل',
  overtime: 'بدل إضافي لمدة',
  storage_deficit: 'بدل تحمل عجز مخزون شهر',
  other: 'أخرى',
};

/** @deprecated Use `CASH_RECEIPT_REASON_LABELS` — kept for dialog imports. */
export const REASON_LABELS = CASH_RECEIPT_REASON_LABELS;

export type CashReceiptPrintHtmlProps = {
  company: CompanyInfo;
  employeeNameAr: string;
  branchNameAr: string;
  amountNumeric: number;
  amountWritten: string;
  reason: CashReceiptReason;
  reasonDetail: string;
  date: string;
  logoSrc?: string;
};

function CheckRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <div
        style={{
          width: 10,
          height: 10,
          border: '1px solid #000',
          marginLeft: 6,
          marginRight: 2,
          backgroundColor: checked ? PDF_PRINT_C.primary : 'transparent',
        }}
      />
      <div style={{ flex: 1, fontSize: 9, textAlign: 'right', wordBreak: 'break-word' }}>{sanitizePdfText(label)}</div>
    </div>
  );
}

function LabeledField({ label, value, dir = 'rtl' }: { label: string; value: string; dir?: 'rtl' | 'ltr' }) {
  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#111', textAlign: 'right', minWidth: 110 }}>
        {sanitizePdfText(label)}
      </div>
      <div style={{ flex: 1, fontSize: 9.5, color: '#111', textAlign: 'right' }} dir={dir}>
        {sanitizePdfText(value || '—')}
      </div>
    </div>
  );
}

export const CashReceiptPrintHtml = React.forwardRef<HTMLDivElement, CashReceiptPrintHtmlProps>(
  function CashReceiptPrintHtml(
    { company, employeeNameAr, branchNameAr, amountNumeric, amountWritten, reason, reasonDetail, date },
    ref,
  ) {
    const amountNum = fmtPrintNumber(amountNumeric);
    const written = amountWritten?.trim() ? amountWritten : `${amountNum} ريال سعودي`;

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
          padding: '26px 20px 48px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          color: '#111',
          minHeight: '297mm',
        }}
      >
        <RoseTradingLetterheadPrint
          companyNameAr={company.nameAr}
          companyNameEn={company.nameEn}
          commercialReg={company.crNumber}
        />

        <div style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>
          سند استلام نقدي
        </div>

        <div style={{ marginTop: 8 }}>
          <LabeledField label="استلمت أنا /" value={employeeNameAr} />
          <LabeledField label="من مؤسسة" value={company.nameAr} />
          <LabeledField label="فرع" value={branchNameAr} />
        </div>

        <div style={{ marginTop: 12, backgroundColor: '#f9f9f9', border: `1px solid ${PDF_PRINT_C.border}`, padding: 10, borderRadius: 3 }}>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ flex: '1 1 180px' }}>
              <LabeledField label="مبلغ وقدره ( )" value={amountNum} dir="ltr" />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <LabeledField label="ريال سعودي ( كتابةً )" value={written} />
            </div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, textAlign: 'right', marginTop: 6 }}>وذلك مقابل:</div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ width: '48%', minWidth: 200 }}>
            <CheckRow checked={reason === 'salary'} label={`${CASH_RECEIPT_REASON_LABELS.salary}${reason === 'salary' && reasonDetail ? ` ${reasonDetail}` : ''}`} />
            <CheckRow checked={reason === 'advance'} label={`${CASH_RECEIPT_REASON_LABELS.advance}${reason === 'advance' && reasonDetail ? ` ${reasonDetail}` : ''}`} />
            <CheckRow checked={reason === 'storage_deficit'} label={`${CASH_RECEIPT_REASON_LABELS.storage_deficit}${reason === 'storage_deficit' && reasonDetail ? ` ${reasonDetail}` : ''}`} />
          </div>
          <div style={{ width: '48%', minWidth: 200 }}>
            <CheckRow checked={reason === 'allowance'} label={`${CASH_RECEIPT_REASON_LABELS.allowance}${reason === 'allowance' && reasonDetail ? ` ${reasonDetail}` : ''}`} />
            <CheckRow checked={reason === 'overtime'} label={`${CASH_RECEIPT_REASON_LABELS.overtime}${reason === 'overtime' && reasonDetail ? ` ${reasonDetail}` : ''}`} />
            <CheckRow checked={reason === 'other'} label={`${CASH_RECEIPT_REASON_LABELS.other}${reason === 'other' && reasonDetail ? ` — ${reasonDetail}` : ''}`} />
          </div>
        </div>

        <div style={{ marginTop: 18, backgroundColor: '#f5f5f5', border: `1px solid ${PDF_PRINT_C.border}`, padding: 12, borderRadius: 3 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textAlign: 'right', marginBottom: 12 }}>و على ذلك جرى التوقيع ،،،</div>
          <LabeledField label="الاسم :" value={employeeNameAr} />
          <LabeledField label="التوقيع :" value="" />
          <LabeledField label="التاريخ :" value={fmtPrintDate(date)} dir="ltr" />
        </div>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
          {['مسؤول الفرع', 'إدارة شؤون الموظفين', 'المشرف العام', 'المدير المالي'].map((l) => (
            <div key={l} style={{ flex: 1, borderTop: `0.5px solid ${PDF_PRINT_C.muted}`, paddingTop: 6 }}>
              <div style={{ fontSize: 8, color: PDF_PRINT_C.muted, textAlign: 'center' }}>{sanitizePdfText(l)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

