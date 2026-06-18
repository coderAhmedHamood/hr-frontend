import { localized } from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import type { LocalizedText, RoseResignationTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export const DEFAULT_ROSE_RESIGNATION_TEMPLATE: RoseResignationTemplateContent = {
  title: localized('الموضوع / استقالة', 'Subject / Resignation'),
  openingLine: localized('إلى السيد مدير / {{company.nameAr}}', 'To the Director / {{company.nameEn}}'),
  greeting: localized('بعد التحية ،،،', 'Dear Sir/Madam,'),
  reasonsHeading: localized('نظراً للأسباب التالية :', 'For the following reasons:'),
  bodyIntro: localized(
    'أتقدم لسيادتكم بطلب استقالتي عن العمل اعتبارً من تاريخ : {{form.absenceStartHijri}}',
    'I hereby submit my resignation from work effective from: {{form.absenceStartGregorian}}',
  ),
  bodyClosing: localized(
    'الموافق : {{form.absenceStartGregorian}} م راجياً من سيادتكم قبول طلبي هذا متمنية لكم التوفيق .',
    'I respectfully request your approval of this resignation and wish you continued success.',
  ),
  footerApplicantLabel: localized('اسم مقدمة الطلب', 'Applicant Name'),
  footerSignatureLabel: localized('التوقيع', 'Signature'),
  footerDateLabel: localized('التاريخ', 'Date'),
  fieldSlots: [
    { fieldKey: 'employee.name', visible: true },
    { fieldKey: 'employee.branch', visible: true },
    { fieldKey: 'employee.position', visible: true },
    { fieldKey: 'employee.nationality', visible: true },
    { fieldKey: 'employee.nameEn', visible: false },
    { fieldKey: 'employee.employeeCode', visible: false },
    { fieldKey: 'employee.nationalId', visible: false },
    { fieldKey: 'employee.gender', visible: false },
    { fieldKey: 'employee.department', visible: false },
    { fieldKey: 'employee.hireDate', visible: false },
    { fieldKey: 'employee.email', visible: false },
    { fieldKey: 'employee.phone', visible: false },
    { fieldKey: 'employee.address', visible: false },
  ],
};

type LegacyTemplate = Partial<RoseResignationTemplateContent> & Record<string, unknown>;

function readLocalizedPair(
  raw: LegacyTemplate,
  pairKey: keyof Pick<
    RoseResignationTemplateContent,
    | 'title'
    | 'openingLine'
    | 'greeting'
    | 'reasonsHeading'
    | 'bodyIntro'
    | 'bodyClosing'
    | 'footerApplicantLabel'
    | 'footerSignatureLabel'
    | 'footerDateLabel'
  >,
  arKey: string,
  enKey: string,
): LocalizedText {
  const fallback = DEFAULT_ROSE_RESIGNATION_TEMPLATE[pairKey];
  const pair = raw[pairKey];
  if (pair && typeof pair === 'object' && ('ar' in pair || 'en' in pair)) {
    const typed = pair as Partial<LocalizedText>;
    return localized(
      String(typed.ar ?? fallback.ar),
      String(typed.en ?? fallback.en),
    );
  }
  const ar = raw[arKey];
  const en = raw[enKey];
  if (typeof ar === 'string' || typeof en === 'string') {
    return localized(typeof ar === 'string' ? ar : fallback.ar, typeof en === 'string' ? en : fallback.en);
  }
  return fallback;
}

/** Migrate legacy persisted templates that still use *Ar/*En flat keys. */
export function normalizeResignationTemplate(raw: LegacyTemplate): RoseResignationTemplateContent {
  return {
    title: readLocalizedPair(raw, 'title', 'titleAr', 'titleEn'),
    openingLine: readLocalizedPair(raw, 'openingLine', 'openingLineAr', 'openingLineEn'),
    greeting: readLocalizedPair(raw, 'greeting', 'greetingAr', 'greetingEn'),
    reasonsHeading: readLocalizedPair(raw, 'reasonsHeading', 'reasonsHeadingAr', 'reasonsHeadingEn'),
    bodyIntro: readLocalizedPair(raw, 'bodyIntro', 'bodyIntroAr', 'bodyIntroEn'),
    bodyClosing: readLocalizedPair(raw, 'bodyClosing', 'bodyClosingAr', 'bodyClosingEn'),
    footerApplicantLabel: readLocalizedPair(raw, 'footerApplicantLabel', 'footerApplicantLabelAr', 'footerApplicantLabelEn'),
    footerSignatureLabel: readLocalizedPair(raw, 'footerSignatureLabel', 'footerSignatureLabelAr', 'footerSignatureLabelEn'),
    footerDateLabel: readLocalizedPair(raw, 'footerDateLabel', 'footerDateLabelAr', 'footerDateLabelEn'),
    fieldSlots: Array.isArray(raw.fieldSlots) && raw.fieldSlots.length > 0
      ? raw.fieldSlots as RoseResignationTemplateContent['fieldSlots']
      : DEFAULT_ROSE_RESIGNATION_TEMPLATE.fieldSlots,
  };
}
