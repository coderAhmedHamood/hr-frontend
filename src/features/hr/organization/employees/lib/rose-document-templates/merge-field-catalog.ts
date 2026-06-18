import type { RoseMergeFieldKey } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type RoseMergeFieldMeta = {
  key: RoseMergeFieldKey;
  labelAr: string;
  labelEn: string;
  group: 'employee' | 'company';
};

export const ROSE_MERGE_FIELD_CATALOG: RoseMergeFieldMeta[] = [
  { key: 'employee.name', labelAr: 'الاسم', labelEn: 'Name', group: 'employee' },
  { key: 'employee.nameEn', labelAr: 'الاسم (إنجليزي)', labelEn: 'Name (English)', group: 'employee' },
  { key: 'employee.employeeCode', labelAr: 'الرقم الوظيفي', labelEn: 'Employee ID', group: 'employee' },
  { key: 'employee.nationalId', labelAr: 'رقم الهوية', labelEn: 'National ID', group: 'employee' },
  { key: 'employee.nationality', labelAr: 'الجنسية', labelEn: 'Nationality', group: 'employee' },
  { key: 'employee.gender', labelAr: 'الجنس', labelEn: 'Gender', group: 'employee' },
  { key: 'employee.position', labelAr: 'الوظيفة', labelEn: 'Job Title', group: 'employee' },
  { key: 'employee.department', labelAr: 'القسم', labelEn: 'Department', group: 'employee' },
  { key: 'employee.branch', labelAr: 'الفرع', labelEn: 'Branch', group: 'employee' },
  { key: 'employee.hireDate', labelAr: 'تاريخ الالتحاق', labelEn: 'Join Date', group: 'employee' },
  { key: 'employee.email', labelAr: 'البريد الإلكتروني', labelEn: 'Email', group: 'employee' },
  { key: 'employee.phone', labelAr: 'الجوال', labelEn: 'Phone', group: 'employee' },
  { key: 'employee.address', labelAr: 'العنوان', labelEn: 'Address', group: 'employee' },
  { key: 'company.nameAr', labelAr: 'اسم الشركة (عربي)', labelEn: 'Company (Arabic)', group: 'company' },
  { key: 'company.nameEn', labelAr: 'اسم الشركة (إنجليزي)', labelEn: 'Company (English)', group: 'company' },
];

export const ROSE_MERGE_FIELD_MAP = Object.fromEntries(
  ROSE_MERGE_FIELD_CATALOG.map((f) => [f.key, f]),
) as Record<RoseMergeFieldKey, RoseMergeFieldMeta>;
