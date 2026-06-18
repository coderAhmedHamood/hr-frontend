import type { Employee } from '@/features/hr/organization/employees/types';
import { buildDefaultFieldVisibility, buildVisibleFieldRows } from '@/features/hr/organization/employees/lib/rose-document-templates/build-field-rows';
import {
  DEFAULT_ROSE_SETTLEMENT_TEMPLATE,
  normalizeSettlementTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-settlement-template';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import {
  pickLocalized,
  resolveActiveLocales,
} from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import {
  buildRoseMergeContext,
  buildRoseMergeTokens,
  interpolateRoseTemplateText,
} from '@/features/hr/organization/employees/lib/rose-document-templates/resolve-merge-context';
import type {
  DocumentLocale,
  RoseDocumentBlock,
  RoseDocumentPrintModel,
  RoseSettlementTemplateContent,
  SettlementWizardPayload,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';
import { DEFAULT_ROSE_DOCUMENT_LANGUAGE } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type BuildSettlementPrintInput = {
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
  companyNameAr: string;
  companyNameEn: string;
  template: RoseSettlementTemplateContent;
  wizard: SettlementWizardPayload;
};

function composeLocaleSection(
  locale: DocumentLocale,
  input: BuildSettlementPrintInput,
  mergeCtx: ReturnType<typeof buildRoseMergeContext>,
  tokens: Record<string, string>,
): RoseDocumentBlock[] {
  const { employee, template, wizard } = input;
  const optionalGrid = buildVisibleFieldRows(
    template.fieldSlots,
    wizard.fieldVisibility,
    wizard.fieldOverrides,
    mergeCtx,
    locale,
  );

  const bodyLines = template.bodyParagraphs.map((p) =>
    interpolateRoseTemplateText(pickLocalized(p, locale), tokens),
  );

  return [
    ...(optionalGrid.length > 0 ? [{ type: 'field_grid' as const, locale, rows: optionalGrid }] : []),
    { type: 'paragraphs', locale, lines: bodyLines },
    {
      type: 'signature_footer',
      locale,
      applicantLabel: pickLocalized(template.footerApplicantLabel, locale),
      applicantName: wizard.fieldOverrides['employee.name'] ?? employee.name,
      signatureLabel: pickLocalized(template.footerSignatureLabel, locale),
      dateLabel: pickLocalized(template.footerDateLabel, locale),
      dateGregorian: mergeCtx.footerDateGregorian,
    },
  ];
}

export function buildSettlementPrintModel(input: BuildSettlementPrintInput): RoseDocumentPrintModel {
  const template = normalizeSettlementTemplate(input.template as Record<string, unknown>);
  const { wizard } = input;
  const mergeCtx = buildRoseMergeContext({
    employee: input.employee,
    branchNameAr: input.branchNameAr,
    departmentNameAr: input.departmentNameAr,
    companyNameAr: input.companyNameAr,
    companyNameEn: input.companyNameEn,
    footerDateIso: wizard.footerDateIso,
    endDateIso: wizard.endDateIso,
    serviceStartIso: wizard.serviceStartIso,
    addressedToAr: '',
    addressedToEn: '',
    clearanceReasonAr: '',
    clearanceReasonEn: '',
  });
  const tokens = buildRoseMergeTokens(mergeCtx);
  const locales = resolveActiveLocales(wizard.language);

  return {
    language: wizard.language,
    companyNameAr: input.companyNameAr,
    companyNameEn: input.companyNameEn,
    blocks: [
      { type: 'title', text: template.title, variant: 'underlined' },
      ...locales.flatMap((locale) => composeLocaleSection(locale, { ...input, template }, mergeCtx, tokens)),
    ],
  };
}

export function createDefaultSettlementWizard(
  employee: Employee,
  template: RoseSettlementTemplateContent = DEFAULT_ROSE_SETTLEMENT_TEMPLATE,
): SettlementWizardPayload {
  const normalized = normalizeSettlementTemplate(template as Record<string, unknown>);
  const today = todayIsoDate();
  return {
    language: DEFAULT_ROSE_DOCUMENT_LANGUAGE,
    footerDateIso: today,
    endDateIso: today,
    serviceStartIso: employee.startDate ?? today,
    fieldVisibility: buildDefaultFieldVisibility(normalized.fieldSlots),
    fieldOverrides: {},
  };
}
