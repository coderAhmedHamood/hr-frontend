'use client';

import * as React from 'react';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { RoseDocumentTemplatePrintHtml } from '@/components/pdf/rose-trading/rose-resignation-template-print-html';
import { CashReceiptPrintHtml, type CashReceiptReason } from '@/features/hr/payroll/reports/components/pdf-cash-receipt-print-html';
import type { EmployeeProfileDraft } from '@/features/hr/organization/employees/components/employee-profile-field';
import { ROSE_TRADING_COMPANY_AR_DEFAULT } from '@/features/hr/organization/employees/lib/employee-rose-forms/types';
import { buildResignationPrintModel } from '@/features/hr/organization/employees/lib/rose-document-templates/build-resignation-print-model';
import { buildClearancePrintModel } from '@/features/hr/organization/employees/lib/rose-document-templates/build-clearance-print-model';
import { buildSettlementPrintModel } from '@/features/hr/organization/employees/lib/rose-document-templates/build-settlement-print-model';
import { buildExperiencePrintModel } from '@/features/hr/organization/employees/lib/rose-document-templates/build-experience-print-model';
import { useRoseResignationTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/resignation-template-store';
import { useRoseClearanceTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/clearance-template-store';
import { useRoseSettlementTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/settlement-template-store';
import { useRoseExperienceTemplateStore } from '@/features/hr/organization/employees/lib/rose-document-templates/experience-template-store';
import type {
  ClearanceWizardPayload,
  ExperienceWizardPayload,
  ResignationWizardPayload,
  RoseFormKind,
  SettlementWizardPayload,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type EmployeeHrPdfPrepKind = 'cash-receipt' | null;

export type EmployeeProfileHrPdfPayload = {
  printable: React.ReactElement | null;
  title: string;
  fileName: string;
};

export function useEmployeeProfileRosePdf(draft: EmployeeProfileDraft) {
  const { data: activeCompany } = useActiveCompany();
  const resignationTemplate = useRoseResignationTemplateStore((s) => s.template);
  const clearanceTemplate = useRoseClearanceTemplateStore((s) => s.template);
  const settlementTemplate = useRoseSettlementTemplateStore((s) => s.template);
  const experienceTemplate = useRoseExperienceTemplateStore((s) => s.template);

  const pdfCtx = React.useMemo(() => ({
    employee: draft,
    branchNameAr: draft.branchNameAr ?? '—',
    departmentNameAr: draft.departmentNameAr ?? '—',
  }), [draft]);

  const companyNames = React.useMemo(() => ({
    nameAr: activeCompany?.nameAr ?? ROSE_TRADING_COMPANY_AR_DEFAULT,
    nameEn: activeCompany?.nameEn ?? 'Rose Trading Est.',
  }), [activeCompany]);

  const [prepKind, setPrepKind] = React.useState<EmployeeHrPdfPrepKind>(null);
  const [resignationPrepOpen, setResignationPrepOpen] = React.useState(false);
  const [clearancePrepOpen, setClearancePrepOpen] = React.useState(false);
  const [settlementPrepOpen, setSettlementPrepOpen] = React.useState(false);
  const [experiencePrepOpen, setExperiencePrepOpen] = React.useState(false);
  const [templateSettingsOpen, setTemplateSettingsOpen] = React.useState(false);
  const [templateSettingsTab, setTemplateSettingsTab] = React.useState<RoseFormKind>('resignation');
  const [preview, setPreview] = React.useState<EmployeeProfileHrPdfPayload | null>(null);
  const [rosePdfLogo, setRosePdfLogo] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setRosePdfLogo(getPdfLogoSrc());
  }, []);

  const closeHrPdfPreview = React.useCallback(() => {
    setPreview(null);
  }, []);

  const openTemplateSettings = React.useCallback((tab: RoseFormKind = 'resignation') => {
    setTemplateSettingsTab(tab);
    setTemplateSettingsOpen(true);
  }, []);

  const openHrPdfPrep = React.useCallback((kind: 'resignation' | 'clearance' | 'settlement' | 'experience' | 'cash-receipt') => {
    switch (kind) {
      case 'resignation':
        setResignationPrepOpen(true);
        break;
      case 'clearance':
        setClearancePrepOpen(true);
        break;
      case 'settlement':
        setSettlementPrepOpen(true);
        break;
      case 'experience':
        setExperiencePrepOpen(true);
        break;
      case 'cash-receipt':
        setPrepKind('cash-receipt');
        break;
    }
  }, []);

  const cancelHrPdfPrep = React.useCallback(() => {
    setPrepKind(null);
  }, []);

  const cancelResignationPrep = React.useCallback(() => setResignationPrepOpen(false), []);
  const cancelClearancePrep = React.useCallback(() => setClearancePrepOpen(false), []);
  const cancelSettlementPrep = React.useCallback(() => setSettlementPrepOpen(false), []);
  const cancelExperiencePrep = React.useCallback(() => setExperiencePrepOpen(false), []);

  const openDocumentPreview = React.useCallback(
    (model: ReturnType<typeof buildResignationPrintModel>, title: string, fileName: string) => {
      setPreview({
        printable: (
          <RoseDocumentTemplatePrintHtml
            logoSrc={rosePdfLogo}
            {...model}
          />
        ),
        title,
        fileName,
      });
    },
    [rosePdfLogo],
  );

  const applyResignationWizard = React.useCallback(
    (wizard: ResignationWizardPayload) => {
      setResignationPrepOpen(false);
      const model = buildResignationPrintModel({
        employee: draft,
        branchNameAr: pdfCtx.branchNameAr,
        departmentNameAr: pdfCtx.departmentNameAr,
        companyNameAr: companyNames.nameAr,
        companyNameEn: companyNames.nameEn,
        template: resignationTemplate,
        wizard,
      });
      openDocumentPreview(model, 'معاينة — نموذج استقالة', `rose-resignation-${draft.employeeCode}.pdf`);
    },
    [companyNames.nameAr, companyNames.nameEn, draft, openDocumentPreview, pdfCtx.branchNameAr, pdfCtx.departmentNameAr, resignationTemplate],
  );

  const applyClearanceWizard = React.useCallback(
    (wizard: ClearanceWizardPayload) => {
      setClearancePrepOpen(false);
      const model = buildClearancePrintModel({
        employee: draft,
        branchNameAr: pdfCtx.branchNameAr,
        departmentNameAr: pdfCtx.departmentNameAr,
        companyNameAr: companyNames.nameAr,
        companyNameEn: companyNames.nameEn,
        template: clearanceTemplate,
        wizard,
      });
      openDocumentPreview(model, 'معاينة — نموذج إخلاء طرف', `rose-clearance-${draft.employeeCode}.pdf`);
    },
    [clearanceTemplate, companyNames.nameAr, companyNames.nameEn, draft, openDocumentPreview, pdfCtx.branchNameAr, pdfCtx.departmentNameAr],
  );

  const applySettlementWizard = React.useCallback(
    (wizard: SettlementWizardPayload) => {
      setSettlementPrepOpen(false);
      const model = buildSettlementPrintModel({
        employee: draft,
        branchNameAr: pdfCtx.branchNameAr,
        departmentNameAr: pdfCtx.departmentNameAr,
        companyNameAr: companyNames.nameAr,
        companyNameEn: companyNames.nameEn,
        template: settlementTemplate,
        wizard,
      });
      openDocumentPreview(model, 'معاينة — مخالصة نهائية', `rose-settlement-${draft.employeeCode}.pdf`);
    },
    [companyNames.nameAr, companyNames.nameEn, draft, openDocumentPreview, pdfCtx.branchNameAr, pdfCtx.departmentNameAr, settlementTemplate],
  );

  const applyExperienceWizard = React.useCallback(
    (wizard: ExperienceWizardPayload) => {
      setExperiencePrepOpen(false);
      const model = buildExperiencePrintModel({
        employee: draft,
        branchNameAr: pdfCtx.branchNameAr,
        departmentNameAr: pdfCtx.departmentNameAr,
        companyNameAr: companyNames.nameAr,
        companyNameEn: companyNames.nameEn,
        template: experienceTemplate,
        wizard,
      });
      openDocumentPreview(model, 'معاينة — شهادة خبرة', `rose-experience-${draft.employeeCode}.pdf`);
    },
    [companyNames.nameAr, companyNames.nameEn, draft, experienceTemplate, openDocumentPreview, pdfCtx.branchNameAr, pdfCtx.departmentNameAr],
  );

  const applyHrPdfPrepResult = React.useCallback(
    (
      _previewTarget: 'cash-receipt',
      _patch: Record<string, never>,
      receipt?: {
        amount: number;
        amountWritten: string;
        reason: CashReceiptReason;
        reasonDetail: string;
        date: string;
      },
    ) => {
      setPrepKind(null);
      if (!receipt) return;

      setPreview({
        printable: (
          <CashReceiptPrintHtml
            company={companyNames}
            employeeNameAr={draft.name}
            branchNameAr={pdfCtx.branchNameAr}
            amountNumeric={receipt.amount}
            amountWritten={receipt.amountWritten}
            reason={receipt.reason}
            reasonDetail={receipt.reasonDetail}
            date={receipt.date}
          />
        ),
        title: 'معاينة — سند استلام نقدي',
        fileName: `cash-receipt-${draft.employeeCode}.pdf`,
      });
    },
    [companyNames, draft.employeeCode, draft.name, pdfCtx.branchNameAr],
  );

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
    hrPdfPrepKind: prepKind,
    resignationPrepOpen,
    clearancePrepOpen,
    settlementPrepOpen,
    experiencePrepOpen,
    roseTemplateSettingsOpen: templateSettingsOpen,
    roseTemplateSettingsTab: templateSettingsTab,
    setRoseTemplateSettingsOpen: setTemplateSettingsOpen,
    openRoseTemplateSettings: openTemplateSettings,
    openHrPdfPrep,
    cancelHrPdfPrep,
    cancelResignationPrep,
    cancelClearancePrep,
    cancelSettlementPrep,
    cancelExperiencePrep,
    applyResignationWizard,
    applyClearanceWizard,
    applySettlementWizard,
    applyExperienceWizard,
    applyHrPdfPrepResult,
    hrPdfPreviewOpen: !!preview,
    closeHrPdfPreview,
    rosePdfPreviewPayload,
    rosePdfBranchNameAr: pdfCtx.branchNameAr,
    rosePdfDepartmentNameAr: pdfCtx.departmentNameAr,
    rosePdfCompanyNameAr: companyNames.nameAr,
    rosePdfCompanyNameEn: companyNames.nameEn,
    // Legacy aliases
    resignationTemplateSettingsOpen: templateSettingsOpen,
    setResignationTemplateSettingsOpen: setTemplateSettingsOpen,
  };
}
