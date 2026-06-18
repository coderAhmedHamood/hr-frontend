import { localized } from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import { readLocalizedPair } from '@/features/hr/organization/employees/lib/rose-document-templates/template-normalize';
import type { LocalizedText, RoseSettlementTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

const SETTLEMENT_BODY_DEFAULTS: LocalizedText[] = [
  localized(
    'أقر أنا / {{employee.name}} ، الجنسية {{employee.nationality}} بموجب بطاقة أحوال رقم ( {{employee.nationalId}} ) الموقعة أدناه بأنه إعتباراً من',
    'I, {{employee.name}}, nationality {{employee.nationality}}, holder of national ID ({{employee.nationalId}}), hereby acknowledge that as of',
  ),
  localized(
    'تاريخ: {{form.endDateHijri}} الموافق: {{form.endDateGregorian}} ، قد وصلني جميع الأموال',
    'Date: {{form.endDateHijri}} corresponding to: {{form.endDateGregorian}}, I have received all funds',
  ),
  localized(
    'والمبالغ المستحقة لي وكافة حقوقي على مختلف أنواعها وحتى إنهاء فترة خدمتي .',
    'and amounts due to me and all my rights of various kinds until the end of my service period.',
  ),
  localized(
    'وتبعاً لذلك فإنني أبرئ ذمة {{company.nameAr}} إبراءً شاملاً عاماً لا رجوع منه مطلقاً لأي حق أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان .',
    'Accordingly, I hereby fully and irrevocably release {{company.nameEn}} from any current or future claim of any kind or form.',
  ),
  localized(
    'وبذلك فإننا نبرئ ذمة {{employee.settlementRef}} المذكورة أعلاه إبراءً شاملاً عاماً لا رجوع منه مطلقاً لأي حق أو مطالبة حالية أو مستقبلية ومن أي نوع أو شكل كان .',
    'Accordingly, we hereby fully and irrevocably release the above-mentioned {{employee.settlementRefEn}} from any current or future claim of any kind or form.',
  ),
];

function readParagraphs(raw: Record<string, unknown>): LocalizedText[] {
  if (Array.isArray(raw.bodyParagraphs) && raw.bodyParagraphs.length > 0) {
    return raw.bodyParagraphs.map((p, i) => {
      if (p && typeof p === 'object' && ('ar' in p || 'en' in p)) {
        const typed = p as Partial<LocalizedText>;
        const fb = SETTLEMENT_BODY_DEFAULTS[i] ?? SETTLEMENT_BODY_DEFAULTS[0];
        return localized(String(typed.ar ?? fb.ar), String(typed.en ?? fb.en));
      }
      return SETTLEMENT_BODY_DEFAULTS[i] ?? SETTLEMENT_BODY_DEFAULTS[0];
    });
  }
  return SETTLEMENT_BODY_DEFAULTS;
}

export const DEFAULT_ROSE_SETTLEMENT_TEMPLATE: RoseSettlementTemplateContent = {
  title: localized('مخالصة نهائية', 'Final Settlement'),
  bodyParagraphs: SETTLEMENT_BODY_DEFAULTS,
  footerApplicantLabel: localized('اسم الموظف/ة', 'Employee Name'),
  footerSignatureLabel: localized('التوقيع', 'Signature'),
  footerDateLabel: localized('التاريخ', 'Date'),
  fieldSlots: [
    { fieldKey: 'employee.name', visible: false },
    { fieldKey: 'employee.nationalId', visible: false },
    { fieldKey: 'employee.nationality', visible: false },
    { fieldKey: 'employee.branch', visible: false },
    { fieldKey: 'employee.position', visible: false },
    { fieldKey: 'employee.department', visible: false },
    { fieldKey: 'employee.employeeCode', visible: false },
    { fieldKey: 'employee.gender', visible: false },
    { fieldKey: 'employee.hireDate', visible: false },
    { fieldKey: 'employee.email', visible: false },
    { fieldKey: 'employee.phone', visible: false },
    { fieldKey: 'employee.address', visible: false },
    { fieldKey: 'employee.nameEn', visible: false },
  ],
};

export function normalizeSettlementTemplate(raw: Record<string, unknown>): RoseSettlementTemplateContent {
  const fallback = DEFAULT_ROSE_SETTLEMENT_TEMPLATE;
  return {
    title: readLocalizedPair(raw, 'title', 'titleAr', 'titleEn', fallback.title),
    bodyParagraphs: readParagraphs(raw),
    footerApplicantLabel: readLocalizedPair(raw, 'footerApplicantLabel', 'footerApplicantLabelAr', 'footerApplicantLabelEn', fallback.footerApplicantLabel),
    footerSignatureLabel: readLocalizedPair(raw, 'footerSignatureLabel', 'footerSignatureLabelAr', 'footerSignatureLabelEn', fallback.footerSignatureLabel),
    footerDateLabel: readLocalizedPair(raw, 'footerDateLabel', 'footerDateLabelAr', 'footerDateLabelEn', fallback.footerDateLabel),
    fieldSlots: Array.isArray(raw.fieldSlots) && raw.fieldSlots.length > 0
      ? raw.fieldSlots as RoseSettlementTemplateContent['fieldSlots']
      : fallback.fieldSlots,
  };
}
