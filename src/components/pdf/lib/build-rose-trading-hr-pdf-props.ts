import type { Employee } from '@/features/hr/organization/employees/types';
import { ROSE_TRADING_COMPANY_AR_DEFAULT } from '@/features/hr/organization/employees/lib/employee-rose-forms/types';

function toHijri(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function toGregorianAr(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('ar-SA-u-ca-gregory', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

/** Salutation line for experience certificate from `Employee.gender`. */
export function experienceRecipientLine(emp: Employee): string {
  const title = emp.gender === 'female' ? 'السيدة' : 'السيد';
  return `${title} / ${emp.name}`;
}

export type RoseTradingHrPdfContext = {
  employee: Employee;
  branchNameAr: string;
  departmentNameAr: string;
};

/**
 * Builds dynamic props for the four Rose Trading HR PDFs from the employee profile.
 * Optional overrides let HR adjust dates or legal placeholders before export (UI can extend later).
 */
export type RoseTradingHrPdfOverrides = {
  absenceStartIso?: string;
  clearanceReasonAr?: string;
  settlementServiceStartIso?: string;
  certificateEndIso?: string;
  certificateIssueIso?: string;
  resignationAddressedToAr?: string;
  resignationReasonLines?: string[];
};
export function buildRoseTradingHrPdfProps(
  ctx: RoseTradingHrPdfContext,
  overrides?: RoseTradingHrPdfOverrides,
) {
  const { employee, branchNameAr, departmentNameAr } = ctx;
  const absenceIso = overrides?.absenceStartIso ?? new Date().toISOString().slice(0, 10);
  const serviceStart = overrides?.settlementServiceStartIso ?? employee.startDate;
  const certEnd =
    overrides?.certificateEndIso ?? employee.endDate ?? new Date().toISOString().slice(0, 10);
  const certIssue = overrides?.certificateIssueIso ?? new Date().toISOString().slice(0, 10);

  return {
    resignation: {
      employeeNameAr: employee.name,
      companyNameAr: ROSE_TRADING_COMPANY_AR_DEFAULT,
      branchAr: branchNameAr,
      positionAr: employee.position,
      nationalityAr: employee.nationality,
      absenceStartHijri: toHijri(absenceIso),
      absenceStartGregorian: toGregorianAr(absenceIso),
      footerApplicantName: employee.name,
      footerDateGregorian: toGregorianAr(new Date().toISOString().slice(0, 10)),
      addressedToAr: overrides?.resignationAddressedToAr ?? '',
      reasonLinesAr: overrides?.resignationReasonLines,
    },
    clearance: {
      employeeNameAr: employee.name,
      nationalId: employee.nationalId,
      reasonForClearanceAr: overrides?.clearanceReasonAr ?? 'إنهاء عقد العمل بالتراضي / انتهاء الخدمة — يُحدَّد نصياً عند الطباعة.',
      footerName: employee.name,
      footerDateGregorian: toGregorianAr(new Date().toISOString().slice(0, 10)),
    },
    settlement: {
      employeeNameAr: employee.name,
      nationalityAr: employee.nationality,
      nationalId: employee.nationalId,
      serviceStartGregorian: toGregorianAr(serviceStart),
      serviceStartHijri: toHijri(serviceStart),
      endDateGregorian: toGregorianAr(certEnd),
      endDateHijri: toHijri(certEnd),
      footerName: employee.name,
      footerDateGregorian: toGregorianAr(new Date().toISOString().slice(0, 10)),
    },
    experience: {
      certificateDateGregorian: toGregorianAr(certIssue),
      companyNameAr: ROSE_TRADING_COMPANY_AR_DEFAULT,
      recipientLineAr: experienceRecipientLine(employee),
      departmentAr: departmentNameAr,
      jobTitleAr: employee.position,
      startDateGregorian: toGregorianAr(employee.startDate),
      endDateGregorian: toGregorianAr(certEnd),
      workedVerbAr: (employee.gender === 'female' ? 'عملت' : 'عمل') as 'عمل' | 'عملت',
      performanceClosingAr:
        employee.gender === 'female'
          ? 'وقد أدت مهامها بجدية واقتدار.'
          : 'وقد أدى مهامه بجدية واقتدار.',
    },
  };
}
