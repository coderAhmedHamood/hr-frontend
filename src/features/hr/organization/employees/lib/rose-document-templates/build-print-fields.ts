/**
 * Builds fully filled PDF field objects from:
 * - admin input (few modal fields)
 * - employee profile (name, branch, nationality, nationalId, job, department, dates)
 * - company (institution / letterhead name)
 *
 * Rule: every printed slot on the PDF must have a value when `fields` is passed.
 * Approval signature lines stay empty (handwritten on paper) unless the record has them.
 */

import type { Employee } from '@/features/hr/organization/employees/types';
import type { CashReceiptVoucherDto } from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import type { EmployeeResignationDto } from '@/features/hr/organization/employees/lib/api/employee-resignations';
import type { EmployeeClearanceDto } from '@/features/hr/organization/employees/lib/api/employee-clearances';
import type { ExperienceCertificateDto } from '@/features/hr/organization/employees/lib/api/experience-certificates';
import type { RoseSettlementRecord } from '@/features/hr/organization/employees/lib/employee-rose-forms/types';
import type { CashReceiptPrintFields } from '@/features/hr/payroll/reports/components/pdf-cash-receipt-print-html';
import type { RoseResignationPrintFields } from '@/components/pdf/rose-trading/rose-resignation-print-html';
import type { RoseClearancePrintFields } from '@/components/pdf/rose-trading/rose-clearance-print-html';
import type { RoseExperiencePrintFields } from '@/components/pdf/rose-trading/rose-experience-print-html';
import type { RoseSettlementPrintFields } from '@/components/pdf/rose-trading/rose-settlement-print-html';
import { formatGregorianDateAr } from '@/features/hr/organization/employees/lib/rose-document-templates/format-document-dates';

function dash(value: string | null | undefined, fallback = '—'): string {
  const t = value?.trim();
  return t ? t : fallback;
}

