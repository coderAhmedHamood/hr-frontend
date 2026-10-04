/**
 * Common `users.status` values (varchar on backend — not a Postgres enum).
 * Same options on create and edit.
 */
export const USER_STATUS_VALUES = ['active', 'inactive', 'suspended', 'pending'] as const;

export type UserStatus = (typeof USER_STATUS_VALUES)[number];

export const USER_STATUS_LABELS_AR: Record<UserStatus, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  suspended: 'موقوف',
  pending: 'قيد المراجعة',
};

export const USER_STATUS_FORM_OPTIONS = USER_STATUS_VALUES.map((value) => ({
  value,
  label: USER_STATUS_LABELS_AR[value],
}));

export function userStatusLabelAr(value: string | null | undefined): string {
  if (!value) return '—';
  if ((USER_STATUS_VALUES as readonly string[]).includes(value)) {
    return USER_STATUS_LABELS_AR[value as UserStatus];
  }
  return value;
}
