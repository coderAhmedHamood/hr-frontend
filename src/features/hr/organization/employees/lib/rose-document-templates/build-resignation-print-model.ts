import type { Employee } from '@/features/hr/organization/employees/types';
import { ROSE_MERGE_FIELD_MAP } from '@/features/hr/organization/employees/lib/rose-document-templates/merge-field-catalog';
import {
  DEFAULT_ROSE_RESIGNATION_TEMPLATE,
  normalizeResignationTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-resignation-template';
import { todayIsoDate } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import {
  pickLocalized,
  resolveActiveLocales,
} from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import {
  buildRoseMergeContext,
  buildRoseMergeTokens,
  genderAwareApplicantLabelAr,
  genderAwareClosingAr,
  genderAwareClosingEn,
  interpolateRoseTemplateText,
  resolveRoseMergeValue,
} from '@/features/hr/organization/employees/lib/rose-document-templates/resolve-merge-context';
import type {
  DocumentLocale,
  ResignationWizardPayload,
  RoseDocumentBlock,
  RoseFieldRow,
  RoseMergeFieldKey,
  RoseDocumentPrintModel,
  RoseResignationTemplateContent,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';
import { DEFAULT_ROSE_DOCUMENT_LANGUAGE } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type BuildResignationPrintInput = {
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
  companyNameAr: string;
  companyNameEn: string;
  template: RoseResignationTemplateContent;
  wizard: ResignationWizardPayload;
};

const DEFAULT_REASON_PLACEHOLDERS = ['—1', '—2', '—3'];

function resolveOpeningLine(
  locale: DocumentLocale,
  wizard: ResignationWizardPayload,
  template: RoseResignationTemplateContent,
  tokens: Record<string, string>,
): string {
  if (locale === 'ar' && wizard.addressedToAr.trim()) {
    return `إلى / ${wizard.addressedToAr.trim()}`;
  }
  if (locale === 'en' && wizard.addressedToEn.trim()) {
    return `To / ${wizard.addressedToEn.trim()}`;
  }
  return interpolateRoseTemplateText(pickLocalized(template.openingLine, locale), tokens);
}

function buildFieldRows(
  template: RoseResignationTemplateContent,
  wizard: ResignationWizardPayload,
  mergeCtx: ReturnType<typeof buildRoseMergeContext>,
  locale: DocumentLocale,
): RoseFieldRow[] {
  return template.fieldSlots
    .filter((slot) => wizard.fieldVisibility[slot.fieldKey] ?? slot.visible)
    .map((slot) => {
      const meta = ROSE_MERGE_FIELD_MAP[slot.fieldKey];
      const resolved = resolveRoseMergeValue(slot.fieldKey, mergeCtx);
      const override = wizard.fieldOverrides[slot.fieldKey];
      const label = locale === 'en'
        ? (slot.labelEn ?? meta.labelEn)
        : (slot.labelAr ?? meta.labelAr);
      const value = override ?? (locale === 'en' && resolved.en ? resolved.en : resolved.ar);
      return { label, value };
    });
}

function composeLocaleSection(
  locale: DocumentLocale,
  input: BuildResignationPrintInput,
  mergeCtx: ReturnType<typeof buildRoseMergeContext>,
  tokens: Record<string, string>,
): RoseDocumentBlock[] {
  const { employee, template, wizard } = input;
  const reasonLines = wizard.reasonLines.length > 0 ? wizard.reasonLines : DEFAULT_REASON_PLACEHOLDERS;
  const bodyClosingTemplate = locale === 'ar'
    ? genderAwareClosingAr(employee.gender)
    : genderAwareClosingEn(employee.gender);

  return [
    { type: 'field_grid', locale, rows: buildFieldRows(template, wizard, mergeCtx, locale) },
    {
      type: 'paragraphs',
      locale,
      lines: [
        resolveOpeningLine(locale, wizard, template, tokens),
        pickLocalized(template.greeting, locale),
      ],
    },
    {
      type: 'reasons',
      locale,
      heading: pickLocalized(template.reasonsHeading, locale),
      lines: reasonLines,
    },
    {
      type: 'paragraphs',
      locale,
      spacing: 'compact',
      lines: [
        interpolateRoseTemplateText(pickLocalized(template.bodyIntro, locale), tokens),
        interpolateRoseTemplateText(bodyClosingTemplate, tokens),
      ],
    },
    {
      type: 'signature_footer',
      locale,
      applicantLabel: locale === 'ar'
        ? genderAwareApplicantLabelAr(employee.gender)
        : pickLocalized(template.footerApplicantLabel, locale),
      applicantName: wizard.fieldOverrides['employee.name'] ?? employee.name,
      signatureLabel: pickLocalized(template.footerSignatureLabel, locale),
      dateLabel: pickLocalized(template.footerDateLabel, locale),
      dateGregorian: mergeCtx.footerDateGregorian,
    },
  ];
}

export function buildResignationPrintModel(input: BuildResignationPrintInput): RoseDocumentPrintModel {
  const template = normalizeResignationTemplate(
    input.template as RoseResignationTemplateContent & Record<string, unknown>,
  );
  const { wizard } = input;
  const mergeCtx = buildRoseMergeContext({
    employee: input.employee,
    branchNameAr: input.branchNameAr,
    departmentNameAr: input.departmentNameAr,
    companyNameAr: input.companyNameAr,
    companyNameEn: input.companyNameEn,
    addressedToAr: wizard.addressedToAr,
    addressedToEn: wizard.addressedToEn,
    absenceStartIso: wizard.absenceStartIso,
    footerDateIso: wizard.footerDateIso,
  });
  const tokens = buildRoseMergeTokens(mergeCtx);
  const locales = resolveActiveLocales(wizard.language);

  const blocks: RoseDocumentBlock[] = [
    { type: 'title', text: template.title },
    ...locales.flatMap((locale) =>
      composeLocaleSection(locale, { ...input, template }, mergeCtx, tokens),
    ),
  ];

  return {
    language: wizard.language,
    companyNameAr: input.companyNameAr,
    companyNameEn: input.companyNameEn,
    blocks,
  };
}

export function createDefaultResignationWizard(
  _employee: Employee,
  companyNameAr: string,
  template: RoseResignationTemplateContent = DEFAULT_ROSE_RESIGNATION_TEMPLATE,
): ResignationWizardPayload {
  const normalized = normalizeResignationTemplate(template);
  const today = todayIsoDate();
  const fieldVisibility = Object.fromEntries(
    normalized.fieldSlots.map((s) => [s.fieldKey, s.visible]),
  ) as Partial<Record<RoseMergeFieldKey, boolean>>;

  return {
    language: DEFAULT_ROSE_DOCUMENT_LANGUAGE,
    absenceStartIso: today,
    footerDateIso: today,
    addressedToAr: `إدارة الموارد البشرية — ${companyNameAr}`,
    addressedToEn: `Human Resources — ${companyNameAr}`,
    reasonLines: [],
    fieldVisibility,
    fieldOverrides: {},
  };
}