function formatAmount(amount: string | number): string {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export type RosePdfContext = {
  employee: Employee;
  companyNameAr: string;
};

/**
 * سند راتب
 * Admin: رقم، تاريخ، مبلغ، كتابة، غرض (+ شهر/سنة أو أيام أو بيان)
 * Auto: المستلم، المؤسسة، الفرع، اسم التوقيع
 * Blank on paper: تواقيع الاعتماد (unless saved on record)
 */
export function buildCashReceiptPrintFields(
  card: CashReceiptVoucherDto,
  ctx: RosePdfContext,
): CashReceiptPrintFields {
  const emp = ctx.employee;
  return {
    recipientName: dash(card.recipientNameAr, dash(emp.name)),
    institutionName: dash(card.institutionNameAr, dash(ctx.companyNameAr)),
    branchName: dash(card.branchNameAr, dash(emp.branchNameAr)),
    amount: formatAmount(card.amount),
    purpose: card.purpose,
    purposeMonth: card.purposeMonth,
    purposeYear: card.purposeYear,
    overtimeDays: card.overtimeDays,
    otherDescription: card.otherDescription,
    signatureName: dash(card.signatureName, dash(card.recipientNameAr, dash(emp.name))),
    receiptDate: formatGregorianDateAr(card.receiptDate),
    branchManagerSignatureName: card.branchManagerSignatureName,
    hrAffairsSignatureName: card.hrAffairsSignatureName,
    generalSupervisorSignatureName: card.generalSupervisorSignatureName,
    financialManagerSignatureName: card.financialManagerSignatureName,
  };
}

/**
 * طلب استقالة
 * Admin: رقم، تواريخ، أسباب، هجري اختياري
 * Auto: الاسم، الفرع، الوظيفة، الجنسية، التوقيع
 */
export function buildResignationPrintFields(
  card: EmployeeResignationDto,
  ctx: RosePdfContext,
): RoseResignationPrintFields {
  const emp = ctx.employee;
  return {
    applicantName: dash(card.applicantName, dash(card.employeeNameAr, dash(emp.name))),
    branchName: dash(card.branchNameAr, dash(emp.branchNameAr)),
    jobTitle: dash(card.jobTitle, dash(emp.position)),
    nationality: dash(card.nationality, dash(emp.nationality)),
    reasons: dash(card.reasons),
    effectiveDateHijri: card.effectiveDateHijri?.trim() || null,
    effectiveDateGregorian: formatGregorianDateAr(card.effectiveDateGregorian),
    signatureName: dash(card.signatureName, dash(card.applicantName, dash(emp.name))),
    submissionDate: formatGregorianDateAr(card.submissionDate),
  };
}

/**
 * إخلاء طرف
 * Admin: رقم، تاريخ، مسمى (API)، أسباب
 * Auto: اسم الموظفة، رقم الهوية، التوقيع
 */
export function buildClearancePrintFields(
  card: EmployeeClearanceDto,
  ctx: RosePdfContext,
): RoseClearancePrintFields {
  const emp = ctx.employee;
  return {
    employeeName: dash(card.employeeNameAr, dash(card.signatureName, dash(emp.name))),
    nationalId: dash(card.nationalId, dash(emp.nationalId)),
    reasons: dash(card.reasons),
    signatureName: dash(card.signatureName, dash(emp.name)),
    clearanceDate: formatGregorianDateAr(card.clearanceDate),
  };
}

/**
 * شهادة خبرة
 * Admin: رقم، تاريخ إصدار، بداية/نهاية خدمة، مسمى
 * Auto: اسم الموظف، الشركة، القسم
 */
export function buildExperiencePrintFields(
  card: ExperienceCertificateDto,
  ctx: RosePdfContext,
): RoseExperiencePrintFields {
  const emp = ctx.employee;
  return {
    certificateDate: formatGregorianDateAr(card.issuanceDate),
    employeeName: dash(card.employeeNameAr, dash(emp.name)),
    companyName: dash(ctx.companyNameAr),
    department: dash(emp.departmentNameAr),
    position: dash(card.jobTitleOnCertificate, dash(emp.position)),
    startDate: formatGregorianDateAr(card.serviceStartDate),
    endDate: formatGregorianDateAr(card.serviceEndDate || card.issuanceDate),
  };
}

/**
 * مخالصة نهائية
 * Admin: رقم، تاريخ (+ هجري اختياري إن وُجد على السجل)
 * Auto: الاسم، الجنسية، رقم الأحوال، الشركة
 */
export function buildSettlementPrintFields(
  row: RoseSettlementRecord,
  ctx: RosePdfContext,
): RoseSettlementPrintFields {
  const emp = ctx.employee;
  return {
    employeeName: dash(row.employeeName, dash(emp.name)),
    nationality: dash(row.nationality, dash(emp.nationality)),
    nationalId: dash(row.nationalId, dash(emp.nationalId)),
    endDateGregorian: formatGregorianDateAr(row.documentDate),
    endDateHijri: row.documentDateHijri?.trim() || null,
    companyName: dash(row.companyNameAr, dash(ctx.companyNameAr)),
  };
}

/** Snapshot fields sent on create so the API stores what the PDF will print. */
export function cashReceiptAutoSnapshot(ctx: RosePdfContext) {
  return {
    branchNameAr: ctx.employee.branchNameAr?.trim() || undefined,
    institutionNameAr: ctx.companyNameAr.trim() || undefined,
    signatureName: ctx.employee.name?.trim() || undefined,
  };
}

export function resignationAutoSnapshot(ctx: RosePdfContext) {
  return {
    branchNameAr: ctx.employee.branchNameAr?.trim() || undefined,
    jobTitle: ctx.employee.position?.trim() || undefined,
    nationality: ctx.employee.nationality?.trim() || undefined,
    applicantName: ctx.employee.name?.trim() || undefined,
    signatureName: ctx.employee.name?.trim() || undefined,
  };
}

export function clearanceAutoSnapshot(ctx: RosePdfContext) {
  return {
    signatureName: ctx.employee.name?.trim() || undefined,
    nationalId: ctx.employee.nationalId?.trim() || undefined,
  };
}
