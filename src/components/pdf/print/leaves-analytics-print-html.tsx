'use client';

import * as React from 'react';
import { PDF_PRINT_FONT_FAMILY } from '@/components/pdf/lib/pdf-print-font';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { formatDisplayDate } from '@/shared/utils';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RegisterTable } from '@/components/pdf/print/register-document';
import { RosePdfWatermark } from '@/components/pdf/rose-trading/rose-pdf-watermark';
import { RoseCompanyStamp } from '@/components/pdf/rose-trading/rose-company-stamp';

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
  padding: '0 20px 48px',
  fontFamily: PDF_PRINT_FONT_FAMILY,
  fontSize: 22,
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
        <div style={{ ...PAGE_STYLE, minHeight: '279mm' }}>
          <RosePdfWatermark logoSrc={logoSrc} />
          <div style={{ position: 'relative', zIndex: 1, paddingTop: 26 }}>
          <RoseTradingLetterheadPrint
            logoSrc={logoSrc}
            companyNameAr={companyNameAr}
            companyNameEn={companyNameEn}
          />

          <div style={{ fontSize: 22.5, fontWeight: 700, textAlign: 'center', marginBottom: 8, textDecoration: 'underline' }}>
            تحليلات الإجازات — تقرير PDF
          </div>
          <div style={{ fontSize: 22, color: '#666', textAlign: 'right', lineHeight: 1.4, marginBottom: 14 }}>
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
                <div style={{ fontSize: 26, fontWeight: 700 }} dir="ltr">
                  {sanitizePdfText(String(item.value))}
                </div>
                <div style={{ fontSize: 22, color: '#475569', marginTop: 2 }}>{sanitizePdfText(item.label)}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#1f2937' }}>طلبات الإجازات المصفّاة</div>
          {/* The shared register table: one font size, dates and numbers on one line. */}
          <RegisterTable
            columns={[
              { label: 'الموظف', kind: 'name' },
              { label: 'من', kind: 'date' },
              { label: 'إلى', kind: 'date' },
              { label: 'النوع', kind: 'status' },
              { label: 'الحالة', kind: 'status' },
              { label: 'أيام', kind: 'number', weight: 0.8 },
            ]}
            rows={leaveRows.map((l) => [l.employeeNameAr, l.start, l.end, l.typeAr, l.statusAr, String(l.workingDays)])}
            emptyText="لا توجد طلبات إجازة ضمن الفلترة."
          />

          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 16, marginBottom: 8, color: '#1f2937' }}>أرصدة الموظفين</div>
          {/* The shared register table: one font size, dates and numbers on one line. */}
          <RegisterTable
            columns={[
              { label: 'الموظف', kind: 'name' },
              { label: 'الفرع', kind: 'text' },
              { label: 'سنوية', kind: 'number' },
              { label: 'مرضية', kind: 'number' },
            ]}
            rows={employeeRows.map((e) => [e.nameAr, e.branch, e.annual, e.sick])}
            emptyText="لا توجد بيانات أرصدة."
          />

          {/* Establishment stamp — «ختم المنشأة». */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 20 }}>
            <RoseCompanyStamp width={130} compact />
          </div>

          <footer style={{ marginTop: 18, fontSize: 22, color: '#64748b', textAlign: 'center' }}>
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

