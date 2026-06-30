export type EmployeeAuditAction = 'create' | 'update' | 'delete';

export type EmployeeAuditScope =
  | 'personal'
  | 'permissions'
  | 'rose-resignation'
  | 'rose-clearance'
  | 'rose-settlement'
  | 'rose-experience';

export interface EmployeeAuditEntry {
  id: string;
  targetEmployeeId: string;
  at: string;
  action: EmployeeAuditAction;
  scope: EmployeeAuditScope;
  fieldKey: string;
  labelAr: string;
  oldValue: string;
  newValue: string;
  actorEmployeeId: string | null;
  actorNameAr: string;
}

export type EmployeeAuditRowInput = Omit<
  EmployeeAuditEntry,
  'id' | 'at' | 'targetEmployeeId' | 'actorEmployeeId' | 'actorNameAr'
>;

export const EMPLOYEE_AUDIT_SCOPE_LABELS: Record<EmployeeAuditScope, string> = {
  personal: 'البيانات الشخصية',
  permissions: 'صلاحيات الموظف',
  'rose-resignation': 'نماذج — استقالة',
  'rose-clearance': 'نماذج — إخلاء طرف',
  'rose-settlement': 'نماذج — مخالصة',
  'rose-experience': 'نماذج — شهادة خبرة',
};

export const EMPLOYEE_AUDIT_ACTION_LABELS: Record<EmployeeAuditAction, string> = {
  create: 'إضافة',
  update: 'تعديل',
  delete: 'حذف',
};
