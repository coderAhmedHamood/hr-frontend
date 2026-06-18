import type { Employee } from '@/features/hr/organization/employees/types';
import { buildDefaultFieldVisibility, buildVisibleFieldRows } from '@/features/hr/organization/employees/lib/rose-document-templates/build-field-rows';
import {
  DEFAULT_ROSE_CLEARANCE_TEMPLATE,
  normalizeClearanceTemplate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/default-clearance-template';
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
  ClearanceWizardPayload,
  DocumentLocale,
  RoseClearanceTemplateContent,
  RoseDocumentBlock,
  RoseDocumentPrintModel,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';
import { DEFAULT_ROSE_DOCUMENT_LANGUAGE } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type BuildClearancePrintInput = {
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
  companyNameAr: string;
  companyNameEn: string;
  template: RoseClearanceTemplateContent;
  wizard: ClearanceWizardPayload;
};

function composeLocaleSection(
  locale: DocumentLocale,
  input: BuildClearancePrintInput,
  mergeCtx: ReturnType<typeof buildRoseMergeContext>,
  tokens: Record<string, string>,
): RoseDocumentBlock[] {
  const { employee, template, wizard } = input;
  const reasonText = locale === 'en' && wizard.reasonTextEn.trim()
    ? wizard.reasonTextEn.trim()
    : wizard.reasonTextAr.trim() || '—';

  const nameValue = wizard.fieldOverrides['employee.name'] ?? employee.name;
  const idValue = wizard.fieldOverrides['employee.nationalId'] ?? employee.nationalId ?? '—';

  const optionalGrid = buildVisibleFieldRows(
    template.fieldSlots.filter((s) => s.fieldKey !== 'employee.name' && s.fieldKey !== 'employee.nationalId'),
    wizard.fieldVisibility,
    wizard.fieldOverrides,
    mergeCtx,
    locale,
  );

  return [
    {
      type: 'labeled_rows',
      locale,
      rows: [
        { label: pickLocalized(template.employeeNameLabel, locale), value: nameValue },
        { label: pickLocalized(template.nationalIdLabel, locale), value: idValue },
      ],
    },
    ...(optionalGrid.length > 0 ? [{ type: 'field_grid' as const, locale, rows: optionalGrid }] : []),
    {
      type: 'paragraphs',
      locale,
      lines: [interpolateRoseTemplateText(pickLocalized(template.legalDeclaration, locale), tokens)],
    },
    {
      type: 'text_box',
      locale,
      heading: pickLocalized(template.reasonHeading, locale),
      content: reasonText,
    },
    { type: 'spacer', size: 'lg' },
    {
      type: 'inline_signature_footer',
      locale,
      nameLabel: pickLocalized(template.footerNameLabel, locale),
      name: nameValue,
      dateLabel: pickLocalized(template.footerDateLabel, locale),
      dateGregorian: mergeCtx.footerDateGregorian,
      signatureLabel: pickLocalized(template.footerSignatureLabel, locale),
    },
  ];
}

export function buildClearancePrintModel(input: BuildClearancePrintInput): RoseDocumentPrintModel {
  const template = normalizeClearanceTemplate(input.template as Record<string, unknown>);
  const { wizard } = input;
  const mergeCtx = buildRoseMergeContext({
    employee: input.employee,
    branchNameAr: input.branchNameAr,
    departmentNameAr: input.departmentNameAr,
    companyNameAr: input.companyNameAr,
    companyNameEn: input.companyNameEn,
    footerDateIso: wizard.footerDateIso,
    clearanceReasonAr: wizard.reasonTextAr,
    clearanceReasonEn: wizard.reasonTextEn,
    addressedToAr: '',
    addressedToEn: '',
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

export function createDefaultClearanceWizard(
  employee: Employee,
  template: RoseClearanceTemplateContent = DEFAULT_ROSE_CLEARANCE_TEMPLATE,
): ClearanceWizardPayload {
  const normalized = normalizeClearanceTemplate(template as Record<string, unknown>);
  const today = todayIsoDate();
  return {
    language: DEFAULT_ROSE_DOCUMENT_LANGUAGE,
    footerDateIso: today,
    reasonTextAr: 'استقالة',
    reasonTextEn: 'Resignation',
    fieldVisibility: buildDefaultFieldVisibility(normalized.fieldSlots),
    fieldOverrides: {},
  };
}
