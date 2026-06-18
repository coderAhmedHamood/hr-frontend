import type { Employee } from '@/features/hr/organization/employees/types';
import { buildDefaultFieldVisibility, buildVisibleFieldRows } from '@/features/hr/organization/employees/lib/rose-document-templates/build-field-rows';
import {
  DEFAULT_ROSE_EXPERIENCE_TEMPLATE,
  normalizeExperienceTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-experience-template';
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
  ExperienceWizardPayload,
  RoseDocumentBlock,
  RoseDocumentPrintModel,
  RoseExperienceTemplateContent,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';
import { DEFAULT_ROSE_DOCUMENT_LANGUAGE } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type BuildExperiencePrintInput = {
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
  companyNameAr: string;
  companyNameEn: string;
  template: RoseExperienceTemplateContent;
  wizard: ExperienceWizardPayload;
};

function composeLocaleSection(
  locale: DocumentLocale,
  input: BuildExperiencePrintInput,
  mergeCtx: ReturnType<typeof buildRoseMergeContext>,
  tokens: Record<string, string>,
): RoseDocumentBlock[] {
  const { template, wizard } = input;
  const optionalGrid = buildVisibleFieldRows(
    template.fieldSlots,
    wizard.fieldVisibility,
    wizard.fieldOverrides,
    mergeCtx,
    locale,
  );

  const performanceText = locale === 'en' && wizard.performanceTextEn.trim()
    ? wizard.performanceTextEn.trim()
    : wizard.performanceTextAr.trim() || pickLocalized(template.performanceTraits, locale);

  return [
    ...(optionalGrid.length > 0 ? [{ type: 'field_grid' as const, locale, rows: optionalGrid }] : []),
    {
      type: 'paragraphs',
      locale,
      lines: [interpolateRoseTemplateText(pickLocalized(template.bodyIntro, locale), tokens)],
    },
    {
      type: 'paragraphs',
      locale,
      lines: [
        pickLocalized(template.performanceHeading, locale),
        performanceText,
      ],
    },
    {
      type: 'paragraphs',
      locale,
      lines: [pickLocalized(template.closingWish, locale)],
    },
    { type: 'spacer', size: 'md' },
    {
      type: 'manager_signature',
      locale,
      title: pickLocalized(template.managerSignatureTitle, locale),
    },
  ];
}

export function buildExperiencePrintModel(input: BuildExperiencePrintInput): RoseDocumentPrintModel {
  const template = normalizeExperienceTemplate(input.template as Record<string, unknown>);
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
    certificateDateIso: wizard.certificateDateIso,
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

export function createDefaultExperienceWizard(
  employee: Employee,
  template: RoseExperienceTemplateContent = DEFAULT_ROSE_EXPERIENCE_TEMPLATE,
): ExperienceWizardPayload {
  const normalized = normalizeExperienceTemplate(template as Record<string, unknown>);
  const today = todayIsoDate();
  return {
    language: DEFAULT_ROSE_DOCUMENT_LANGUAGE,
    footerDateIso: today,
    endDateIso: today,
    serviceStartIso: employee.startDate ?? today,
    certificateDateIso: today,
    performanceTextAr: '',
    performanceTextEn: '',
    fieldVisibility: buildDefaultFieldVisibility(normalized.fieldSlots),
    fieldOverrides: {},
  };
}
