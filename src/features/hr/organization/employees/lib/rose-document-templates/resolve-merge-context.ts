import type { Employee } from '@/features/hr/organization/employees/types';
import {
  formatGregorianDateAr,
  formatGregorianDateEn,
  formatHijriDate,
} from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';
import type { RoseMergeFieldKey } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type RoseMergeContextInput = {
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
  companyNameAr: string;
  companyNameEn: string;
  absenceStartHijri: string;
  absenceStartGregorian: string;
  footerDateGregorian: string;
  addressedToAr: string;
  addressedToEn: string;
  endDateHijri: string;
  endDateGregorian: string;
  serviceStartHijri: string;
  serviceStartGregorian: string;
  certificateDateGregorian: string;
  clearanceReasonAr: string;
  clearanceReasonEn: string;
};

const FALLBACK = '—';

function genderAr(gender: Employee['gender']): string {
  return gender === 'female' ? 'أنثى' : 'ذكر';
}

function genderEn(gender: Employee['gender']): string {
  return gender === 'female' ? 'Female' : 'Male';
}

export function resolveRoseMergeValue(
  key: RoseMergeFieldKey,
  ctx: RoseMergeContextInput,
): { ar: string; en?: string } {
  const { employee } = ctx;
  switch (key) {
    case 'employee.name':
      return { ar: employee.name || FALLBACK };
    case 'employee.nameEn':
      return { ar: employee.nameEn || FALLBACK, en: employee.nameEn || FALLBACK };
    case 'employee.employeeCode':
      return { ar: employee.employeeCode || FALLBACK };
    case 'employee.nationalId':
      return { ar: employee.nationalId || FALLBACK };
    case 'employee.nationality':
      return { ar: employee.nationality || FALLBACK };
    case 'employee.gender':
      return { ar: genderAr(employee.gender), en: genderEn(employee.gender) };
    case 'employee.position':
      return { ar: employee.position || FALLBACK };
    case 'employee.department':
      return { ar: ctx.departmentNameAr || FALLBACK };
    case 'employee.branch':
      return { ar: ctx.branchNameAr || FALLBACK };
    case 'employee.hireDate':
      return {
        ar: employee.startDate ? formatGregorianDateAr(employee.startDate) : FALLBACK,
        en: employee.startDate ? formatGregorianDateEn(employee.startDate) : FALLBACK,
      };
    case 'employee.email':
      return { ar: employee.email || FALLBACK };
    case 'employee.phone':
      return { ar: employee.phone || FALLBACK };
    case 'employee.address':
      return { ar: employee.address || FALLBACK };
    case 'company.nameAr':
      return { ar: ctx.companyNameAr || FALLBACK };
    case 'company.nameEn':
      return { ar: ctx.companyNameEn || FALLBACK, en: ctx.companyNameEn || FALLBACK };
    default:
      return { ar: FALLBACK };
  }
}

const MERGE_TOKEN_RE = /\{\{([a-zA-Z0-9_.]+)\}\}/g;

export function interpolateRoseTemplateText(
  template: string | undefined | null,
  tokens: Record<string, string>,
): string {
  if (!template) return '';
  return template.replace(MERGE_TOKEN_RE, (_, key: string) => tokens[key] ?? '');
}

export function experienceRecipientLineAr(gender: Employee['gender']): string {
  return gender === 'female' ? 'السيدة' : 'السيد';
}

export function experienceRecipientLineEn(gender: Employee['gender']): string {
  return gender === 'female' ? 'Ms.' : 'Mr.';
}

export function experienceWorkedVerbAr(gender: Employee['gender']): string {
  return gender === 'female' ? 'عملت' : 'عمل';
}

export function experienceWorkedVerbEn(gender: Employee['gender']): string {
  return gender === 'female' ? 'worked' : 'worked';
}

export function settlementEmployeeRefAr(gender: Employee['gender']): string {
  return gender === 'female' ? 'الموظفة' : 'الموظف';
}

export function settlementEmployeeRefEn(gender: Employee['gender']): string {
  return gender === 'female' ? 'the employee' : 'the employee';
}

