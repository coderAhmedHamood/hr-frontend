'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import {
  ROSE_TRADING_COMPANY_AR_DEFAULT,
  type RoseExperienceRecord,
  type RoseResignationRecord,
  type RoseSettlementRecord,
} from '@/features/hr/organization/employees/lib/employee-rose-forms/types';

const C = {
  primary: '#1a3d3a',
  gold: '#b8933e',
  muted: '#64748b',
  border: '#e2e8f0',
  bg: '#fafaf9',
} as const;

export type RoseFormPdfEmployee = {
  nameAr: string;
  nameEn: string;
  employeeCode: string;
  nationalId: string;
  nationalityAr: string;
  positionAr: string;
  departmentAr: string;
  branchAr: string;
  hireDate: string;
};

/**
 * صفّان من «تسمية: قيمة» داخل RTL — العمود الأيمن أولاً في DOM ليظهر يميناً.
 * يُصدَّر لإعادة الاستخدام في نماذج روز الأخرى (مثل سجل إخلاء الطرف).
 */
export function RosePrintPairedTwoColumnRow({
  pairEnd,
  pairStart,
}: {
  pairEnd: { label: string; value: string };
  pairStart: { label: string; value: string };
}) {
  const cell = (p: { label: string; value: string }) => (
    <div style={{ flex: '1 1 48%', minWidth: 140, fontSize: 8, color: '#334155', textAlign: 'right' }}>
      <span style={{ fontWeight: 700 }}>{sanitizePdfText(p.label)}</span>
      <span>:</span>
      <span dir="auto"> {sanitizePdfText(p.value)}</span>
    </div>
  );

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 8,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      {cell(pairEnd)}
      {cell(pairStart)}
    </div>
  );
}

function TableRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        borderBottom: last ? undefined : `0.5px solid ${C.border}`,
        padding: '5px 6px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div
        style={{
          width: '28%',
          boxSizing: 'border-box',
          fontSize: 8.5,
          fontWeight: 700,
          color: C.primary,
          textAlign: 'right',
          paddingInlineEnd: 4,
        }}
      >
        {sanitizePdfText(label)}
        <span dir="ltr" style={{ unicodeBidi: 'embed' }}>
          :
        </span>
      </div>
      <div
        dir="auto"
        style={{
          width: '72%',
          boxSizing: 'border-box',
          fontSize: 8.5,
          color: '#334155',
          lineHeight: 1.4,
          textAlign: 'right',
          fontFamily: 'Arial, Helvetica, sans-serif',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {sanitizePdfText(value || '—')}
      </div>
    </div>
  );
}

function RecordsDocumentLetterhead({
  companyNameAr,
  companyNameEn,
  titleAr,
}: {
  companyNameAr: string;
  companyNameEn: string;
  titleAr: string;
}) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>();
  React.useEffect(() => {
    setLogoSrc(getPdfLogoSrc());
  }, []);

  return (
    <>
      <RoseTradingLetterheadPrint
        logoSrc={logoSrc}
        companyNameAr={companyNameAr}
        companyNameEn={companyNameEn}
      />
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          marginTop: 4,
          marginBottom: 2,
          textAlign: 'right',
          color: C.primary,
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {sanitizePdfText(titleAr)}
      </div>
    </>
  );
}

function EmployeeStrip({ emp }: { emp: RoseFormPdfEmployee }) {
  return (
    <section>
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'الاسم', value: emp.nameAr }}
        pairStart={{ label: 'الرقم الوظيفي', value: emp.employeeCode }}
      />
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'الوظيفة', value: emp.positionAr }}
        pairStart={{ label: 'الهوية', value: emp.nationalId }}
      />
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'القسم', value: emp.departmentAr }}
        pairStart={{ label: 'الفرع', value: emp.branchAr }}
      />
      <RosePrintPairedTwoColumnRow
        pairEnd={{ label: 'تاريخ الالتحاق', value: emp.hireDate }}
        pairStart={{ label: 'الاسم (إنجليزي)', value: emp.nameEn }}
      />
    </section>
  );
}

function FooterPage() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        paddingTop: 10,
        fontSize: 8,
        color: C.muted,
        textAlign: 'center',
        borderTop: `1px solid ${C.border}`,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <span dir="rtl">صفحة </span>
      <span dir="ltr">1</span>
      <span dir="rtl"> / </span>
      <span dir="ltr">1</span>
    </footer>
  );
}

