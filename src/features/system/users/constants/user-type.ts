/**
 * Mirror of backend `UserType` (`hr-backend/.../enums/user-type.enum.ts`).
 * Keep order and values in sync with `USER_TYPE_VALUES` there.
 */
export const USER_TYPE_VALUES = [
  'internal_employee',
  'external_customer',
  'supplier',
  'partner',
  'sales_rep_external',
  'visitor',
  'contractor',
  'pos_user',
  'system_admin',
  'platform_admin',
  'support_user',
  'api_client',
  'service_account',
] as const;

export type UserType = (typeof USER_TYPE_VALUES)[number];

export const USER_TYPE_LABELS_AR: Record<UserType, string> = {
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

/** Backend rejects creating/assigning platform_admin via POST/PATCH /users. */
export const USER_TYPE_VALUES_ADMIN_FORM: UserType[] = USER_TYPE_VALUES.filter(
  (t) => t !== 'platform_admin',
);

export type UserTypeOption = { value: UserType; label: string };

function toOptions(values: readonly UserType[]): UserTypeOption[] {
  return values.map((value) => ({
    value,
    label: USER_TYPE_LABELS_AR[value],
  }));
}

/** Same list for create user, edit user, and profile type panel. */
export const USER_TYPE_FORM_OPTIONS = toOptions(USER_TYPE_VALUES_ADMIN_FORM);

export function isKnownUserType(value: string | null | undefined): value is UserType {
  if (!value) return false;
  return (USER_TYPE_VALUES as readonly string[]).includes(value);
}

export function userTypeLabelAr(value: string | null | undefined): string {
  if (!value) return '—';
  if (isKnownUserType(value)) return USER_TYPE_LABELS_AR[value];
  return value;
}

/** Portal accounts — staff `/auth/login` is blocked (partner portal only). */
export const PARTNER_PORTAL_USER_TYPES = new Set<UserType>([
  'external_customer',
  'supplier',
  'partner',
  'visitor',
  'sales_rep_external',
  'contractor',
]);

export function isPartnerPortalUserType(userType: string | null | undefined): boolean {
  return isKnownUserType(userType) && PARTNER_PORTAL_USER_TYPES.has(userType);
}

/**
 * Form select options — includes current value when read-only types (e.g. platform_admin)
 * so the UI never shows a blank/wrong label after load.
 */
export function userTypeFormOptions(current?: string | null): UserTypeOption[] {
  const base = USER_TYPE_FORM_OPTIONS;
  if (!current || !isKnownUserType(current)) return base;
  if (current === 'platform_admin') {
    return [{ value: current, label: USER_TYPE_LABELS_AR.platform_admin }];
  }
  if (base.some((o) => o.value === current)) return base;
  return [{ value: current, label: USER_TYPE_LABELS_AR[current] }, ...base];
}
