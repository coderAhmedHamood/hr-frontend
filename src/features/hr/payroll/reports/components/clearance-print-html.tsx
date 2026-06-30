'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { formatDisplayDate } from '@/shared/utils';

export type ClearancePrintProps = {
  company: { nameAr: string; nameEn: string };
  employeeNameAr: string;
  nationalId: string;
  nationality: string;
  startDate: string;
  endDate: string;
  date: string;
};

const C = {
  border: '#aaaaaa',
  tableHead: '#c8dfc4',
  muted: '#555555',
} as const;

function fmtDate(iso: string): string {
  return formatDisplayDate(iso) || iso;
}

function InfoTable({ rows }: { rows: [string, string][] }) {
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        marginTop: 8,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {rows.map(([label, value], i) => (
        <div
          key={label}
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: i < rows.length - 1 ? `1px solid ${C.border}` : undefined,
          }}
        >
          <div
            style={{
              width: 100,
              backgroundColor: C.tableHead,
              padding: '5px 8px',
              borderLeft: `1px solid ${C.border}`,
              fontSize: 7,
              fontWeight: 700,
              textAlign: 'right',
            }}
          >
            {label}
          </div>
          <div style={{ flex: 1, padding: '5px 8px', fontSize: 7, textAlign: 'right' }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

export const ClearancePrintHtml = React.forwardRef<HTMLDivElement, ClearancePrintProps>(
  function ClearancePrintHtml(
    { company, employeeNameAr, nationalId, nationality, startDate, endDate, date },
    ref,
  ) {
    const [logoSrc, setLogoSrc] = React.useState<string | undefined>(undefined);
    React.useEffect(() => {
      setLogoSrc(getPdfLogoSrc());
    }, []);

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
          fontSize: 10.5,
          color: '#111111',
          lineHeight: 1.5,
        }}
      >
        <RoseTradingLetterheadPrint
          logoSrc={logoSrc}
          companyNameAr={company.nameAr}
          companyNameEn={company.nameEn}
        />

        <div style={{ marginBottom: 12, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'underline',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            مخالصة موظف — إبراء ذمة
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            border: `1px solid ${C.border}`,
            padding: 14,
            borderRadius: 3,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <p
            style={{
              fontSize: 9,
              textAlign: 'right',
              lineHeight: 1.8,
              fontWeight: 700,
              margin: '0 0 6px 0',
            }}
          >
            أقر أنا / ...........................................................................، الجنسية
            ..........................
          </p>
          <p style={{ fontSize: 9, textAlign: 'right', lineHeight: 1.8, margin: '0 0 4px 0' }}>
            بموجب بطاقة أحوال رقم (<span dir="ltr">{nationalId}</span>) الموقعة أدناه، اعتباراً من
          </p>
          <p style={{ fontSize: 9, textAlign: 'right', lineHeight: 1.8, margin: '0 0 4px 0' }}>
            تاريخ {fmtDate(endDate)} الموافق {fmtDate(endDate)}م قد وصلني جميع الأموال
          </p>
          <p style={{ fontSize: 9, textAlign: 'right', lineHeight: 1.8, margin: 0 }}>
            والمبالغ المستحقة لي وكافة حقوقي على مختلف أنواعها وحتى إنهاء فترة خدمتي.
          </p>
        </div>

        <div
          style={{
            marginTop: 16,
            border: `1px solid ${C.border}`,
            padding: 14,
            borderRadius: 3,
            backgroundColor: '#fafafa',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          <p style={{ fontSize: 9, textAlign: 'right', lineHeight: 2, margin: 0 }}>
            وتبعاً لذلك فإنني أبرئ ذمة مؤسسة {company.nameAr} للتجارة إبراءً شاملاً لا رجوع منه مطلقاً لأي
          </p>
          <p style={{ fontSize: 9, textAlign: 'right', lineHeight: 2, margin: 0 }}>
            حق أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان.
          </p>
          <p style={{ fontSize: 9, textAlign: 'right', lineHeight: 2, margin: '6px 0 0 0' }}>
            وبذلك فإننا نبرئ ذمة الموظفة / الموظف المذكورة أعلاه إبراءً شاملاً لا رجوع منه مطلقاً لأي حق
          </p>
          <p style={{ fontSize: 9, textAlign: 'right', lineHeight: 2, margin: 0 }}>
            أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان.
          </p>
        </div>

        <InfoTable
          rows={[
            ['الاسم', employeeNameAr],
            ['الجنسية', nationality],
            ['رقم الهوية', nationalId],
            ['تاريخ التعيين', fmtDate(startDate)],
            ['تاريخ الإنهاء', fmtDate(endDate)],
          ]}
        />

        <div
          style={{
            marginTop: 32,
            border: `1px solid ${C.border}`,
            padding: 12,
            borderRadius: 3,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {(['الاسم :', 'التوقيع :', 'التاريخ :'] as const).map((lbl, idx) => (
            <div
              key={lbl}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: idx < 2 ? 14 : 0,
                alignItems: 'flex-end',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 7 }}>{lbl}</span>
              <div
                style={{
                  flex: 1,
                  marginInlineStart: 8,
                  marginInlineEnd: 60,
                  borderBottom: `1px solid ${C.border}`,
                  minHeight: idx === 2 ? 'auto' : 1,
                  paddingBottom: idx === 2 ? 2 : 0,
                  fontSize: 7,
                  textAlign: 'right',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                }}
              >
                {idx === 2 ? <span dir="ltr">{fmtDate(date)}</span> : null}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            fontSize: 7,
            color: C.muted,
            textAlign: 'center',
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          هذه الوثيقة صادرة من نظام {company.nameAr} لإدارة الموارد البشرية — {fmtDate(date)}
        </div>
      </div>
    );
  },
);