function SignatureRow({
  endLabel,
  startLabel,
}: {
  endLabel: string;
  startLabel: string;
}) {
  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 28,
        paddingTop: 12,
        gap: 12,
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
        <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>{sanitizePdfText(endLabel)}</div>
      </div>
      <div style={{ width: '42%', borderTop: `0.5px solid ${C.muted}`, paddingTop: 6 }}>
        <div style={{ fontSize: 8, color: C.muted, textAlign: 'center' }}>{sanitizePdfText(startLabel)}</div>
      </div>
    </div>
  );
}

export type RoseResignationRecordPrintHtmlProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseResignationRecord;
};

export const RoseResignationRecordPrintHtml = React.forwardRef<HTMLDivElement, RoseResignationRecordPrintHtmlProps>(
  function RoseResignationRecordPrintHtml(
    { companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT, companyNameEn = 'Rose Trading Est.', emp, row },
    ref,
  ) {
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
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
        }}
      >
        <RecordsDocumentLetterhead companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="نموذج استقالة" />

        {/* Subject box */}
        <div
          dir="rtl"
          style={{
            border: '1px solid #111',
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 700,
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 16,
            width: '60%',
            marginInline: 'auto',
          }}
        >
          الموضوع / استقالة
        </div>

        {/* Info table 2x2 */}
        <div
          dir="rtl"
          style={{
            border: '1px solid #111',
            fontSize: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الاسم</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(emp.nameAr)}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الفرع</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(emp.branchAr || '—')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الوظيفة</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(emp.positionAr || '—')}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ width: '50%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right' }}>الجنسية</div>
            <div style={{ width: '50%', padding: '6px 8px', textAlign: 'right' }}>{sanitizePdfText(emp.nationalityAr || '—')}</div>
          </div>
        </div>

        {/* Addressed to */}
        <p style={{ fontSize: 10.5, lineHeight: 1.85, textAlign: 'right', marginBottom: 4 }}>
          إلى السيد مدير / {sanitizePdfText(companyNameAr)}
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.85, textAlign: 'right', marginBottom: 12 }}>
          بعد التحية ،،،
        </p>

        {/* Reasons box */}
        <div
          dir="rtl"
          style={{
            border: '1px solid #111',
            padding: '10px 12px',
            fontSize: 10.5,
            lineHeight: 1.85,
            textAlign: 'right',
            marginBottom: 16,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 6 }}>نظراً للأسباب التالية :</div>
          <div>– {sanitizePdfText(row.reasonAr || '')}</div>
          <div>– </div>
          <div>– </div>
        </div>

        {/* Body text */}
        <p style={{ fontSize: 10.5, lineHeight: 1.85, textAlign: 'right' }}>
          أتقدم لسيادتكم بطلب استقالتي عن العمل اعتبارً من تاريخ :{' '}
          <span dir="ltr">{sanitizePdfText(row.effectiveResignationDate)}</span>
        </p>
        <p style={{ fontSize: 10.5, lineHeight: 1.85, textAlign: 'right', marginTop: 6 }}>
          الموافق :{' '}
          <span dir="ltr">{sanitizePdfText(row.documentDate)}</span>{' '}
          م راجياً من سيادتكم قبول طلبي هذا متمنية لكم التوفيق .
        </p>

        {/* Footer table */}
        <div
          dir="rtl"
          style={{
            marginTop: 24,
            border: '1px solid #111',
            fontSize: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '35%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 9.5 }}>
              اسم مقدمة الطلب
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 9.5 }}>
              {sanitizePdfText(emp.nameAr)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #111' }}>
            <div style={{ width: '35%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 9.5 }}>
              التوقيع
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 9.5 }}>
              .....................................................................
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ width: '35%', borderInlineEnd: '1px solid #111', padding: '6px 8px', fontWeight: 700, textAlign: 'right', fontSize: 9.5 }}>
              التاريخ
            </div>
            <div style={{ flex: 1, padding: '6px 8px', textAlign: 'right', fontSize: 9.5 }}>
              <span dir="ltr">{sanitizePdfText(row.documentDate)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export type RoseSettlementRecordPrintHtmlProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseSettlementRecord;
};

