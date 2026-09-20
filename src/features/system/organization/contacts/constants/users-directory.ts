import type { UserResponseDto, UserCompanyLink, UserBranchLink } from '@/features/hr/organization/lib/api/users';
import { formatDisplayDateTime } from '@/shared/utils';
import {
  isPartnerPortalUserType,
  USER_TYPE_FORM_OPTIONS,
  USER_TYPE_LABELS_AR,
  userTypeLabelAr,
  type UserType,
} from '@/features/system/users/constants/user-type';
import {
  USER_STATUS_FORM_OPTIONS,
  userStatusLabelAr,
} from '@/features/system/users/constants/user-status';

export type UserDraftForm = {
  email: string;
  password: string;
  fullNameAr: string;
  phone: string;
  userType: UserType;
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

/** @deprecated use USER_TYPE_LABELS_AR or userTypeLabelAr */
export const USER_TYPE_LABELS: Record<string, string> = USER_TYPE_LABELS_AR;

/** Create + edit + profile — aligned with backend `UserType` (except platform_admin). */
export const USER_TYPE_OPTIONS = USER_TYPE_FORM_OPTIONS;

/** @deprecated alias — use USER_TYPE_FORM_OPTIONS */
export const USER_TYPE_OPTIONS_EDITABLE = USER_TYPE_FORM_OPTIONS;

export { isPartnerPortalUserType };

export const USER_STATUS_OPTIONS = USER_STATUS_FORM_OPTIONS;

export { userTypeLabelAr, userStatusLabelAr };

export function userToDraftForm(user: UserResponseDto): UserDraftForm {
  const userType =
    user.userType && (USER_TYPE_LABELS_AR as Record<string, string>)[user.userType]
      ? (user.userType as UserType)
      : 'internal_employee';

  return {
    email: user.email ?? '',
    password: '',
    fullNameAr: user.fullNameAr ?? '',
    phone: user.phone ?? '',
    userType,
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
