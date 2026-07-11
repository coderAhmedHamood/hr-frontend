import type { UserResponseDto, UserCompanyLink, UserBranchLink } from '@/features/hr/organization/lib/api/users';
import { formatDisplayDateTime } from '@/shared/utils';

export type UserDraftForm = {
  email: string;
  password: string;
  fullNameAr: string;
  phone: string;
  userType: string;
  defaultCompanyId: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
};

export const EMPTY_USER_FORM: UserDraftForm = {
  email: '',
  password: '',
  fullNameAr: '',
  phone: '',
  userType: 'internal_employee',
  defaultCompanyId: '',
  status: 'active',
  isActive: true,
  isVerified: false,
};

/** Matches backend `UserType` enum (`users.user_type`). */
export const USER_TYPE_LABELS: Record<string, string> = {
  internal_employee: 'موظف داخلي',
  external_customer: 'عميل خارجي',
  supplier: 'مورد',
  partner: 'شريك',
  sales_rep_external: 'مندوب مبيعات خارجي',
  visitor: 'زائر',
  contractor: 'متعاقد',
  pos_user: 'مستخدم نقطة بيع',
  system_admin: 'مدير النظام',
  platform_admin: 'مدير المنصة',
  support_user: 'دعم فني',
  api_client: 'عميل API',
  service_account: 'حساب خدمة',
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

export function userToDraftForm(user: UserResponseDto): UserDraftForm {
  return {
    email: user.email ?? '',
    password: '',
    fullNameAr: user.fullNameAr ?? '',
    phone: user.phone ?? '',
    userType: user.userType ?? 'internal_employee',
    defaultCompanyId: user.defaultCompanyId ?? '',
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
  return formatDisplayDateTime(iso);
}
