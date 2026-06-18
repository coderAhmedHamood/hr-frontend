import type { Employee } from '@/features/hr/organization/employees/types';
import type { EmployeeAuditRowInput, EmployeeAuditScope } from '@/features/hr/organization/employees/lib/employee-audit-log/types';

const SKIP = new Set<string>(['id']);

const LABELS: Partial<Record<keyof Employee, string>> = {
  name: 'الاسم',
  nameEn: 'الاسم بالإنجليزية',
  nationalId: 'رقم الهوية',
  nationality: 'الجنسية',
  birthDate: 'تاريخ الميلاد',
  email: 'البريد',
  phone: 'الجوال',
  address: 'العنوان',
  gender: 'الجنس',
  maritalStatus: 'الحالة الاجتماعية',
  position: 'المسمى الوظيفي',
  departmentId: 'القسم',
  branchId: 'الفرع',
  contractType: 'نوع العقد',
  contractStatus: 'حالة العقد',
  startDate: 'تاريخ الالتحاق',
  endDate: 'نهاية العقد (السجل الرئيسي)',
  baseSalary: 'الراتب الأساسي',
  housingAllowance: 'بدل سكن',
  transportAllowance: 'بدل انتقال',
  otherAllowances: 'بدلات أخرى',
  gosi: 'التأمينات',
  bankAccount: 'حساب بنكي',
  iban: 'الآيبان',
  emergencyContact: 'طوارئ',
  role: 'دور النظام (رمز)',
  assignedRoleId: 'معرف الدور المعيّن',
  managerId: 'المدير المباشر',
  employeeCode: 'الرقم الوظيفي',
};

function asStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** مقارنة ضحلة بين نسختين من نفس الموظف — صف واحد لكل حقل تغيّر. */
export function diffEmployeeShallowAudit(
  before: Employee,
  after: Employee,
  scope: EmployeeAuditScope = 'personal',
): EmployeeAuditRowInput[] {
  const out: EmployeeAuditRowInput[] = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]) as Set<keyof Employee>;
  for (const key of keys) {
    if (SKIP.has(key as string)) continue;
    const ov = asStr(before[key]);
    const nv = asStr(after[key]);
    if (ov === nv) continue;
    out.push({
      action: 'update',
      scope,
      fieldKey: String(key),
      labelAr: LABELS[key] ?? String(key),
      oldValue: ov,
      newValue: nv,
    });
  }
  return out;
}
