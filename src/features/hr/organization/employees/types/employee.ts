import type { ContractStatus, ContractType } from '@/features/hr/contracts/types';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  nameEn: string;
  email: string;
  phone: string;
  nationalId: string;
  nationality: string;
  avatar: string;
  position: string;
  departmentId: string;
  branchId: string;
  branchNameAr?: string;
  departmentNameAr?: string;
  managerId: string | null;
  contractType: ContractType;
  contractStatus: ContractStatus;
  startDate: string;
  endDate?: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  gosi: number;
  bankAccount: string;
  iban: string;
  address: string;
  /** Optional location / administrative fields for search & display (mock/API). */
  openStream?: string;
  village?: string;
  district?: string;
  city?: string;
  emergencyContact: string;
  gender: 'male' | 'female';
  birthDate: string;
  maritalStatus: 'single' | 'married';
  role: string;
  /** ربط بدور النظام في إعدادات الصلاحيات (mock). عند الغياب يُستنتج من `role`. */
  assignedRoleId?: string | null;
  /** معرّف المستخدم المرتبط بالموظف — مطلوب لاستدعاء /users/:id/roles و /users/:id/permissions */
  userId?: string | null;
  /** هل لدى الموظف حساب مستخدم في النظام؟ (من GET /hr/employees/:id) */
  hasUser?: boolean;
}
