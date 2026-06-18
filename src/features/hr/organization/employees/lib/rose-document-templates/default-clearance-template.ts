import { localized } from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import { readLocalizedPair } from '@/features/hr/organization/employees/lib/rose-document-templates/template-normalize';
import type { RoseClearanceTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export const DEFAULT_ROSE_CLEARANCE_TEMPLATE: RoseClearanceTemplateContent = {
  title: localized('نموذج إخلاء طرف', 'Clearance Form'),
  employeeNameLabel: localized('اسم الموظف/ة', 'Employee Name'),
  nationalIdLabel: localized('رقم الهوية', 'National ID'),
  legalDeclaration: localized(
    'أقر أنا الموقعة أدناه بأنني تسلمت جميع مستحقاتي المالية والعينية الناشئة عن علاقة العمل مع {{company.nameAr}} حتى تاريخ إخلاء الطرف، وبأن المؤسسة قد أدت ما عليها تجاهي بالكامل، وأبرئها إبراءً ذمة من أي التزامات أو مطالبات مستقبلية تخص فترة عملي لديها.',
    'I, the undersigned, acknowledge that I have received all financial and in-kind entitlements arising from my employment with {{company.nameEn}} up to the clearance date, and that the company has fulfilled all obligations toward me. I hereby release the company from any future claims related to my employment period.',
  ),
  reasonHeading: localized('سبب إخلاء الطرف:', 'Reason for clearance:'),
  footerNameLabel: localized('الاسم', 'Name'),
  footerDateLabel: localized('التاريخ', 'Date'),
  footerSignatureLabel: localized('التوقيع', 'Signature'),
  fieldSlots: [
    { fieldKey: 'employee.name', visible: true },
    { fieldKey: 'employee.nationalId', visible: true },
    { fieldKey: 'employee.branch', visible: false },
    { fieldKey: 'employee.position', visible: false },
    { fieldKey: 'employee.department', visible: false },
    { fieldKey: 'employee.nationality', visible: false },
    { fieldKey: 'employee.employeeCode', visible: false },
    { fieldKey: 'employee.gender', visible: false },
    { fieldKey: 'employee.hireDate', visible: false },
    { fieldKey: 'employee.email', visible: false },
    { fieldKey: 'employee.phone', visible: false },
    { fieldKey: 'employee.address', visible: false },
    { fieldKey: 'employee.nameEn', visible: false },
  ],
};

export function normalizeClearanceTemplate(raw: Record<string, unknown>): RoseClearanceTemplateContent {
  const fallback = DEFAULT_ROSE_CLEARANCE_TEMPLATE;
  return {
    title: readLocalizedPair(raw, 'title', 'titleAr', 'titleEn', fallback.title),
    employeeNameLabel: readLocalizedPair(raw, 'employeeNameLabel', 'employeeNameLabelAr', 'employeeNameLabelEn', fallback.employeeNameLabel),
    nationalIdLabel: readLocalizedPair(raw, 'nationalIdLabel', 'nationalIdLabelAr', 'nationalIdLabelEn', fallback.nationalIdLabel),
    legalDeclaration: readLocalizedPair(raw, 'legalDeclaration', 'legalDeclarationAr', 'legalDeclarationEn', fallback.legalDeclaration),
    reasonHeading: readLocalizedPair(raw, 'reasonHeading', 'reasonHeadingAr', 'reasonHeadingEn', fallback.reasonHeading),
    footerNameLabel: readLocalizedPair(raw, 'footerNameLabel', 'footerNameLabelAr', 'footerNameLabelEn', fallback.footerNameLabel),
    footerDateLabel: readLocalizedPair(raw, 'footerDateLabel', 'footerDateLabelAr', 'footerDateLabelEn', fallback.footerDateLabel),
    footerSignatureLabel: readLocalizedPair(raw, 'footerSignatureLabel', 'footerSignatureLabelAr', 'footerSignatureLabelEn', fallback.footerSignatureLabel),
    fieldSlots: Array.isArray(raw.fieldSlots) && raw.fieldSlots.length > 0
      ? raw.fieldSlots as RoseClearanceTemplateContent['fieldSlots']
      : fallback.fieldSlots,
  };
}