export function buildRoseMergeTokens(ctx: RoseMergeContextInput): Record<string, string> {
  const { employee } = ctx;
  return {
    'company.nameAr': ctx.companyNameAr,
    'company.nameEn': ctx.companyNameEn,
    'form.absenceStartHijri': ctx.absenceStartHijri,
    'form.absenceStartGregorian': ctx.absenceStartGregorian,
    'form.footerDateGregorian': ctx.footerDateGregorian,
    'form.addressedToAr': ctx.addressedToAr,
    'form.addressedToEn': ctx.addressedToEn,
    'form.endDateHijri': ctx.endDateHijri,
    'form.endDateGregorian': ctx.endDateGregorian,
    'form.serviceStartHijri': ctx.serviceStartHijri,
    'form.serviceStartGregorian': ctx.serviceStartGregorian,
    'form.certificateDateGregorian': ctx.certificateDateGregorian,
    'form.clearanceReason': ctx.clearanceReasonAr,
    'form.clearanceReasonEn': ctx.clearanceReasonEn,
    'employee.name': employee.name || FALLBACK,
    'employee.nameEn': employee.nameEn || FALLBACK,
    'employee.nationalId': employee.nationalId || FALLBACK,
    'employee.nationality': employee.nationality || FALLBACK,
    'employee.position': employee.position || FALLBACK,
    'employee.department': ctx.departmentNameAr || FALLBACK,
    'employee.branch': ctx.branchNameAr || FALLBACK,
    'employee.recipientLine': experienceRecipientLineAr(employee.gender),
    'employee.recipientLineEn': experienceRecipientLineEn(employee.gender),
    'employee.workedVerb': experienceWorkedVerbAr(employee.gender),
    'employee.workedVerbEn': experienceWorkedVerbEn(employee.gender),
    'employee.settlementRef': settlementEmployeeRefAr(employee.gender),
    'employee.settlementRefEn': settlementEmployeeRefEn(employee.gender),
  };
}

type RoseMergeContextBuildInput = Omit<
  RoseMergeContextInput,
  | 'absenceStartHijri'
  | 'absenceStartGregorian'
  | 'footerDateGregorian'
  | 'endDateHijri'
  | 'endDateGregorian'
  | 'serviceStartHijri'
  | 'serviceStartGregorian'
  | 'certificateDateGregorian'
  | 'addressedToAr'
  | 'addressedToEn'
  | 'clearanceReasonAr'
  | 'clearanceReasonEn'
> & {
  absenceStartIso?: string;
  footerDateIso: string;
  endDateIso?: string;
  serviceStartIso?: string;
  certificateDateIso?: string;
  addressedToAr?: string;
  addressedToEn?: string;
  clearanceReasonAr?: string;
  clearanceReasonEn?: string;
};

export function buildRoseMergeContext(input: RoseMergeContextBuildInput): RoseMergeContextInput {
  const absenceIso = input.absenceStartIso ?? input.footerDateIso;
  const endIso = input.endDateIso ?? input.footerDateIso;
  const serviceIso = input.serviceStartIso ?? input.employee.startDate ?? input.footerDateIso;
  const certIso = input.certificateDateIso ?? input.footerDateIso;

  return {
    ...input,
    absenceStartHijri: formatHijriDate(absenceIso),
    absenceStartGregorian: formatGregorianDateAr(absenceIso),
    footerDateGregorian: formatGregorianDateAr(input.footerDateIso),
    endDateHijri: formatHijriDate(endIso),
    endDateGregorian: formatGregorianDateAr(endIso),
    serviceStartHijri: formatHijriDate(serviceIso),
    serviceStartGregorian: formatGregorianDateAr(serviceIso),
    certificateDateGregorian: formatGregorianDateAr(certIso),
    addressedToAr: input.addressedToAr ?? '',
    addressedToEn: input.addressedToEn ?? '',
    clearanceReasonAr: input.clearanceReasonAr ?? '',
    clearanceReasonEn: input.clearanceReasonEn ?? '',
  };
}

export function genderAwareClosingAr(gender: Employee['gender']): string {
  if (gender === 'female') {
    return 'الموافق : {{form.absenceStartGregorian}} م راجيةً من سيادتكم قبول طلبي هذا متمنية لكم التوفيق .';
  }
  return 'الموافق : {{form.absenceStartGregorian}} م راجياً من سيادتكم قبول طلبي هذا متمنية لكم التوفيق .';
}

export function genderAwareClosingEn(_gender: Employee['gender']): string {
  return 'I respectfully request your approval of this resignation and wish you continued success.';
}

export function genderAwareApplicantLabelAr(gender: Employee['gender']): string {
  return gender === 'female' ? 'اسم مقدمة الطلب' : 'اسم مقدم الطلب';
}
