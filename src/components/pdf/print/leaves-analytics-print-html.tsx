'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { formatDisplayDate } from '@/shared/utils';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';

export type LeavesAnalyticsLeaveRowPrint = {
  employeeNameAr: string;
  start: string;
  end: string;
  typeAr: string;
  statusAr: string;
  workingDays: number;
};

export type LeavesAnalyticsPrintHtmlProps = {
  companyNameAr: string;
  companyNameEn: string;
  filterSummary: string;
  kpi: { total: number; approved: number; pending: number; workDays: number };
  leaveRows: LeavesAnalyticsLeaveRowPrint[];
  employeeRows: { nameAr: string; annual: string; sick: string; branch: string }[];
  logoSrc?: string;
  generatedAt?: string;
};

const PAGE_STYLE: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
  padding: '26px 20px 48px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 10,
  color: '#111',
  boxSizing: 'border-box',
};

function fmtGeneratedAt(label?: string): string {
  if (label?.trim()) return label.trim();
  return formatDisplayDate(new Date().toISOString());
}

export const LeavesAnalyticsPrintHtml = React.forwardRef<HTMLDivElement, LeavesAnalyticsPrintHtmlProps>(
  function LeavesAnalyticsPrintHtml(
    { companyNameAr, companyNameEn, filterSummary, kpi, leaveRows, employeeRows, logoSrc: logoSrcProp, generatedAt },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
    React.useEffect(() => {
      if (logoSrcProp) setLogoSrc(logoSrcProp);
      else setLogoSrc(getPdfLogoSrc());
    }, [logoSrcProp]);

    const gen = fmtGeneratedAt(generatedAt);

    return (
      <div ref={ref} dir="rtl" lang="ar" style={{ width: '210mm', maxWidth: '100%', margin: '0 auto' }}>
        <div style={{ ...PAGE_STYLE, minHeight: '297mm' }}>
          <RosePdfWatermark logoSrc={logoSrc} />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={companyNameAr}
            companyNameEn={companyNameEn}
          />

          <div style={{ fontSize: 15, fontWeight: 700, textAlign: 'center', marginBottom: 8, textDecoration: 'underline' }}>
            تحليلات الإجازات — تقرير PDF
          </div>
          <div style={{ fontSize: 9.5, color: '#666', textAlign: 'right', lineHeight: 1.4, marginBottom: 14 }}>
            {sanitizePdfText(filterSummary)}
          </div>

          <div style={{ display: 'flex', flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { value: kpi.total, label: 'إجمالي الطلبات' },
              { value: kpi.approved, label: 'موافق عليها' },
              { value: kpi.pending, label: 'قيد الانتظار' },
              { value: kpi.workDays, label: 'أيام عمل' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  flex: '1 1 110px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 10px',
                  backgroundColor: '#fafafa',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700 }} dir="ltr">
                  {sanitizePdfText(String(item.value))}
                </div>
                <div style={{ fontSize: 9.5, color: '#475569', marginTop: 2 }}>{sanitizePdfText(item.label)}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>طلبات الإجازات المصفّاة</div>
          <div style={{ border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#e8f2ef', borderBottom: '1px solid #cbd5e1' }}>
              {[
                { label: 'الموظف', w: '28%', align: 'right' as const },
                { label: 'من', w: '14%', align: 'center' as const },
                { label: 'إلى', w: '14%', align: 'center' as const },
                { label: 'النوع', w: '16%', align: 'right' as const },
                { label: 'الحالة', w: '18%', align: 'right' as const },
                { label: 'أيام', w: '10%', align: 'center' as const },
              ].map((h, i) => (
                <div
                  key={h.label}
                  style={{
                    width: h.w,
                    padding: '6px 6px',
                    fontSize: 9,
                    fontWeight: 700,
                    textAlign: h.align,
                    borderInlineStart: i === 0 ? undefined : '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                  }}
                >
                  {sanitizePdfText(h.label)}
                </div>
              ))}
            </div>

            {leaveRows.length === 0 ? (
              <div style={{ padding: 10, textAlign: 'center', color: '#64748b' }}>لا توجد طلبات إجازة ضمن الفلترة.</div>
            ) : (
              leaveRows.map((l, idx) => (
                <div
                  key={`${l.employeeNameAr}-${l.start}-${idx}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    borderTop: idx === 0 ? undefined : '1px solid #e2e8f0',
                    backgroundColor: idx % 2 === 1 ? '#fafafa' : '#fff',
                  }}
                >
                  <div style={{ width: '28%', padding: '6px 6px', fontSize: 9.5, textAlign: 'right', boxSizing: 'border-box', wordBreak: 'break-word' }}>
                    {sanitizePdfText(l.employeeNameAr)}
                  </div>
                  <div style={{ width: '14%', padding: '6px 6px', fontSize: 9.5, textAlign: 'center', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0' }}>
                    <span dir="ltr">{sanitizePdfText(l.start)}</span>
                  </div>
                  <div style={{ width: '14%', padding: '6px 6px', fontSize: 9.5, textAlign: 'center', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0' }}>
                    <span dir="ltr">{sanitizePdfText(l.end)}</span>
                  </div>
                  <div style={{ width: '16%', padding: '6px 6px', fontSize: 9.5, textAlign: 'right', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    {sanitizePdfText(l.typeAr)}
                  </div>
                  <div style={{ width: '18%', padding: '6px 6px', fontSize: 9.5, textAlign: 'right', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    {sanitizePdfText(l.statusAr)}
                  </div>
                  <div style={{ width: '10%', padding: '6px 6px', fontSize: 9.5, textAlign: 'center', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0' }}>
                    <span dir="ltr">{sanitizePdfText(String(l.workingDays))}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 8, color: '#1f2937' }}>أرصدة الموظفين</div>
          <div style={{ border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#e8f2ef', borderBottom: '1px solid #cbd5e1' }}>
              {[
                { label: 'الموظف', w: '44%', align: 'right' as const },
                { label: 'الفرع', w: '26%', align: 'right' as const },
                { label: 'سنوية', w: '15%', align: 'center' as const },
                { label: 'مرضية', w: '15%', align: 'center' as const },
              ].map((h, i) => (
                <div
                  key={h.label}
                  style={{
                    width: h.w,
                    padding: '6px 6px',
                    fontSize: 9,
                    fontWeight: 700,
                    textAlign: h.align,
                    borderInlineStart: i === 0 ? undefined : '1px solid #cbd5e1',
                    boxSizing: 'border-box',
                  }}
                >
                  {sanitizePdfText(h.label)}
                </div>
              ))}
            </div>
            {employeeRows.length === 0 ? (
              <div style={{ padding: 10, textAlign: 'center', color: '#64748b' }}>لا توجد بيانات أرصدة.</div>
            ) : (
              employeeRows.map((e, idx) => (
                <div
                  key={`${e.nameAr}-${idx}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    borderTop: idx === 0 ? undefined : '1px solid #e2e8f0',
                    backgroundColor: idx % 2 === 1 ? '#fafafa' : '#fff',
                  }}
                >
                  <div style={{ width: '44%', padding: '6px 6px', fontSize: 9.5, textAlign: 'right', boxSizing: 'border-box', wordBreak: 'break-word' }}>
                    {sanitizePdfText(e.nameAr)}
                  </div>
                  <div style={{ width: '26%', padding: '6px 6px', fontSize: 9.5, textAlign: 'right', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0', wordBreak: 'break-word' }}>
                    {sanitizePdfText(e.branch)}
                  </div>
                  <div style={{ width: '15%', padding: '6px 6px', fontSize: 9.5, textAlign: 'center', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0' }}>
                    <span dir="ltr">{sanitizePdfText(e.annual)}</span>
                  </div>
                  <div style={{ width: '15%', padding: '6px 6px', fontSize: 9.5, textAlign: 'center', boxSizing: 'border-box', borderInlineStart: '1px solid #e2e8f0' }}>
                    <span dir="ltr">{sanitizePdfText(e.sick)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <footer style={{ marginTop: 18, fontSize: 9, color: '#64748b', textAlign: 'center' }}>
            <span>تم الإنشاء: </span>
            <span dir="ltr">{sanitizePdfText(gen)}</span>
            <span> · صفحة </span>
            <span dir="ltr">1</span>
            <span> / </span>
            <span dir="ltr">1</span>
          </footer>
          </div>
        </div>
      </div>
    );
  },
);