export const RoseSettlementRecordPrintHtml = React.forwardRef<HTMLDivElement, RoseSettlementRecordPrintHtmlProps>(
  function RoseSettlementRecordPrintHtml(
    { companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT, companyNameEn = 'Rose Trading Est.', emp, row },
    ref,
  ) {
    const defaultDecl = sanitizePdfText(
      `أقر بأنني استلمت كامل مستحقاتي المالية والإدارية المتفق عليها، وأخلو سبيل ${companyNameAr} من أي مطالبة لاحقة تتعلق بهذه الفترة.`,
    );
    const declaration = row.declarationAr?.trim() ? row.declarationAr : defaultDecl;

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
          backgroundColor: C.bg,
          padding: '28px 24px 44px',
          fontSize: 10,
          color: '#1e293b',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <RecordsDocumentLetterhead companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="مخالصة نهائية" />
        <EmployeeStrip emp={emp} />

        <div style={{ marginTop: 10, border: `0.5px solid ${C.border}` }}>
          <TableRow label="تاريخ النموذج" value={row.documentDate} />
          <TableRow label="نطاق المخالصة" value={row.settlementPeriodAr || '—'} />
          <TableRow label="الراتب والحقوق" value={row.salaryAndRightsAr || '—'} />
          <TableRow label="الاستقطاعات" value={row.deductionsAr || '—'} />
          <TableRow label="الصافي / البيان" value={row.netAmountAr || '—'} last />
        </div>

        <div style={{ marginTop: 10, fontSize: 9, fontWeight: 700, color: C.primary, textAlign: 'right', borderInlineStart: `3px solid ${C.gold}`, paddingInlineStart: 6 }}>
          إقرار الموظف
        </div>
        <p style={{ marginTop: 8, fontSize: 9.5, lineHeight: 1.55, textAlign: 'right', color: '#1e293b' }}>
          {sanitizePdfText(declaration)}
        </p>

        <SignatureRow endLabel="توقيع الموظف" startLabel="توقيع مسؤول الموارد البشرية" />
        <FooterPage />
      </div>
    );
  },
);

export type RoseExperienceRecordPrintHtmlProps = {
  companyNameAr?: string;
  companyNameEn?: string;
  emp: RoseFormPdfEmployee;
  row: RoseExperienceRecord;
};

export const RoseExperienceRecordPrintHtml = React.forwardRef<HTMLDivElement, RoseExperienceRecordPrintHtmlProps>(
  function RoseExperienceRecordPrintHtml(
    { companyNameAr = ROSE_TRADING_COMPANY_AR_DEFAULT, companyNameEn = 'Rose Trading Est.', emp, row },
    ref,
  ) {
    const jobTitle = row.jobTitleAr?.trim() ? row.jobTitleAr : emp.positionAr;

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
          display: 'flex',
          flexDirection: 'column',
          minHeight: '297mm',
        }}
      >
        <RecordsDocumentLetterhead companyNameAr={companyNameAr} companyNameEn={companyNameEn} titleAr="شهادة خبرة" />

        {/* Main body with blanks */}
        <p style={{ fontSize: 10.5, lineHeight: 1.85, textAlign: 'right' }}>
          هذه الشهادة لتأكيد أن{' '}
          <span style={{ fontWeight: 700 }}>
            السيد / ة {sanitizePdfText(emp.nameAr)}
          </span>{' '}
          قد عمل في شركة{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(companyNameAr)}
          </span>{' '}
          في قسم{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(emp.departmentAr)}
          </span>{' '}
          بمنصب{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(jobTitle)}
          </span>{' '}
          منذ{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(row.serviceFrom)}
          </span>{' '}
          وحتى{' '}
          <span style={{ fontWeight: 700 }}>
            {sanitizePdfText(row.serviceTo)}
          </span>
          .
        </p>

        {/* Performance header */}
        <div style={{ marginTop: 16, fontSize: 10.5, lineHeight: 1.85, textAlign: 'right', fontWeight: 700 }}>
          خلال فترة عمله معنا، وجدنا أنه:
        </div>

        {/* Traits */}
        <div style={{ marginTop: 8, fontSize: 10.5, lineHeight: 1.85, textAlign: 'right' }}>
          فرد أنيق المظهر، حسن المعاملة، مبادر للعمل وسريع البديهة، قادر على تحمل ضغوط العمل، وفرد ممتاز في فريق العمل.
        </div>

        {/* Closing wish */}
        <div style={{ marginTop: 16, fontSize: 10.5, lineHeight: 1.85, textAlign: 'right' }}>
          نتمنى له الأفضل في ما سيأتي في حياته المهنية،،،
        </div>

        <div style={{ flex: 1, minHeight: 10 }} aria-hidden />

        {/* Manager signature */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textAlign: 'center' }}>المدير العام</div>
          <div style={{ width: 220, height: 1, backgroundColor: '#000', marginTop: 8 }} />
          <div style={{ marginTop: 4, fontSize: 9, color: '#64748b', textAlign: 'center' }}>
            ............................................
          </div>
        </div>
      </div>
    );
  },
);

