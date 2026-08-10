import { localized } from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import { readLocalizedPair } from '@/features/hr/organization/employees/lib/rose-document-templates/template-normalize';
import type { RoseExperienceTemplateContent } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export const DEFAULT_ROSE_EXPERIENCE_TEMPLATE: RoseExperienceTemplateContent = {
  title: localized('شهادة خبرة', 'Experience Certificate'),
  bodyIntro: localized(
    'هذه الشهادة لتأكيد أن {{employee.recipientLine}} {{employee.name}} قد {{employee.workedVerb}} في شركة {{company.nameAr}} بمنصب {{employee.position}} منذ {{form.serviceStartGregorian}} وحتى {{form.endDateGregorian}}.',
    'This certificate confirms that {{employee.recipientLineEn}} {{employee.name}} has {{employee.workedVerbEn}} at {{company.nameEn}} as {{employee.position}} from {{form.serviceStartGregorian}} until {{form.endDateGregorian}}.',
  ),
  performanceHeading: localized(
    'خلال فترة عمله معنا، وجدنا أنه:',
    'During their employment with us, we found that they:',
  ),
  performanceTraits: localized(
    'فرد أنيق المظهر، حسن المعاملة، مبادر للعمل وسريع البديهة، قادر على تحمل ضغوط العمل، وفرد ممتاز في فريق العمل.',
    'Well-groomed, courteous, proactive, quick-thinking, able to handle work pressure, and an excellent team player.',
  ),
  closingWish: localized(
    'نتمنى له الأفضل في ما سيأتي في حياته المهنية،،،',
    'We wish them the best in their future professional life.',
  ),
  managerSignatureTitle: localized('المدير العام', 'General Manager'),
  fieldSlots: [
    { fieldKey: 'employee.name', visible: false },
    { fieldKey: 'employee.position', visible: false },
    { fieldKey: 'employee.department', visible: false },
    { fieldKey: 'employee.branch', visible: false },
    { fieldKey: 'employee.nationalId', visible: false },
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

export function normalizeExperienceTemplate(raw: Record<string, unknown>): RoseExperienceTemplateContent {
  const fallback = DEFAULT_ROSE_EXPERIENCE_TEMPLATE;
  return {
    title: readLocalizedPair(raw, 'title', 'titleAr', 'titleEn', fallback.title),
    bodyIntro: readLocalizedPair(raw, 'bodyIntro', 'bodyIntroAr', 'bodyIntroEn', fallback.bodyIntro),
    performanceHeading: readLocalizedPair(raw, 'performanceHeading', 'performanceHeadingAr', 'performanceHeadingEn', fallback.performanceHeading),
    performanceTraits: readLocalizedPair(raw, 'performanceTraits', 'performanceTraitsAr', 'performanceTraitsEn', fallback.performanceTraits),
    closingWish: readLocalizedPair(raw, 'closingWish', 'closingWishAr', 'closingWishEn', fallback.closingWish),
    managerSignatureTitle: readLocalizedPair(raw, 'managerSignatureTitle', 'managerSignatureTitleAr', 'managerSignatureTitleEn', fallback.managerSignatureTitle),
    fieldSlots: Array.isArray(raw.fieldSlots) && raw.fieldSlots.length > 0
      ? raw.fieldSlots as RoseExperienceTemplateContent['fieldSlots']
      : fallback.fieldSlots,
  };
}
