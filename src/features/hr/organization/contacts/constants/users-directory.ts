import type { UserResponseDto, UserCompanyLink, UserBranchLink } from '@/features/hr/organization/lib/api/users';

export type UserDraftForm = {
  email: string;
  password: string;
  fullNameAr: string;
  fullNameEn: string;
  phone: string;
  userType: string;
  defaultCompanyId: string;
  defaultBranchId: string;
  employeeId: string;
  languageCode: string;
  timezone: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
};

export const EMPTY_USER_FORM: UserDraftForm = {
  email: '',
  password: '',
  fullNameAr: '',
  fullNameEn: '',
  phone: '',
  userType: 'internal_employee',
  defaultCompanyId: '',
  defaultBranchId: '',
  employeeId: '',
  languageCode: 'ar',
  timezone: 'Asia/Riyadh',
  status: 'active',
  isActive: true,
  isVerified: false,
};

export const USER_TYPE_LABELS: Record<string, string> = {
  internal_employee: 'موظف داخلي',
  external: 'مستخدم خارجي',
  admin: 'مدير النظام',
  platform_admin: 'مدير المنصة',
  supervisor: 'مشرف',
  viewer: 'مستعرض',
};

export const USER_TYPE_OPTIONS = Object.entries(USER_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'نشط' },
  { value: 'inactive', label: 'غير نشط' },
  { value: 'suspended', label: 'موقوف' },
  { value: 'pending', label: 'قيد المراجعة' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (الرياض)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai' },
  { value: 'UTC', label: 'UTC' },
];

export function userToDraftForm(user: UserResponseDto): UserDraftForm {
  return {
    email: user.email ?? '',
    password: '',
    fullNameAr: user.fullNameAr ?? '',
    fullNameEn: user.fullNameEn ?? '',
    phone: user.phone ?? '',
    userType: user.userType ?? 'internal_employee',
    defaultCompanyId: user.defaultCompanyId ?? '',
    defaultBranchId: user.defaultBranchId ?? '',
    employeeId: user.employeeId ?? '',
    languageCode: user.languageCode ?? 'ar',
    timezone: user.timezone ?? 'Asia/Riyadh',
    status: user.status ?? 'active',
    isActive: user.isActive,
    isVerified: user.isVerified,
  };
}

export function companyLinkLabel(link: UserCompanyLink): string {
  return link.companyNameAr ?? link.companyCode ?? link.companyId.slice(0, 8);
}

export function branchLinkLabel(link: UserBranchLink): string {
  return link.branchNameAr ?? link.branchCode ?? link.branchId.slice(0, 8);
}

export function formatUserDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ar-SA');
}
