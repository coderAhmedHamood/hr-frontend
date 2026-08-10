'use client';

import * as React from 'react';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';
import { RoseClearancePrintHtml } from '@/components/pdf/rose-trading/rose-clearance-print-html';
import { RoseResignationPrintHtml } from '@/components/pdf/rose-trading/rose-resignation-print-html';
import { RoseExperiencePrintHtml } from '@/components/pdf/rose-trading/rose-experience-print-html';
import { RoseSettlementPrintHtml } from '@/components/pdf/rose-trading/rose-settlement-print-html';
import { RoseMobileCircularPrintHtml } from '@/components/pdf/rose-trading/rose-mobile-circular-print-html';
import type { EmployeeProfileDraft } from '@/features/hr/organization/employees/components/employee-profile-field';
import {
  formatGregorianDateAr,
  todayIsoDate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import type { ExperiencePdfMode } from '@/features/hr/organization/employees/components/dialogs/employee-experience-pdf-prep-dialog';
import type { SettlementPdfMode } from '@/features/hr/organization/employees/components/dialogs/employee-settlement-pdf-prep-dialog';

export type EmployeeHrPdfPrepKind = null;

export type EmployeeProfileHrPdfPayload = {
  printable: React.ReactElement | null;
  title: string;
  fileName: string;
};

export function useEmployeeProfileRosePdf(draft: EmployeeProfileDraft) {
  const { data: activeCompany } = useActiveCompany();
  const pdfCompany = usePdfCompanyLetterhead();

  const pdfCtx = React.useMemo(() => ({
    employee: draft,
    branchNameAr: draft.branchNameAr ?? '—',
    departmentNameAr: draft.departmentNameAr ?? '—',
  }), [draft]);

  const companyNames = React.useMemo(() => ({
    nameAr: activeCompany?.nameAr ?? pdfCompany.companyNameAr,
    nameEn: activeCompany?.nameEn ?? pdfCompany.companyNameEn,
    crNumber: activeCompany?.commercialRegistrationNo ?? pdfCompany.commercialReg,
  }), [activeCompany, pdfCompany]);

  const [clearancePrepOpen, setClearancePrepOpen] = React.useState(false);
  const [preview, setPreview] = React.useState<EmployeeProfileHrPdfPayload | null>(null);

  const closeHrPdfPreview = React.useCallback(() => {
    setPreview(null);
  }, []);

  const openFilledExperiencePdf = React.useCallback(() => {
    const today = todayIsoDate();
    setPreview({
      printable: (
        <RoseExperiencePrintHtml
          companyNameAr={companyNames.nameAr}
          companyNameEn={companyNames.nameEn}
          fields={{
            certificateDate: formatGregorianDateAr(today),
            employeeName: draft.name || '—',
            companyName: companyNames.nameAr || '—',
            department: pdfCtx.departmentNameAr || '—',
            position: draft.position || '—',
            startDate: draft.startDate ? formatGregorianDateAr(draft.startDate) : '—',
            endDate: draft.endDate
              ? formatGregorianDateAr(draft.endDate)
              : formatGregorianDateAr(today),
          }}
        />
      ),
      title: 'معاينة — شهادة خبرة',
      fileName: `rose-experience-${draft.employeeCode}.pdf`,
    });
  }, [companyNames.nameAr, companyNames.nameEn, draft, pdfCtx.departmentNameAr]);

  const openHrPdfPrep = React.useCallback((kind: 'resignation' | 'clearance' | 'settlement' | 'experience' | 'cash-receipt' | 'mobile-circular') => {
    switch (kind) {
      case 'resignation':
        setPreview({
          printable: (
            <RoseResignationPrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
            />
          ),
          title: 'معاينة — نموذج استقالة',
          fileName: 'rose-resignation-form.pdf',
        });
        break;
      case 'clearance':
        setPreview({
          printable: (
            <RoseClearancePrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
            />
          ),
          title: 'معاينة — نموذج إخلاء طرف',
          fileName: 'rose-clearance-form.pdf',
        });
        break;
      case 'settlement':
        setPreview({
          printable: (
            <RoseSettlementPrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
            />
          ),
          title: 'معاينة — مخالصة نهائية',
          fileName: 'rose-settlement-blank.pdf',
        });
        break;
      case 'experience':
        openFilledExperiencePdf();
        break;
      case 'cash-receipt':
        // Salary vouchers are payroll-driven — no blank template from official forms.
        break;
      case 'mobile-circular':
        setPreview({
          printable: (
            <RoseMobileCircularPrintHtml
              companyNameAr={companyNames.nameAr}
              companyNameEn={companyNames.nameEn}
              employeeName={draft.name}
              nationalId={draft.nationalId}
            />
          ),
          title: 'معاينة — تعميم استخدام الجوال',
          fileName: `rose-mobile-circular-${draft.employeeCode}.pdf`,
        });
        break;
    }
  }, [companyNames.nameAr, companyNames.nameEn, draft.employeeCode, draft.name, draft.nationalId, openFilledExperiencePdf]);

  const cancelClearancePrep = React.useCallback(() => setClearancePrepOpen(false), []);

  const applyClearanceWizard = React.useCallback(() => {
    setClearancePrepOpen(false);
    setPreview({
      printable: (
        <RoseClearancePrintHtml
          companyNameAr={companyNames.nameAr}
          companyNameEn={companyNames.nameEn}
        />
      ),
      title: 'معاينة — نموذج إخلاء طرف',
      fileName: 'rose-clearance-form.pdf',
    });
  }, [companyNames.nameAr, companyNames.nameEn]);

  const rosePdfPreviewPayload = React.useMemo(
    () =>
      preview ?? {
        printable: null as React.ReactElement | null,
        title: '',
        fileName: '',
      },
    [preview],
  );

  return {
    hrPdfPrepKind: null as EmployeeHrPdfPrepKind,
    clearancePrepOpen,
    settlementPrepOpen: false,
    experiencePrepOpen: false,
    openHrPdfPrep,
    cancelHrPdfPrep: () => {},
    cancelClearancePrep,
    cancelSettlementPrep: () => {},
    cancelExperiencePrep: () => {},
    applyClearanceWizard,
    applySettlementWizard: (_mode: SettlementPdfMode) => {},
    applyExperienceWizard: (_mode: ExperiencePdfMode) => {},
    applyHrPdfPrepResult: () => {},
    hrPdfPreviewOpen: !!preview,
    closeHrPdfPreview,
    rosePdfPreviewPayload,
    rosePdfBranchNameAr: pdfCtx.branchNameAr,
    rosePdfDepartmentNameAr: pdfCtx.departmentNameAr,
    rosePdfCompanyNameAr: companyNames.nameAr,
    rosePdfCompanyNameEn: companyNames.nameEn,
  };
}
